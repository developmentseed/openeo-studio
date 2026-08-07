# openeo-studio

A Helm chart to deploy [openEO Studio](https://github.com/developmentseed/openeo-studio) — a static single-page app served by nginx — on Kubernetes.

This file documents the chart for contributors; it is excluded from the packaged chart via `.helmignore`.

## Installing

```sh
helm install my-studio charts/openeo-studio \
  --set env.OPENEO_API_URL=https://openeo.example.org \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=studio.example.org
```

## Values

| Key | Default | Description |
| --- | --- | --- |
| `replicaCount` | `1` | Number of pod replicas |
| `image.repository` | `ghcr.io/developmentseed/openeo-studio` | Container image |
| `image.tag` | `""` | Image tag; defaults to `Chart.appVersion` when empty |
| `image.pullPolicy` | `IfNotPresent` | Image pull policy |
| `imagePullSecrets` | `[]` | Secrets for pulling from a private registry |
| `nameOverride` / `fullnameOverride` | `""` | Override the chart/release-derived resource name |
| `service.type` | `ClusterIP` | Kubernetes Service type |
| `service.port` | `80` | Service port |
| `ingress.enabled` | `false` | Create an Ingress resource |
| `ingress.className` | `""` | `ingressClassName` |
| `ingress.annotations` | `{}` | Extra Ingress annotations (e.g. `cert-manager.io/cluster-issuer`) |
| `ingress.hosts` | see `values.yaml` | Host/path rules |
| `ingress.tls` | `[]` | TLS configuration |
| `resources` | `{}` | Pod resource requests/limits |
| `env` | see `values.yaml` | Runtime configuration passed to the container as env vars — read by `docker/90-app-config.sh` at container start (see the [Docker section of the project README](../../README.md#docker)) |
| `envFromSecret` | `[]` | Source specific `env` keys from a pre-existing Secret instead of a literal value — see below |
| `nodeSelector` / `tolerations` / `affinity` | `{}` / `[]` / `{}` | Standard pod scheduling controls |

### About `env`

The app image is built once and configured per-container at startup, not at build time. Every key under `env` becomes a container environment variable; the entrypoint script reads a fixed set of them (`OPENEO_API_URL`, `BASE_URL`, `APP_TITLE`, `APP_DESCRIPTION`, `MAPTILER_KEY`, `AUTH_AUTHORITY`, `AUTH_CLIENT_ID`, `AUTH_REDIRECT_URI`, `ENABLE_NARRATIVE_EXPORT`) and writes them into `index.html` and nginx's rewrite rules. `BASE_URL` is the single source of truth for the app's mount path — there is no separate `PATH_PREFIX` variable to set.

### Sourcing a value from a Secret

`MAPTILER_KEY` (or any other `env` key) can be pulled from an existing Secret instead of set as a literal value. A name listed in `envFromSecret` takes over from `env` entirely — the container gets exactly one env var of that name, via `secretKeyRef`:

```sh
kubectl create secret generic openeo-studio-secrets \
  --from-literal=maptiler-key=<your-maptiler-key>

helm install my-studio charts/openeo-studio \
  --set envFromSecret[0].name=MAPTILER_KEY \
  --set envFromSecret[0].secretName=openeo-studio-secrets \
  --set envFromSecret[0].secretKey=maptiler-key
```

`secretKey` defaults to `name` when omitted.

## Testing

```sh
helm lint charts/openeo-studio
helm unittest charts/openeo-studio
```

CI additionally runs `ct lint`/`ct install` against the `ci/*.yaml` value overrides in this directory — see [`.github/workflows/check_charts.yml`](../../.github/workflows/check_charts.yml).
