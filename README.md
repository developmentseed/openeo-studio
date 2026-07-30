# OpenEO Studio
A browser-based editor for writing and running openEO processes with results rendered on a map as soon as they're computed.  
Write your algorithm in Python, point it at your data, and see the output on a map - no local install, no server-side execution to manage. Code runs client-side via [Pyodide](https://pyodide.org/); the map is served by [titiler-openeo](https://github.com/sentinel-hub/titiler-openeo) with tiles computed on the fly.

## Table of Contents

- [Where this fits in the openEO ecosystem](#where-this-fits-in-the-openeo-ecosystem)
- [Installation and Usage](#installation-and-usage)
- [Usage](#usage)
- [Deployment](#deployment)
- [Made possible by](#made-possible-by)

## Where this fits in the openEO ecosystem
[openEO](https://openeo.org/) defines a common API for processing earth observation data. openEO Studio is one client for that API, focused on interactive and visual exploration.

**[openEO Web Editor](https://editor.openeo.org/)** is the general-purpose reference client for the ecosystem: it lets users pick from a list of registered backends, browse collections, and build workflows with a visual process graph editor as well as code.  
**openEO Studio** trades that power and flexibility for a simpler, code-first, single-purpose tool: each deployment is wired to one backend and the emphasis is on fast map feedback while iterating on that code.

If you need to browse multiple backends or run long-running processes, the Web Editor is the better fit. If you want a lightweight, embeddable, code-driven map exploration tool, that's what this project is for.

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

Note `VITE_OPENEO_API_URL` in particular: this is the one backend this deployment will talk to.

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

The image is built once with a relative asset base and configured per-container via environment variables (`BASE_URL`, `OPENEO_API_URL`, `APP_TITLE`, etc. — see `Dockerfile` for the full list). The entrypoint script derives the mount path from `BASE_URL` and writes it into nginx's rewrite rules, the page's `<base>` tag, and `window.__APP_CONFIG__` at container start — so the same image can be redeployed under a different `BASE_URL` or `OPENEO_API_URL` without rebuilding.

## Made possible by
openEO Studio began as a Development Seed Labs project, exploring what a lightweight interactive openEO client could look like. Continued development has been made possible by support from [EOPF](https://explorer.eopf.copernicus.eu/), [EOEPCA+](https://eoepca.org/eoepcaplus) and [APEx](https://apex.esa.int/).

Interested in supporting feature development, or are you looking for support to run your own instance of OpenEO Studio? Drop us a line at [openeo@developmentseed.org](mailto:openeo@developmentseed.org).
