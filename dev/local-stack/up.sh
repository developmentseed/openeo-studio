#!/usr/bin/env bash
# Bring up the local openEO stack: a kind cluster running Keycloak and titiler-openeo (OCI chart) on live
# Planetary Computer data. Idempotent: re-run it after changing anything here. See README.md.
#   TITILER_REF    titiler-openeo commit to build: a full SHA, or any ref of TITILER_REPO when that is set
#   TITILER_REPO   local titiler-openeo clone to build from (default: fetch TITILER_REF from GitHub)
#   CHART_VERSION  titiler-openeo chart version
set -euo pipefail
cd "$(dirname "$0")"

CLUSTER=openeo-local   # must match kind.yaml
NS=openeo-dev          # must match the in-cluster Keycloak URL in values/titiler.yaml
# >= c9b6ee3: the scenarios need apply_kernel and /queryables, which the v0.19.0 tag lacks.
TITILER_REF=${TITILER_REF:-b98184943f4341ef2ea985fd07ceec07f7d89a42}
CHART_VERSION=${CHART_VERSION:-3.1.0}
export KUBECONFIG=$PWD/kubeconfig   # keep ~/.kube/config untouched

die() { echo "up.sh: $*" >&2; exit 1; }
for tool in docker kind kubectl helm jq curl git; do
  command -v "$tool" >/dev/null || die "$tool not found (see Prerequisites in README.md)"
done
docker info >/dev/null 2>&1 ||
  die "docker is not reachable: start Docker (on Linux, also check that your user can run docker without sudo)"

if [ -n "${TITILER_REPO:-}" ]; then
  SHA=$(git -C "$TITILER_REPO" rev-parse --verify --quiet "$TITILER_REF^{commit}") ||
    die "$TITILER_REF is not a commit in $TITILER_REPO"
else
  SHA=$TITILER_REF
  [[ $SHA =~ ^[0-9a-f]{40}$ ]] || die "TITILER_REF must be a full commit SHA when TITILER_REPO is not set"
fi
TAG=${SHA:0:7}
IMAGE=titiler-openeo:$TAG   # one tag per commit, so a new commit always rolls the pod

# grep without -q: an early exit would make kind fail on SIGPIPE, and pipefail would report it.
if kind get clusters 2>/dev/null | grep -x "$CLUSTER" >/dev/null; then
  kind export kubeconfig --name "$CLUSTER" --kubeconfig "$KUBECONFIG"   # recreates it if deleted
else
  for port in 8081 8082 9000; do
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
      die "127.0.0.1:$port is in use; the stack needs 8081 (API), 8082 (Keycloak) and 9000 (Studio)"
    fi
  done
  kind create cluster --config kind.yaml --kubeconfig "$KUBECONFIG"
fi

# Native build (arm64 on Apple silicon): published images are amd64-only. git archive takes committed code only.
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  src=${TITILER_REPO:-}
  if [ -z "$src" ]; then
    src=$(mktemp -d "${TMPDIR:-/tmp}/titiler-openeo.XXXXXX")
    trap 'rm -rf "$src"' EXIT
    git -C "$src" init -q
    git -C "$src" fetch -q --depth 1 https://github.com/sentinel-hub/titiler-openeo.git "$SHA"
  fi
  echo "Building $IMAGE"
  git -C "$src" archive --format=tar "$SHA" | docker build -t "$IMAGE" -
fi
kind load docker-image "$IMAGE" --name "$CLUSTER"

kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -
realm=$(kubectl -n "$NS" create configmap keycloak-realm --from-file=realm/openeo-realm.json \
  --dry-run=client -o yaml | kubectl apply -f -)
echo "$realm"
kubectl -n "$NS" apply -f k8s/keycloak.yaml -f k8s/entrypoints.yaml
[[ $realm == *configured* ]] && kubectl -n "$NS" rollout restart deploy/keycloak   # realm is imported at startup only
kubectl -n "$NS" rollout status deploy/keycloak --timeout=300s

redeploy=$(kubectl -n "$NS" get deploy dev-titiler-openeo -o name 2>/dev/null || true)
helm upgrade --install dev oci://ghcr.io/developmentseed/charts/titiler-openeo --version "$CHART_VERSION" \
  -n "$NS" -f values/titiler.yaml --set image.tag="$TAG"
# On a re-deploy the previous pod keeps answering /healthz until the new one passes /readyz.
if [ -n "$redeploy" ]; then
  kubectl -n "$NS" rollout status deploy/dev-titiler-openeo --timeout=300s ||
    echo "up.sh: warning: rollout not finished, the previous pod may still be serving" >&2
fi

# Gate on /healthz, not helm --wait: /readyz also pings Planetary Computer with a 2 s timeout.
# The pod crash-loops until postgres accepts connections (no wait-for-db upstream), about 20 s.
echo "Waiting for http://localhost:8081/healthz"
for _ in $(seq 150); do curl -fs -m 5 -o /dev/null http://localhost:8081/healthz && break; sleep 2; done
curl -fs -m 5 -o /dev/null http://localhost:8081/healthz ||
  die "titiler-openeo is not healthy; see: KUBECONFIG=$KUBECONFIG kubectl -n $NS logs deploy/dev-titiler-openeo"
echo "titiler-openeo $(curl -fsS http://localhost:8081/ | jq -r .backend_version) ($IMAGE) up at http://localhost:8081"
echo "Keycloak at http://localhost:8082 (test user dev / dev). Next: make smoke, then make studio."
