/**
 * Writes the documents that tell an agent how to use this deployment:
 * `llms.txt`, `llms-full.txt`, `agents/*` and
 * `.well-known/openeo-studio.json`.
 *
 * The documents come from the sources of the app (the sample data, the
 * loader script, the prefill schema), so that they cannot go stale.
 *
 * Docker builds the image once and sets the URLs at container start. In
 * that build, VITE_BASE_URL is the literal `${BASE_URL}`, and the documents
 * keep the placeholders `${STUDIO_ROOT_URL}`, `${OPENEO_API_URL}`,
 * `${APP_TITLE}` and `${APP_DESCRIPTION}`. `docker/90-app-config.sh`
 * replaces them.
 */

import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';

import { parseBaseUrl } from '../../app/config/base-url';
import {
  SAMPLE_SCENES_META,
  type SampleSceneMeta
} from '../../app/config/sample-scenes-meta';

const REPO_URL = 'https://github.com/developmentseed/openeo-studio';
const UDP_REPO_URL = 'https://github.com/developmentseed/openeo-udp';
const SCALE_OFFSET_ADR_URL =
  'https://github.com/sentinel-hub/titiler-openeo/blob/main/docs/adr/0009-scale-offset-sources.md';
const DEFAULT_OPENEO_API_URL = 'https://api.explorer.eopf.copernicus.eu/openeo';

export interface AgentDocsValues {
  /** The deployment URL, no trailing slash. Empty: links are root-relative. */
  rootUrl: string;
  openeoApiUrl: string;
  title: string;
  description: string;
  version: string;
}

interface AgentDocsSources {
  loaderScript: string;
  userGuide: string;
  sampleSchema: string;
  algorithms: Record<string, string>;
}

/** Reads the values from the VITE_* environment of the build. */
export function resolveAgentDocsValues(
  env: Record<string, string>,
  version: string
): AgentDocsValues {
  const rawBaseUrl = env.VITE_BASE_URL;
  let rootUrl = '';
  if (rawBaseUrl?.includes('${')) {
    rootUrl = '${STUDIO_ROOT_URL}';
  } else if (parseBaseUrl(rawBaseUrl)) {
    rootUrl = rawBaseUrl.replace(/\/+$/, '');
  }

  return {
    rootUrl,
    openeoApiUrl: (env.VITE_OPENEO_API_URL || DEFAULT_OPENEO_API_URL).replace(
      /\/+$/,
      ''
    ),
    title: env.VITE_APP_TITLE || 'openEO Studio',
    description:
      env.VITE_APP_DESCRIPTION ||
      'Interactive code editor for openEO satellite imagery processing',
    version
  };
}

function readSources(rootDir: string): AgentDocsSources {
  const read = (file: string) =>
    readFileSync(path.resolve(rootDir, file), 'utf8');

  const algorithms: Record<string, string> = {};
  for (const sample of SAMPLE_SCENES_META) {
    algorithms[sample.algorithm] = read(`app/algorithms/${sample.algorithm}`);
  }

  return {
    loaderScript: read('app/algorithms/base/loader.py'),
    userGuide: read('app/pages/docs/docs-content.md'),
    sampleSchema: read('app/types/sample-prefill.schema.json'),
    algorithms
  };
}

function samplePrefill(sample: SampleSceneMeta, code: string) {
  return {
    $schema: '../sample.schema.json',
    name: sample.name,
    code,
    collectionId: sample.collectionId,
    temporalRange: sample.temporalRange,
    bands: sample.defaultBands,
    ...(sample.boundingBox && { boundingBox: sample.boundingBox }),
    ...(sample.cloudCover !== undefined && { cloudCover: sample.cloudCover })
  };
}

