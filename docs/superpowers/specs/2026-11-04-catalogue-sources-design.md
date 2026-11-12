# Catalogue: sources, loaders, and the catalogue page

Date: 2026-11-04
Status: proposed
Builds on: [ADR 0004](../../adr/0004-catalogue-provider-architecture.md)

## Intent

Users start work from things other people made: the bundled samples, the
APEx Algorithm Catalogue, their own saved projects, and later a link a
colleague shares. Today the only starting points are the hardcoded
`SAMPLE_SCENES`, and the editor has special cases for "sample id" and
"saved project id" in its route.

This design adds one catalogue that lists entries from several sources. It
separates two jobs that the ADR kept together:

- **Listing** what exists, which a **source** does.
- **Loading** one entry into the editor, which a **loader** does.

The two jobs are separate because they don't line up one to one. The APEx
source lists with the GitHub tree API but loads through the generic
project-URL loader. The `?project_url=` deep link and the future URL-params
link have loaders and no source at all.

The "Samples" page under Projects becomes the catalogue page.

## Terms

The code and UI use these terms consistently.

- **Algorithm**: the openEO UDP in the APEx repo
  (`openeo_udp/<algo>.json`). This design never loads it.
- **Studio project file**: `algorithm_catalog/<provider>/<algo>/openeo_studio/project.json`
  and the `.py` file it points to. This is what the studio loads from APEx.
- **Saved project**: a UDP on the user's openEO backend with the code in
  `description`, owned by `useProjectsStore`. It is a separate concept from
  catalogue entries. It also takes part in the catalogue through its own
  source and loader.
- **Catalogue entry**: a lightweight list item (name, description,
  thumbnail, and so on) and the reference needed to open it.
- **Source**: lists catalogue entries.
- **Loader**: turns a reference into an editor seed.
- **Editor seed**: the data the editor is hydrated with. It is the object
  `hydrateFromScene` takes today: name, collectionId, temporalRange,
  cloudCover, defaultBands, boundingBox, and code (`suggestedAlgorithm`).

## Goals

- One catalogue page that lists entries from every active source in one
  merged feed, with text search, a filter by source, and "load more".
- Add a source or a loader without touching the editor or the catalogue page.
- One failing source must not break the others. This is carried over from
  the ADR.
- Normalized editor URLs:
  - `/editor/<id>` is used only for saved projects.
  - Everything else loads, then shows `/editor`. On first save it gets an id.
- Support the APEx record's `webapp` link:
  `https://<studio>/?project_url=<raw URL of openeo_studio/project.json>`.
- Show and open only entries that work on the connected openEO backend. A
  project file is written for one backend's collection and band names.

## Non-goals

These are not built now. The design only leaves room for them.

- The URL-params loader, for a shared link whose query parameters map to
  editor seed fields.
- "Copy URL", which will export the current editor state as such a link.
- A source for public UDPs on the connected openEO backend.
- Tag filter UI. Tags are part of the query and are shown on cards.
- Keywords from the APEx record (`records/<algo>.json`).
- Authenticated GitHub API calls or a server-side proxy.

## Anti-goals

- Code from outside the app (APEx, `project_url`, later URL params) must
  never run on its own. A `project_url` can point at any host, so loading
  only fills the editor and the user decides to run. Bundled samples and
  saved projects auto-run, as they do today.
- Opening a catalogue entry must not silently throw away unsaved editor
  work.
- `/editor/<id>` must never point at something other than a saved project.

## Constraints

- The GitHub API allows 60 unauthenticated requests per hour per IP. The
  APEx source spends at most one API call to list. Everything else comes from
  `raw.githubusercontent.com`, which has no such limit.
- The editor store is persisted in `sessionStorage` (ADR 0003). A refresh on
  `/editor` keeps unsaved work, and the design relies on that.
- The editor, projects, and catalogue routes sit behind `RequireAuth`. The
  landing page is public.
- Tests live in `test/` and run with Jest.

## Interfaces

These types are the shape the builder implements. Names can change if the
codebase already has a better one.

