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

This will package the app and place all the contents in the `dist` directory.
The app can then be run by any web server.

**When building the site for deployment provide the base url trough the `VITE_BASE_URL` environment variable. Omit the leading slash. (E.g. <https://example.com>)**
