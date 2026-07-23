# OpenEO Studio

Applying openEO processes for visual data exploration

Earth Observation (EO) data processing becomes accessible and powerful with Python-based openEO workflows. openEO Python allows data analysis to formulate their workflows
in a familiar language and leave the data loading and workflow execution to interoperable backends.

openEO Studio adds another layer of convenience by providing a browser-based workflow development and execution environment where the openEO Python algorithm and a map 
to view the result are the only elements an analyst needs to deal with - no installation or execution. Log in, select your data, define the workflow, and view the result
right away on a map, computed on-the-fly and only at the level of detail required.


## How openEO Studio works

- React JS frontend application
- Integration with third-party authentication and authorisation
- Client-side openEO Python code execution with [Pyodide](https://pyodide.org/)
- Tile-based openEO data processing [titiler-openeo](https://github.com/sentinel-hub/titiler-openeo)


## Installation and Usage

The steps below will walk you through setting up the project locally.

### Install Project Dependencies

To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) (see version in [.nvmrc](.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [pnpm](https://pnpm.io/) Install using corepack (`corepack enable pnpm`)

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```sh
nvm install
```

Install Node modules:

```sh
pnpm install
```

## Usage

### Environment Configuration

The application uses [dot.env](https://vite.dev/guide/env-and-mode#env-files) files with environment variables for configuration. A template file `.env.example` is provided as a template.

To configure the application:
1. Copy `.env.example` to `.env`
2. Modify the `.env` file with your specific configuration values
3. Never modify `.env.example` directly as it serves as documentation

#### Where the app is mounted: `VITE_BASE_URL`

`VITE_BASE_URL` is the one variable that controls where the app is served from — set it once to the full URL (including any path prefix) and everything else follows automatically: Vite's built asset paths, the client-side router's mount point, Docker's nginx rewrite rules, and the GitHub Pages 404 redirect.

- **Local dev** (`pnpm dev`): leave it as the dev server's own URL, e.g. `http://localhost:9000` (no path prefix).
- **`pnpm build` + serving locally under a prefix**: set it to the full URL you'll serve from, e.g. `http://localhost:8888/subpath`, then serve `dist/` so it's reachable at that path (e.g. behind a reverse proxy). The build's asset URLs and router will match automatically.
- **GitHub Pages**: set the `VITE_BASE_URL` repository variable to the site's full deployed URL, e.g. `https://developmentseed.github.io/openeo-studio` for a project page, or your custom domain root if one is configured.
- **Docker**: set the `BASE_URL` environment variable at `docker run` time (see below) — no rebuild needed to change it.

### Starting the app

```sh
pnpm dev
```

Compiles the sass files, javascript, and launches the server making the site available at `http://localhost:9000/`
The system will watch files and execute tasks whenever one of them changes.
The site will automatically refresh since it is bundled with livereload.

## Deployment

To prepare the app for deployment run:

```sh
pnpm build
```

or

```sh
pnpm stage
```

This will package the app and place all the contents in the `dist` directory, with asset URLs already baked to match whatever `VITE_BASE_URL` was set to at build time. The app can then be run by any web server capable of serving a single-page app (falling back to `index.html` for unknown paths).

### Docker

```sh
docker build -t openeo-studio .
docker run -p 8888:80 -e BASE_URL=http://localhost:8888/subpath openeo-studio
```

The image is built once with a relative asset base and configured per-container via environment variables (`BASE_URL`, `OPENEO_API_URL`, `APP_TITLE`, etc. — see `Dockerfile` for the full list). The entrypoint script derives the mount path from `BASE_URL` and writes it into nginx's rewrite rules, the page's `<base>` tag, and `window.__APP_CONFIG__` at container start — so the same image can be redeployed under a different `BASE_URL` without rebuilding.