```ts
interface CatalogueQuery {
  text?: string;
  tags?: string[];
  pageSize?: number; // hint; each source may clamp or ignore it
}

interface CatalogueContext {
  authToken?: string; // needed by the saved-project loader
}

interface LoadRef {
  loader: string; // loader id
  ref: string; // opaque to everything except that loader
}

interface CatalogueEntry {
  id: string; // unique within its source
  name: string;
  description: string;
  thumbnail?: string;
  collectionId: string; // compatibility check; thumbnail fallback from the STAC collection, as SceneCard does today
  bands: string[]; // default bands, for the compatibility check
  tags?: string[];
  open: LoadRef;
}

interface CatalogueSource {
  id: string; // 'samples' | 'apex'
  label: string; // shown in the source filter and on cards
  listEntries(
    query: CatalogueQuery,
    ctx: CatalogueContext,
    cursor?: string
  ): Promise<{ items: CatalogueEntry[]; nextCursor?: string }>;
}

interface LoadResult {
  seed: EditorSeed;
  projectId?: string; // set only by the saved-project loader
  autoRun: boolean; // true only for the samples and saved-project loaders
}

interface ProjectLoader {
  id: string; // 'samples' | 'project-url' | 'saved-project' | later 'params'
  load(ref: string, ctx: CatalogueContext): Promise<LoadResult>;
}
```

The **catalogue** module is built once from explicit lists in
`app/config/catalogue.ts`. A deployment picks its sources by editing those
lists.

```ts
createCatalogue({ sources, loaders }) => {
  listEntries(query, ctx, sourceIds?): Promise<SourcePage[]>;
  loadMore(sourceId, query, ctx, cursor): Promise<SourcePage>;
  load(open: LoadRef, ctx): Promise<LoadResult>;
}

interface SourcePage {
  sourceId: string;
  items: CatalogueEntry[];
  nextCursor?: string;
  error?: unknown; // set, with items empty, when this source failed
}
```

These parts carry over from the ADR unchanged:
- the per-source cursor model, where cursors are opaque and replayed only
  against the same query;
- `Promise.allSettled` isolation;
- the offset-cursor "faked pagination" for sources that are one array.

Entry ids don't need a provider prefix. Nothing resolves an entry by id; the
page only needs `sourceId + id` as a React key. `load()` throws on an
unknown loader id.

## Backend compatibility

A project file names a collection and bands in one backend's notation. For
example, the bundled samples use titiler-eopf's `reflectance|bands=b04`, and
the MPC backend advertises `B04`. The catalogue module checks every entry
against the connected backend, so sources and loaders don't each need to.

**The check:** `checkCompatibility({ collectionId, bands })` returns either
compatible or a reason.
- The collection must exist on the backend:
  `GET {openeoApiUrl}/collections/<id>` returns 200.
- Every band must appear in the collection's advertised bands. Use the
  existing `extractBandsFromStac`, and reuse the EOPF notation mapping in
  `band-array-builder.tsx` so `reflectance|b04` matches
  `reflectance|bands=b04`.
- Cache collection fetches per `collectionId` for the session, so a list of
  30 entries on one collection costs one request.
- If the collection fetch fails for a reason other than 404 (network, 5xx),
  treat that as a source or load error, not as incompatibility.

**When listing:** `listEntries` and `loadMore` run the check on every item
of every page. They drop incompatible entries with a `console.warn` that
names the source, the entry id, and the reason. A page can come back shorter
than `pageSize`, or empty with a `nextCursor`. That is acceptable.

**When loading one entry:** `load()` runs the same check on the seed's
`collectionId` and `defaultBands` after the loader returns. If the seed is
incompatible, it throws an `IncompatibleProjectError` that carries the
reason. The editor then shows its not-found view, with a message saying the
project isn't compatible with the connected backend and why, for example
"band `B8A` is not available in `sentinel-2-l2a`". This applies to every way
of opening:
- catalogue and landing cards;
- `?project_url=`;
- `/editor/<id>`.

The bundled samples go through the same check. On a backend they weren't
written for, they are dropped from the catalogue and show the incompatible
view when opened from the landing page.

## Sources and loaders

| | Source | Loader |
|---|---|---|
| Bundled samples | `samples` | `samples` |
| APEx | `apex` | `project-url` |
| Saved projects | none | `saved-project` |
| `?project_url=` deep link | none | `project-url` |
| URL params (later) | none | `params` |

### `samples`

- **Source:** lists `SAMPLE_SCENES`, filters in memory by text and tags, and
  returns everything in one page with no cursor.
- **Loader:** the ref is the sample id. The loader does an array lookup and
  maps the result to a seed.
- `SampleScene` stays as the bundled data type.
- The landing page keeps rendering `SAMPLE_SCENES` directly. Its cards open
  through the `samples` loader.

### `project-url` loader

The ref is an absolute URL to a studio project file.

1. Fetch the JSON. Check that `name`, `collectionId`, `temporalRange`,
   `defaultBands`, and `algorithm` are present and have the right types.
   Throw a readable error if not. `description`, `boundingBox`, and
   `cloudCover` are optional.
