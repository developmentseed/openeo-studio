# Local stack: Studio against titiler-openeo and Keycloak

A local backend for developing and testing openEO Studio end to end. One [kind](https://kind.sigs.k8s.io/)
cluster runs Keycloak (OIDC login) and titiler-openeo from its Helm chart, with an image built locally from a
pinned commit and the chart's bundled Postgres as the store, so saved projects survive pod restarts. The data is
live [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/) (anonymous, no credentials).
Studio runs from this checkout with the Vite dev server (hot reload) on `http://localhost:9000`, either in a
container (`make studio`) or on the host.

| URL | Service |
|---|---|
| http://localhost:9000 | Studio |
| http://localhost:8081 | titiler-openeo API (OpenAPI docs at `/api.html`) |
| http://localhost:8082 | Keycloak (realm `openeo`; admin console: `admin` / `admin`) |

Versions: kind node `v1.36.1`, Keycloak `26.4.0`, titiler-openeo chart `3.1.0`
(`oci://ghcr.io/developmentseed/charts/titiler-openeo`), titiler-openeo commit `b981849` (`main`, October 2026).
For local use only: the credentials are fixed and every port listens on 127.0.0.1.

## Prerequisites and footprint

- Docker (Docker Desktop on macOS), [kind](https://kind.sigs.k8s.io/) 0.32 (older versions may not run the
  pinned node image), kubectl, [helm](https://helm.sh/) 3.8 or later (OCI charts), jq, curl, git and make.
- Free ports on 127.0.0.1: 8081 and 8082 for the stack, and 9000 for Studio.
- About 8 GB of Docker disk: the titiler-openeo image (about 770 MB) and its build cache (about 1.7 GB), the
  kind node image (about 1.3 GB), the cluster's own volume (about 2.8 GB: Keycloak, Postgres and a copy of the
  titiler-openeo image; `make down` frees it), `node:22-slim` (about 350 MB), and Studio's `node_modules` and
  pnpm store volumes (about 860 MB together).
- At least 4 GB of memory for Docker (Docker Desktop: Settings > Resources). The running cluster used about
  2 GB, and its pods request about 2 GB.
- Network access: container registries (Docker Hub, quay.io, ghcr.io), GitHub, PyPI (titiler-openeo image
  build), the npm registry and Planetary Computer.

## Quickstart

From the repository root:

```sh
cd dev/local-stack
make up       # first run builds the titiler-openeo image (under a minute on a fast connection)
make smoke    # checks the API, login and live data; ends with "0 failure(s)"
make studio   # first run installs dependencies; ready when Vite prints Local: http://localhost:9000/
              # (ignore its Network: URL); Ctrl-C stops it
```

Then, in the browser:

1. Open http://localhost:9000 (`localhost`, not `127.0.0.1`: Keycloak only accepts that redirect) and log in
   as `dev` / `dev`, the test user from [`realm/openeo-realm.json`](realm/openeo-realm.json).
2. Read the Ulysse scenario seed,
   [`scenarios/ulysse-oil-spill-2018/seed.js`](https://github.com/lhoupert/openeo-studio-scenarios/blob/cb06000c7adb088c79880c6c06fbc20c93884a38/scenarios/ulysse-oil-spill-2018/seed.js):
   it only writes a Studio project (Python code and editor settings) to the tab's `sessionStorage`. Paste it
   into the browser console of the Studio tab and press Enter (Chrome asks you to type `allow pasting` once).
3. In the same tab, open http://localhost:9000/editor: the editor shows the scenario's code. The editor reads
   the seed when the page loads, so paste first, then open or reload `/editor`.
4. Click Save, which runs the code and saves the project. The address changes to `/editor/<project id>`, the
   project appears under "My projects", and layer 1 shows grey Sentinel-1 radar tiles off Cap Corse, with the
   slick as a dark line. Tiles outside the data return 404, which is normal.

To change the realm (clients, users), edit `realm/openeo-realm.json` and run `make up`: it restarts Keycloak,
so log in again.

### kubectl

The stack writes its own `kubeconfig` in this folder and never touches `~/.kube/config`:

```sh
export KUBECONFIG="$(git rev-parse --show-toplevel)/dev/local-stack/kubeconfig"   # exists after make up
kubectl -n openeo-dev get pods
```

### Studio on the host instead

With Node and pnpm set up as in the [root README](../../README.md) (Node from `.nvmrc`, `corepack enable pnpm`),
from the repository root:

```sh
cp -i dev/local-stack/studio.env.example .env.local   # -i asks before replacing an existing .env.local
pnpm install
pnpm dev
```

`.env.local` takes precedence over `.env`: delete it to point Studio back at another backend.

## Developing titiler-openeo against the stack

```sh
TITILER_REPO=/absolute/path/to/titiler-openeo TITILER_REF=HEAD make up
```

- `TITILER_REPO` must be an absolute path: `up.sh` runs from `dev/local-stack`.
- `up.sh` builds from committed code (`git archive`): commit, or amend, before `make up`.
- The image is tagged with the first 7 characters of the commit. A new commit builds a new image and rolls the
  pod; the same commit reuses the existing image. To rebuild it anyway, `docker image rm titiler-openeo:<sha>`,
  `make up`, then `kubectl -n openeo-dev rollout restart deploy/dev-titiler-openeo` (the tag is unchanged, so
  the running pod keeps the old image).
- Without `TITILER_REPO`, `TITILER_REF` must be a full commit SHA, which `up.sh` fetches from
  `sentinel-hub/titiler-openeo` on GitHub.
- Use a commit at or after `c9b6ee3`: the scenarios need `apply_kernel` and `/queryables`, which the `v0.19.0`
  tag lacks.
- `CHART_VERSION` selects another chart version; `values/titiler.yaml` holds the chart values.

## Teardown

```sh
make down   # deletes the cluster and everything in it, saved Studio projects included
```

`make down` keeps the titiler-openeo image, its build cache, the base images and Studio's Docker volumes, so
the next `make up` and `make studio` are fast. To free that disk too:

```sh
docker volume rm openeo-studio-node-modules openeo-studio-pnpm-store
docker image rm $(docker image ls -q titiler-openeo) node:22-slim   # every titiler-openeo:<sha> built by up.sh
docker image rm kindest/node:v1.36.1   # only if no other kind cluster uses it
docker builder prune                   # clears all of Docker's build cache, not only this stack's
```

## Limits

- Only Studio works against this stack: the backend advertises Keycloak's in-cluster URL, which Studio
  overrides with `VITE_AUTH_AUTHORITY`. Other openEO clients (the Python client, the Web Editor) cannot.
- A `/result` request is limited to 20 STAC items (`TITILER_OPENEO_PROCESSING_MAX_ITEMS`, settable under `env`
  in `values/titiler.yaml`). The North Water polynya Sentinel-2 window holds 21, so a `/result` over its full
  extent fails; its tiles work.
- At first install the titiler-openeo pod restarts once or twice until Postgres accepts connections.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `up.sh: docker is not reachable` | Start Docker (Docker Desktop on macOS); on Linux, also check that your user can run `docker` without `sudo`. Then run `make up` again. |
| `up.sh: 127.0.0.1:8081 is in use` (or 8082) | Stop what uses the port (titiler-openeo's own docker compose publishes 8080-8082). Both ports are fixed in `kind.yaml`. |
| `up.sh: 127.0.0.1:9000 is in use`, or Vite starts on 9001 and login fails | Fine if it is your Studio dev server. Otherwise stop what holds 9000 (MinIO and Portainer default to it), then start Studio again: Keycloak only accepts logins redirected to `localhost:9000`. |
| `make up` waits on `/healthz`, then fails | `kubectl -n openeo-dev get pods` and `kubectl -n openeo-dev logs deploy/dev-titiler-openeo` (with `KUBECONFIG` set as in [kubectl](#kubectl)). |
| A pod stays `Pending` (Insufficient memory) or is `OOMKilled` | Give Docker more memory (Docker Desktop: Settings > Resources), then run `make up` again. |
| Keycloak shows "Invalid parameter: redirect_uri" | Open http://localhost:9000, not http://127.0.0.1:9000. |
| Keycloak redirects with `Missing parameter: code_challenge_method` | The client requires PKCE (S256). Studio sends it; a hand-built authorization URL must too. |
| Login loops, or calls fail with 401, after `make down` and `make up` or a Keycloak restart | Keycloak has new signing keys: clear the site data of `localhost:9000` and log in again. |
| `make smoke` prints FAIL on `/readyz`, `/result`, a tile or `has data` | Planetary Computer was slow or failed: run `make smoke` again. If an auth check fails, see the Keycloak rows above. The outputs are in the folder printed on the last lines. |
| Page title `%VITE_APP_TITLE%`, or Studio calls the EOPF backend | The settings did not load: use `make studio`, or copy `studio.env.example` to `.env.local` at the repository root. |
| A layer fails with a band error | Studio's built-in samples use EOPF band names: load a scenario seed instead. |
| An occasional 500 tile | Transient Planetary Computer STAC error: reload, or pan the map. |
| Disk full during `make up` | Free at least 8 GB; `docker system df` shows what Docker uses. |

## Not tested

- amd64 and Linux hosts: the stack was proven on macOS arm64 with Docker Desktop only. On Linux, `make studio`
  runs as root inside the container, which may leave root-owned files in the checkout.
- The first pull of the kind node image: it was already cached.
- Source Cooperative data: only Planetary Computer is wired in.
- Studio's own Helm chart in the cluster: Studio runs with the Vite dev server only.
- Studio's Playwright tests against the stack.

Each file except `realm/openeo-realm.json` (realm `openeo`: client `openeo-studio` and the test user) starts with
a comment saying what it does; `make` lists the targets.
