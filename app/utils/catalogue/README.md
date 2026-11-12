# Catalogue

🤖 _This guidance is AI generated_

The catalogue is the list of projects the studio can open: the bundled
samples, the APEx algorithm catalogue, and whatever is added later. It has
two separate parts:

- **Sources** list entries. A source answers "what can I open?" cheaply,
  with no code and no editor state.
- **Loaders** open one entry. A loader turns a reference into everything the
  editor needs.

Each entry names the loader that opens it, so a source and its loader don't
have to come from the same place. APEx, for example, lists projects through
the GitHub tree API but opens each one with the generic `project-url`
loader.

## Files

| File               | What it does                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `types.ts`         | The contracts: `CatalogueSource`, `ProjectLoader`, `CatalogueEntry`, `LoadRef`, `LoadResult`                 |
| `catalogue.ts`     | `createCatalogue`: sends listings to sources and opens to loaders, and runs the compatibility check on both  |
| `compatibility.ts` | Checks a collection and its bands against the connected openEO backend                                       |
| `links.ts`         | Maps query params (`?sample_id=`, `?project_url=`, `?prefill=`, `?apex_udp=`) to loaders, in both directions |
| `paginate.ts`      | `paginate` and `matchesQuery` for sources that hold their whole list in memory                               |
| `project-file.ts`  | `parseProjectFile`: validates a project document and builds its seed                                         |
| `sources/`         | `samples` (also exports its loader), `apex` (APEx studio projects) and `apex-udp` (APEx UDPs)                |
| `loaders/`         | `project-url` (any URL to a `project.json`), `encoded-url` (`?prefill=`), `saved-project` and `apex-udp`     |
| `apex/`            | What the APEx sources and loader share: `repo` (the GitHub repo and its cached listing) and `record`         |

The active sources and loaders are registered in
[`app/config/catalogue.ts`](../../config/catalogue.ts). That file is the only
place that knows which ones exist.

## Key types

```ts
interface LoadRef {
  loader: string; // id of the loader that opens this entry
  ref: string; // opaque to everything except that loader
}

interface CatalogueEntry {
  id: string; // unique within its source
  name: string;
  description: string;
  thumbnail?: string;
  collectionId?: string; // used to filter out incompatible entries
  bands?: string[];
  tags?: string[];
  open: LoadRef;
}

interface LoadResult {
  seed: EditorSeed; // what the editor is filled with, including the code
  projectId?: string; // only for saved projects, which open at /editor/<id>
  autoRun: boolean; // run the code as soon as the editor is ready
  external?: boolean; // code that exists only in a link
  generated?: boolean; // code that studio wrote from a UDP
  incompatibilities?: string[]; // values left out of the seed
}
```

An **entry** is what a card needs plus how to open it. A **seed** is the full
editor content, and it may cost extra requests to build. For APEx, that
means fetching the `.py` file. Keep that work in the loader, so listing 30
entries never downloads 30 code files.

## How a listing flows

1. The catalogue page calls `useCatalogue`, which asks each source
   separately, so a slow source never holds back the others.
2. `catalogue.listEntries` calls `source.listEntries(query, ctx, cursor)`.
3. The catalogue drops every entry whose `collectionId` or `bands` aren't
   available on the backend, and logs each one with `console.warn`.
4. If a source throws, its page comes back with `error` set. The page shows
   a "Couldn't load …" alert with a Retry button, and the other sources are
   not affected.

## How opening flows

1. A card click, or a link param in the editor URL, calls `openEntry(open)`
   in `useOpenEntry`.
2. `catalogue.load` finds the loader by `open.loader` and calls
   `loader.load(open.ref, ctx)`.
3. The catalogue checks the seed's collection, bands and property filters
   against the backend. It keeps the supported values and names the others
   in `incompatibilities`. An unavailable collection falls back to the
   default one. The code is always kept, but no longer runs on its own.
4. If the user has unsaved work, they are asked before it is replaced. The
   store is then filled and the app navigates to `/editor`, or to
   `/editor/<projectId>` for a saved project. The editor shows the
   incompatibilities in a warning.

### Prefill links

`/editor?prefill=<base64url JSON>` carries a whole project in the link. The
JSON has the fields of a project file, with the code in `code`. `name` is
optional. Studio opens it unsaved, never runs it on its own, and warns that
the code comes from a link.

For code that is too long for a URL, host the same JSON and link to it with
`?project_url=`.

A newer `openEntry` call aborts the older one through `ctx.signal`. Pass the
signal to any `fetch` your loader makes.

### APEx UDPs

The `apex-udp` source lists the APEx algorithms that have a UDP but no studio
project. The `apex-udp` loader fetches the UDP and writes the Python code from the
process graph with `udpToPython` (`$utils/openeo/udp-to-python`). The code
holds only what the loader script doesn't already provide:

- The collection that the UDP loads for its time range becomes `datacube`.
  Its collection, bands and property filters go to the configuration.
- The spatial and the temporal parameter become `bounding_box` and `time`.
  The other parameters become constants at the top of the code. Their values
  come from the first benchmark scenario of the algorithm, then from the
  defaults of the UDP.
- The `save_result` of the UDP is replaced by a PNG layer on the map.
- Any other collection is loaded in the code. Studio selects one collection,
  through the configuration, so the user gets a notice that more than one is
  not supported natively.

A collection the backend has under the UDP's name is used as it is.
Otherwise the catalogue falls back to the default collection, as for any
other project, and a collection the code loads itself stays as the UDP has
it. Both are named for the user.

The result has `generated: true`, so the editor always warns that the code
may not work. `incompatibilities` names every replaced or missing collection,
every process the backend doesn't have, and every parameter that needs a
value.

### Errors

- Throw `NotFound` (from `$utils/errors`) when the entry doesn't exist or
  its file is unusable. An entry opened from a link then shows the 404 page
  with your message. A card click shows a toast instead.
- A response with HTTP status 404 (`APIError` with `code === 404`) is
  treated the same way as `NotFound`.
- A usable project that doesn't match the backend is not an error. See
  step 3 above.
- Any other error shows the "Couldn't open project" toast.

## Adding a source

1. Create `sources/<name>.ts` that exports a `CatalogueSource`:

   ```ts
   import { matchesQuery, paginate } from '../paginate';
   import type { CatalogueSource } from '../types';

   export const exampleSource: CatalogueSource = {
     id: 'example', // unique; also used as the filter button key
     label: 'Example', // shown on the filter button and card badge
     async listEntries(query, ctx, cursor) {
       const all = await fetchMyList(); // your listing call
       const entries = all
         .map((item) => ({
           id: item.id,
           name: item.title,
           description: item.summary ?? '',
           collectionId: item.collection,
           bands: item.bands,
           open: { loader: 'project-url', ref: item.projectFileUrl }
         }))
         .filter((entry) => matchesQuery(entry, query));
       return paginate(entries, query, cursor);
     }
   };
   ```

2. Add it to `sources` in `app/config/catalogue.ts`. The order there is the
   order the cards appear in.

Things to keep in mind:

- Point `open` at an existing loader when one fits. `project-url` opens any
  publicly reachable `project.json`.
- Set `collectionId` and `bands` whenever you know them. Otherwise
  incompatible entries only fail when someone opens them.
- Throw on failure; don't return an empty list. The page can then show the
  error and offer Retry.
- If your backend pages results itself, return its own cursor as
  `nextCursor` instead of using `paginate`. The catalogue passes the cursor
  back unchanged.
- Cache what is expensive or rate-limited. See `apex/repo.ts`, which caches
  the entries listed from the GitHub tree in `sessionStorage` for an hour.
- `ctx.authToken` is the user's openEO token. Only send it to the openEO
  backend. Use `fetchPublic` from `$utils/api` for anything else.

## Adding a loader

1. Create `loaders/<name>.ts` that exports a `ProjectLoader`:

   ```ts
   import { fetchPublic } from '$utils/api';
   import { NotFound } from '$utils/errors';
   import type { ProjectLoader } from '../types';

   export const exampleLoader: ProjectLoader = {
     id: 'example',
     async load(ref, { signal }) {
       const response = await fetchPublic(toUrl(ref), signal);
       const file = await response.json();
       if (!file.collectionId) {
         throw new NotFound(`Invalid project ${ref}: missing collectionId`);
       }
       return {
         seed: {
           name: file.name,
           collectionId: file.collectionId,
           temporalRange: file.temporalRange,
           propertyFilters: file.propertyFilters ?? [],
           bands: file.bands,
           suggestedAlgorithm: file.code
         },
         autoRun: false
       };
     }
   };
   ```

2. Add it to `loaders` in `app/config/catalogue.ts`.
3. Optional: to make entries from this loader linkable, add a query param
   for it to `LINK_PARAMS` in `links.ts`, for example
   `example_id: 'example'`. Cards then get a real `href`, so middle-click
   opens a new tab, and `/editor?example_id=<ref>` opens the entry directly.

Things to keep in mind:

- Validate everything you read from outside. Throw `NotFound` with a clear
  message when a required field is missing.
- Leave `autoRun` set to `false` for code you don't control. Only the
  bundled samples and the user's own projects run on open.
- Set `projectId` only for content that is already saved as a UDP.
  Everything else opens at `/editor` and gets an id when it is first saved.

## Tests

Unit tests live in `test/utils/catalogue/`, one file per module. Sources and
loaders are tested with a mocked `fetch`; see `apex.test.ts` and
`project-url.test.ts` for the pattern.