2. Resolve the code URL with `new URL(json.algorithm, url)` and fetch it as
   text.
3. Return `{ seed }` with no `projectId`.

This is the only loader that fetches arbitrary URLs. It never runs the code.

### `apex` source

Config: `{ owner: 'ESA-APEx', repo: 'apex_algorithms', ref: 'main' }`. Keep
`ref` configurable so a branch can be tested.

The APEx repo changes separately to match this design. Each
`openeo_studio/<algo>.json` is renamed to `openeo_studio/project.json`. Each
record's `webapp` link changes to `?project_url=` and uses the real studio
host. Until that change reaches `main`, test against the
`openeo-studio-scenes` branch by setting `ref`.

1. Make one call to
   `GET https://api.github.com/repos/<owner>/<repo>/git/trees/<ref>?recursive=1`.
2. Keep paths that match
   `^algorithm_catalog/([^/]+)/([^/]+)/openeo_studio/project\.json$`.
   If the response has `truncated: true`, log a warning.
3. Fetch every matched `project.json` from
   `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>`, in
   parallel. Drop and log any file that fails to fetch or parse; don't fail
   the whole source.
4. Map each file to an entry:
   - `id`: `<provider>/<algo>`. Algorithm names can repeat across providers.
   - `name`, `description`, `collectionId`: from the file.
   - `bands`: `defaultBands` from the file.
   - `thumbnail`: the raw URL of
     `algorithm_catalog/<provider>/<algo>/records/thumbnail.png`. Set it only
     when that path is in the same tree response, so a missing file never
     shows a broken image. Without it, the card falls back to the STAC
     collection thumbnail.
   - `tags`: `[<provider>]`.
   - `open`: `{ loader: 'project-url', ref: <raw URL> }`.
5. Cache the mapped list behind one shared promise, the same way
   `createStaticJsonProvider` does in the ADR. Also cache it in
   `sessionStorage` for 1 hour, so reloads don't spend API calls. Filter and
   slice in memory with an offset cursor.

If the tree call fails, for example because of the rate limit, the source
rejects. The catalogue shows that source's error and the other sources as
usual.

### `saved-project` loader

Saved projects are not listed in the catalogue; the projects page lists them.
The loader runs the logic `useLoadProject` had: `loadProject`, then
`deriveConfigFromProject`, then `extractCodeFromDescription`. It falls back to
`DEFAULT_EDITOR_CONFIG` and returns `{ seed, projectId: id }`.

### `params` loader (later)

Reserve the id. Not built.

## Editor URLs and opening entries

There is one shared function, `openEntry(open: LoadRef)`. The catalogue
cards, landing cards, and deep links all use it.

1. Call `catalogue.load(open, ctx)`. On `IncompatibleProjectError`, show the
   editor's incompatible view (see "Backend compatibility") and stop.
2. Replace the editor contents through the shared helper below. Store
   `autoRun` with the seed.
3. Call `hydrateFromScene(projectId ?? null, seed)`.
4. Navigate to `/editor/<projectId>` if there is a `projectId`, otherwise to
   `/editor`. Use `replace` when coming from a deep link.

While loading, the clicked card shows a busy state. Errors show a toast and
leave the editor untouched.

Every action that replaces the editor contents goes through one shared
helper. If the store is dirty, the helper first asks with the existing confirm
dialog; if the user cancels, nothing changes. These actions use it:
- `openEntry`, including the `?project_url=` deep link;
- starting blank from `BlankCard`;
- the projects page "Create" button;
- the `ProjectsHeader` link to `/editor`;
- the app header "New project" button (`app-header.tsx`).

The last two become actions instead of plain links to `/editor`.

Routes:

- **`/editor/:projectId`** always means a saved project. `EditorPage` drops
  the `getSceneById` branch. When the store's `sceneId` doesn't match the
  route, it loads through the `saved-project` loader. That replaces
  `useLoadProject`'s current role, and the not-found handling stays.
- **`/editor`** shows whatever the store holds. Remove the effect that
  resets the store when the route has no id.
- **Starting blank** is an explicit action: `clearEditor()`, then navigate
  to `/editor`, through the shared helper above.
- **Auto-run** follows the stored `autoRun` flag, not the route.
  `EditorPage` currently uses `autoExecuteOnReady={!isBlankScene && !!code.trim()}`;
  that becomes `autoRun && !!code.trim()`.
  - Persist `autoRun` in the editor store next to `sceneId`, so a refresh
    behaves the same as the first load.
  - `clearEditor()` resets it to `false`.
  - Saving keeps it as it is.