function llmsTxt(v: AgentDocsValues): string {
  const u = v.rootUrl;
  return `# ${v.title}

> ${v.description}. openEO Studio is a web editor: the user writes openEO Python client code, Studio runs it in the browser (Pyodide) and shows the result as map tiles. This deployment uses the openEO backend at ${v.openeoApiUrl}.

To give a user a ready sample: start from the sample that is nearest to the request, change the code and the configuration, and give the user a prefill link (\`${u}/editor?sample=…\`). The user must log in, read the code, and click Save. Save runs the code and saves the project to the account of the user. Studio never runs a sample from a link on its own.

Band names and the band dimension name are different on each backend. Get them from \`${v.openeoApiUrl}/collections/{collectionId}\` before you write a sample. Read [backend.md](${u}/agents/backend.md).

Reflectance is from 0 to 1: the backend already applied the scale and the offset. Read [script-contract.md](${u}/agents/script-contract.md#data-values).

Choose the area and the dates with care. Too narrow gives no image (\`NoDataAvailable\`). Too large gives more images than the backend accepts for a tile (\`ItemsLimitExceeded\`, 20 by default). Start with 1 to 2 weeks, a cloud filter of 20 % or less, and an area of less than 1°. Read [prefill.md](${u}/agents/prefill.md#area-and-dates).

## Docs

- [Script contract](${u}/agents/script-contract.md): the variables that Studio defines before your code, and the rules for the code.
- [Samples](${u}/agents/samples.md): the samples of this deployment, with links to open them and to their code.
- [Prefill link](${u}/agents/prefill.md): how to build a link that opens the editor with your sample.
- [openEO backend](${u}/agents/backend.md): how to get the collections, bands and processes of the backend.

## Machine-readable

- [Deployment manifest](${u}/.well-known/openeo-studio.json): URLs, routes and samples as JSON.
- [Sample JSON Schema](${u}/agents/sample.schema.json): the schema of a prefill sample.
- [openEO backend capabilities](${v.openeoApiUrl}/)

## Optional

- [User guide](${u}/agents/user-guide.md): the in-app documentation for people.
- [More examples (openeo-udp notebooks)](${UDP_REPO_URL})
- [Source code](${REPO_URL})
`;
}

function scriptContractMd(v: AgentDocsValues, loaderScript: string): string {
  return `# Script contract

Studio does not run your script alone. It runs this program in the browser (Pyodide, openEO Python client \`openeo<0.50\`):

1. \`RUN_CONFIG = json.loads(...)\`: the configuration of the project (collection, dates, bands, bounding box, property filters such as cloud cover).
2. \`loader.py\` (below).
3. Your script.

## Variables that your script can use

| Name | What it is |
| --- | --- |
| \`datacube\` | A \`DataCube\` from \`load_collection\` with the configured collection, dates, bands, bounding box and property filters. |
| \`reduced\` | \`datacube\` after \`apply_pixel_selection(pixel_selection="first")\`: one time step, no time dimension. Start from this one for a map. |
| \`add_graph_to_map(graph, name)\` | Adds a result to the map as a layer. Call it one time for each layer. |
| \`parameters\` | The openEO \`Parameter\` objects \`time\`, \`bounding_box\`, \`bands\`, and one \`filter_<property>\` for each property filter (for example \`filter_eo_cloud_cover\`). |
| \`array_create\`, \`absolute\`, \`and_\`, \`clip\`, \`if_\`, \`linear_scale_range\`, \`process\`, \`sqrt\` | Imported from \`openeo.processes\`. |

## Rules

- Do not create a \`Connection\` and do not call \`execute\`, \`download\` or \`create_job\`. Studio sends the process graph to the backend itself.
- Each layer must end with \`save_result("PNG")\` and must go to \`add_graph_to_map\`.
- Give 3 bands (RGB) with values from 0 to 255, as the samples do. In a band function, return \`array_create([r, g, b])\`. Each item must come from the data: a constant such as \`0\` fails with "all input arrays must have the same shape". Use \`value * 0\` for an empty channel. Then use \`linear_scale_range(..., output_min=0, output_max=255)\`.
- **Band names and the band dimension name come from the collection. They are different on each backend.** Read [backend.md](backend.md) before you write \`bands\` or \`dimension=\`. Studio removes each configured band that the collection does not have.
- The bands are in the order of the \`bands\` configuration. Apply a band function with \`apply_dimension(dimension="<band dimension>", process=f)\`. In \`f\`, \`data[0]\` is the first configured band.
- Studio computes the result tile by tile, for the map. Keep the processing small: no batch jobs, no long time series.
- The backend can have processes that are not in the openEO standard (for example \`color_formula\` and \`apply_pixel_selection\`). Read \`${v.openeoApiUrl}/processes\`.

## Data values

The backend (titiler-openeo) gives physical values, not raw digital numbers. Sentinel-2 L2A reflectance is from 0 to 1. A value can be a little below 0 or above 1. The backend already applied the scale and the offset of each product, also when the catalogue does not publish them ([titiler-openeo ADR 0009](${SCALE_OFFSET_ADR_URL})).

- Do not multiply by \`0.0001\`, and do not subtract an offset. The values would be wrong.
- True color: scale the reflectance from 0 to 0.3 (or 0.4) to 0 to 255.
- An index (NDVI, NDWI, …) is a ratio of reflectances. Its range is -1 to 1.

## Minimal script

\`\`\`python
rgb = reduced.linear_scale_range(input_min=0, input_max=0.4, output_min=0, output_max=255)
add_graph_to_map(rgb.save_result("PNG"), "True Color")
\`\`\`

## Band function

Replace the band names and \`"bands"\` (the band dimension name) with the values of your collection.

\`\`\`python
# bands: ["reflectance|bands=b04", "reflectance|bands=b08"]
def ndvi(data):
    red, nir = data[0], data[1]
    value = (nir - red) / (nir + red)
    return array_create([value, value, value])

index = reduced.apply_dimension(dimension="bands", process=ndvi)
grey = index.linear_scale_range(input_min=-1, input_max=1, output_min=0, output_max=255)
add_graph_to_map(grey.save_result("PNG"), "NDVI")
\`\`\`

## loader.py

This is the exact code that runs before your script.

\`\`\`python
${loaderScript.trim()}
\`\`\`
`;
}

function samplesMd(
  v: AgentDocsValues,
  algorithms: Record<string, string>
): string {
  const u = v.rootUrl;
  const rows = SAMPLE_SCENES_META.map((sample) => {
    const bbox = sample.boundingBox ? sample.boundingBox.join(', ') : 'none';
    const firstLine = algorithms[sample.algorithm].split('\n')[0];
    return `## ${sample.name}

${sample.description}

- Id: \`${sample.id}\`
- Open in Studio: ${u}/editor/${sample.id}
- Prefill JSON (start from this one): ${u}/agents/samples/${sample.id}.json
- Code: ${REPO_URL}/blob/v${v.version}/app/algorithms/${sample.algorithm}${firstLine.startsWith('#') ? ` (${firstLine.replace(/^#\s*/, '')})` : ''}
- Collection: \`${sample.collectionId}\`
- Dates: ${sample.temporalRange.join(' to ')}
- Bounding box (west, south, east, north): ${bbox}
- Cloud cover max: ${sample.cloudCover !== undefined ? `${sample.cloudCover} %` : 'no filter'}
- Bands, in order: ${sample.defaultBands.map((b) => `\`${b}\``).join(', ')}
`;
  });

  return `# Samples

These are the samples of this deployment. They were written for the EOPF backend: their band names (\`reflectance|bands=b04\`) and band dimension (\`bands\`) can be different on this backend. Check them against the collection. Read [backend.md](backend.md).

To make a sample for a user, start from the sample that is nearest to the request:

1. Get its prefill JSON.
2. Change \`code\`, \`bands\`, \`temporalRange\` and \`boundingBox\`. Use the band names and the band dimension name of the collection.
3. Make a prefill link. Read [prefill.md](prefill.md).

${rows.join('\n')}
## More examples

The openeo-udp notebooks have more algorithms: ${UDP_REPO_URL}

They use a \`Connection\` and \`load_collection\`. To use one in Studio:

- Remove the connection and \`load_collection\`. Start from \`reduced\` (or \`datacube\`).
- Put the bands of \`load_collection\` in \`bands\`, in the same order.
- End each layer with \`save_result("PNG")\` and \`add_graph_to_map\`.
`;
}

function backendMd(v: AgentDocsValues): string {
  const api = v.openeoApiUrl;
  return `# openEO backend

This deployment uses the openEO backend at ${api}. Read the live endpoints. Do not use a copy, because the backend changes.

| What | Endpoint |
| --- | --- |
| Capabilities and API version | ${api}/ |
| Versions of the API | ${api}/.well-known/openeo |
| Collections (STAC) | ${api}/collections |
| One collection, with its bands | ${api}/collections/{collectionId} |
| Processes | ${api}/processes |
| Output formats | ${api}/file_formats |
| Login providers (OIDC) | ${api}/credentials/oidc |

## Band names and the band dimension

These are different on each backend. Do not guess them. Get them from \`${api}/collections/{collectionId}\`:

- **Band names** (for \`bands\`): \`summaries.bands[].name\` (or \`summaries["eo:bands"][].name\`), or \`cube:dimensions.<name>.values\` for the dimension with \`"type": "bands"\`. Use the name exactly as it is written. Examples: \`reflectance|bands=b04\` (EOPF), \`B04\` (Planetary Computer).
- **Band dimension name** (for \`apply_dimension(dimension=...)\`): the key \`<name>\` in \`cube:dimensions\` whose \`type\` is \`bands\`. Examples: \`bands\` (EOPF), \`spectral\` (Planetary Computer).

Studio removes each configured band that the collection does not have, and the code then reads the wrong \`data[i]\`.

## Other notes for Studio

- Studio filters the items with the property filters of the project. A sample with \`cloudCover\` gets \`eo:cloud_cover < cloudCover\`. A sample without \`cloudCover\` gets no cloud cover filter: use this for collections without \`eo:cloud_cover\` (Sentinel-1, DEMs).
- The dates of a sample must be in the temporal extent of the collection (\`extent.temporal.interval\`). Use dates for which the collection has data.
- The user logs in with the provider from \`/credentials/oidc\`. A link that you give opens after the login.
`;
}

function prefillMd(v: AgentDocsValues): string {
  const u = v.rootUrl;
  return `# Prefill link

A prefill link opens the editor with your code and your configuration. Studio loads it as a new project that is not saved. Studio does not run it: the user reads the code and clicks Save. Save runs the code, shows the layers, and saves the project to the account of the user.

## 1. Write the sample

The sample is a JSON document. The schema is [sample.schema.json](sample.schema.json).

\`\`\`json
{
  "name": "NDVI, Rome, summer 2025",
  "collectionId": "sentinel-2-l2a",
  "temporalRange": ["2025-07-01", "2025-07-15"],
  "bands": ["<red band of the collection>", "<NIR band of the collection>"],
  "boundingBox": [12.35, 41.80, 12.60, 41.98],
  "cloudCover": 20,
  "code": "def ndvi(data):\\n    red, nir = data[0], data[1]\\n    value = (nir - red) / (nir + red)\\n    return array_create([value, value, value])\\n\\nindex = reduced.apply_dimension(dimension=\\"<band dimension>\\", process=ndvi)\\ngrey = index.linear_scale_range(input_min=-1, input_max=1, output_min=0, output_max=255)\\nadd_graph_to_map(grey.save_result(\\"PNG\\"), \\"NDVI\\")\\n"
}
\`\`\`

| Field | Required | Value |
| --- | --- | --- |
| \`code\` | yes | The Python script. Read [script-contract.md](script-contract.md). |
| \`collectionId\` | yes | A collection id of the backend. |
| \`temporalRange\` | yes | Two dates, \`YYYY-MM-DD\`. |
| \`bands\` | yes | Band names of the collection, exactly as the collection writes them (read [backend.md](backend.md)). The script reads \`data[i]\` in this order. |
| \`boundingBox\` | no | west, south, east, north, in degrees (EPSG:4326). |
| \`cloudCover\` | no | Maximum cloud cover, 0 to 100. Without it, there is no cloud cover filter. Leave it out for collections without \`eo:cloud_cover\` (Sentinel-1, DEMs). |
| \`name\` | no | The project name. |

## Area and dates

For each map tile, the backend searches the catalogue for the images (STAC items) that touch the tile, are in the dates, and pass the cloud filter. Then:

- **No image:** the tile fails with \`NoDataAvailable\`. The dates are too short, the area has no data, or the cloud filter is too strict.
- **More images than the limit of the backend** (20 by default in titiler-openeo): the tile fails with \`ItemsLimitExceeded\`. The dates are too long, the area is too large, or the cloud filter is too weak.

Studio shows the error on the map, with advice. Follow these rules:

- **Dates.** Sentinel-2 sees a place every 2 to 5 days, and a place can be on 2 to 4 overlapping products. Start with 1 to 2 weeks, with a cloud filter. Do not use more than 1 month. Do not use one day, unless you know that an image exists on that day. For an event, start at the event date and stop 1 to 2 weeks later. \`reduced\` takes the first valid pixel, so the map shows the first clear image.
- **How fast the count grows:** with no cloud filter, the London cloud sample (0.8° × 0.4°) finds 28 items in 6 days.
- **Area.** Use the area of the request: a city is 0.1° to 0.5°, a region up to approximately 1°. Studio zooms the map to the bounding box. The map requests no tile below zoom level 6 (approximately 5.6° for each tile), so a larger area shows nothing until the user zooms in. A larger area also puts more products in each tile.
- **Cloud filter.** 10 % to 30 % for optical images. Use 100 only when you want the clouds (cloud detection).
- **Data range.** The dates must be in the temporal extent of the collection (\`extent.temporal.interval\`). The catalogue can have gaps.

## 2. Make the link

Small sample (the link must stay below approximately 6000 characters): encode the UTF-8 JSON as base64url (no padding).

\`\`\`
${u}/editor?sample=<base64url>
\`\`\`

\`\`\`python
import base64, json
encoded = base64.urlsafe_b64encode(json.dumps(sample).encode()).decode().rstrip("=")
link = "${u}/editor?sample=" + encoded
\`\`\`

Large sample: put the JSON at an https URL that allows CORS (for example the raw URL of a GitHub gist).

\`\`\`
${u}/editor?sampleUrl=<URL-encoded https URL>
\`\`\`

## 3. Tell the user

- They must log in. The link opens after the login.
- They must read the code, then click Save. Save runs the code and saves the project to their account.
`;
}

function manifestJson(v: AgentDocsValues): string {
  const u = v.rootUrl;
  return `${JSON.stringify(
    {
      type: 'openeo-studio',
      version: v.version,
      baseUrl: u,
      openeoApiUrl: v.openeoApiUrl,
      docs: {
        llms: `${u}/llms.txt`,
        llmsFull: `${u}/llms-full.txt`,
        scriptContract: `${u}/agents/script-contract.md`,
        samples: `${u}/agents/samples.md`,
        prefill: `${u}/agents/prefill.md`,
        backend: `${u}/agents/backend.md`
      },
      routes: {
        editor: `${u}/editor`,
        sample: `${u}/editor/{sampleId}`,
        prefill: `${u}/editor?sample={base64url}`,
        prefillUrl: `${u}/editor?sampleUrl={url}`,
        share: `${u}/share/{serviceId}`
      },
      prefill: {
        param: 'sample',
        urlParam: 'sampleUrl',
        encoding: 'base64url(utf-8 JSON)',
        schema: `${u}/agents/sample.schema.json`
      },
      samples: SAMPLE_SCENES_META.map((sample) => ({
        id: sample.id,
        name: sample.name,
        collectionId: sample.collectionId,
        url: `${u}/editor/${sample.id}`,
        prefill: `${u}/agents/samples/${sample.id}.json`
      })),
      moreExamples: UDP_REPO_URL
    },
    null,
    2
  )}\n`;
}

/** Builds every agent document, by output path. */
export function buildAgentDocs(
  v: AgentDocsValues,
  sources: AgentDocsSources
): Record<string, string> {
  const docs: Record<string, string> = {
    'llms.txt': llmsTxt(v),
    'agents/script-contract.md': scriptContractMd(v, sources.loaderScript),
    'agents/samples.md': samplesMd(v, sources.algorithms),
    'agents/backend.md': backendMd(v),
    'agents/prefill.md': prefillMd(v),
    'agents/user-guide.md': sources.userGuide,
    'agents/sample.schema.json': sources.sampleSchema,
    '.well-known/openeo-studio.json': manifestJson(v)
  };

  for (const sample of SAMPLE_SCENES_META) {
    docs[`agents/samples/${sample.id}.json`] = `${JSON.stringify(
      samplePrefill(sample, sources.algorithms[sample.algorithm]),
      null,
      2
    )}\n`;
  }

  docs['llms-full.txt'] = [
    docs['llms.txt'],
    docs['agents/script-contract.md'],
    docs['agents/samples.md'],
    docs['agents/prefill.md'],
    docs['agents/backend.md']
  ].join('\n---\n\n');

  return docs;
}

const CONTENT_TYPES: Record<string, string> = {
  '.txt': 'text/markdown; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

/** True for a path that buildAgentDocs can write. */
export function isAgentDocPath(file: string): boolean {
  return (
    file === 'llms.txt' ||
    file === 'llms-full.txt' ||
    file === '.well-known/openeo-studio.json' ||
    file.startsWith('agents/')
  );
}

export function agentDocs(options: {
  rootDir: string;
  values: AgentDocsValues;
}): Plugin {
  const build = () =>
    buildAgentDocs(options.values, readSources(options.rootDir));

  return {
    name: 'openeo-studio:agent-docs',

    // The dev server serves the documents from memory.
    configureServer(server) {
      const base = server.config.base.replace(/\/+$/, '');
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (!pathname.startsWith(`${base}/`)) return next();
        const file = pathname.slice(base.length + 1);
        // Build the documents only for a document path, not for each module.
        if (!isAgentDocPath(file)) return next();
        const docs = build();
        if (!(file in docs)) return next();
        res.setHeader(
          'Content-Type',
          CONTENT_TYPES[path.extname(file)] ?? 'text/plain'
        );
        res.end(docs[file]);
      });
    },

    generateBundle() {
      for (const [fileName, source] of Object.entries(build())) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    }
  };
}