- **Old sample URLs** (`/editor/sentinel-2-*`), and sessions persisted with a
  sample id as `sceneId`, hit the saved-project loader and show not-found.
  There is no redirect. Update `test/integration/navigation.spec.ts` and
  `persistence.spec.ts` to match.
- **`/?project_url=<url>`** comes from the APEx record link. It redirects to
  `/editor?project_url=<url>`. After auth, `EditorPage` sees the parameter,
  runs `openEntry({ loader: 'project-url', ref: url })`, and replaces the URL
  with `/editor`. The builder must check that the query string survives the
  OIDC round trip (`returnTo` / `postAuthPath` in `app/main.tsx`). If it
  doesn't, preserve it there.
- **Save** with no `sceneId` creates a new saved project and navigates to
  `/editor/<id>`. That's today's `shouldNavigateAfterSave` behavior, now
  simply `!sceneId`.
  - Remove `isSampleScene`, `getSceneById`, and the "This is a sample
    project" save confirmation. Once loaded, an entry is just unsaved work,
    like a blank project.
  - Delete stays disabled when there is no `sceneId`.

## Catalogue page

- **Route:** `/projects/catalogue` replaces `/projects/samples`, with no
  redirect. On the projects page, the "Samples" button becomes "Catalogue".
- **Layout:** the current header, then a toolbar, then the card grid:
  - text search, debounced;
  - a source filter: "All" plus one option per active source, using
    `label`.
- **Feed:** on load and whenever the query changes, call
  `listEntries(query, ctx, sourceIds)`. Show entries in the order the
  sources are configured, each page appended as it arrives.
- **Load more:** a button shown while any source has a `nextCursor`. A click
  calls `loadMore` for every source that has one, in parallel.
- **Errors:** a source that failed shows a small inline notice ("Couldn't
  load APEx catalogue") with a retry button. The rest of the feed renders.
- **Loading:** `ProjectCardSkeleton` placeholders.
- **Cards:** adapt `SceneCard` to take a `CatalogueEntry`:
  - it opens through `openEntry` instead of linking to `/editor/<id>`;
  - it shows the source label and tags as badges;
  - the thumbnail falls back to the STAC collection thumbnail, as now.
- `BlankCard` stays in the grid.
- **State:** a `useCatalogue(query)` hook with local React state. No new
  zustand store.

## Tests

Use Jest in `test/`.

- **APEx source:**
  - the path regex keeps only `openeo_studio/project.json` paths;
  - ids are `<provider>/<algo>`;
  - the offset cursor pages correctly;
  - one bad `project.json` doesn't fail the list.
- **`project-url` loader:**
  - a relative `algorithm` resolves against the JSON URL;
  - missing required fields throw.
- **Catalogue:**
  - a rejecting source yields a `SourcePage` with `error`, and the others
    still return;
  - an unknown loader id throws;
  - incompatible entries are dropped from pages and logged;
  - `load()` throws `IncompatibleProjectError` for an incompatible seed;
  - `autoRun` is true for `samples` and `saved-project` and false for
    `project-url`.
- **Compatibility check:**
  - a missing collection and a missing band each give a reason;
  - EOPF notation variants match;
  - collection fetches are cached.

## Left to the builder

- File layout under `app/` and exact names, where the codebase suggests
  better ones.
- Debounce timing, page size, and card badge styling.
- Whether `EditorSeed` is a new exported type or the existing inline
  `hydrateFromScene` parameter type, renamed.

## Calls made in this design

These came from the designer, not from the requester:

- APEx entries open through the generic `project-url` loader. There is no
  separate APEx loader, because its ref would just be the raw URL.
- `LoadResult.projectId` makes saved projects open at `/editor/<id>` through
  the same `openEntry` path as everything else.
- Entry ids have no provider prefix.
- APEx list cache: in memory plus 1 hour in `sessionStorage`.
- Confirm before overwriting unsaved (dirty) editor work, in one helper
  shared by every action that replaces the editor contents.
- Old sample URLs show not-found, with no redirect.
- The compatibility check runs centrally in the catalogue module, after each
  source returns a page. Sources don't filter before paginating, so pages can
  be short.
- Bundled samples and saved projects are checked like every other entry.
- A collection fetch that fails for any reason other than 404 is an error,
  not incompatibility.
- `autoRun` is persisted in the editor store.
- Remove the sample-specific save confirmation.
- "Load more" advances all sources at once.
- The catalogue route is `/projects/catalogue`, with no redirect from
  `/projects/samples`.
