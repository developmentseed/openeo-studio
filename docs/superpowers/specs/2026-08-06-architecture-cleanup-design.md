# Architecture cleanup: organization, dead code, and focused DRY

Date: 2026-08-06
Status: implemented (branch `cleanup`)

## Context

openEO Studio grew feature by feature. The result worked, but several
structural inconsistencies made the codebase harder to navigate:

- React providers and UI lived under `app/utils/` next to pure helpers.
- Hooks were split across `app/hooks/`, feature folders, and `utils/`.
- Pages mixed flat `*-page.tsx` files with route folders.
- Components imported page modules (e.g. share dialog → share header).
- Near-identical BackendService→map adapters were copy-pasted across share
  surfaces.
- Default editor config values were triplicated.
- Scene cards lived under `components/landing/` even though they are shared
  with projects/samples.
- A small set of modules, exports, and dependencies were unused.

This spec defines the target organization and the abstractions that are
worth keeping. It is the design record for the cleanup;

## Goals

- Make folder location predict what a file does (page vs component vs util
  vs context vs styles).
- Remove unused modules, exports, and dependencies without breaking runtime
  behavior.
- Eliminate the copy-paste that was already drifting (service adapters,
  default editor config, dashed empty states).
- Keep feature-specific code colocated; keep generic helpers in `utils/`.
- Prefer small, obvious extractions over frameworks or generic “resource”
  layers.

## Non-goals

- Deleting algorithm `.py` files that are not yet wired into sample scenes
  (they remain available for future scenes / docs).
- Removing `LightMode` / `DarkMode` exports from the color-mode module.
- Unifying Project / Service / Scene cards into one generic card.
- Unifying editor / code / service options menus into one menu framework.
- Introducing a generic `useResourceStore` or auth lifecycle facade.
- Rewriting openEO HTTP layering beyond routing store mutations through
  existing `utils/openeo/*` helpers.
- Visual / product UX changes beyond shared empty-state markup and the
  small band-chip icon refresh.

## Decisions

### 1. Hooks placement

**Feature-specific hooks stay with the feature.** Generic hooks live in
`utils/`.

| Hook | Location | Rationale |
|------|----------|-----------|
| `use-code-execution`, `use-load-project`, `use-delete-project`, `use-merged-process-graph` | `components/editor/` | Editor-only |
| `use-map-tile-status` | `components/map/` | Map-only |
| `use-service-cleanup` | `components/services/` | Services lifecycle |
| `use-effect-after-mount` | `utils/` | Generic React helper |

The empty `app/hooks/` directory and `$hooks` alias are removed. Call sites
import feature hooks from their feature path (or `$utils/...` for generics).

### 2. React does not live in `utils/`

| Module | Target |
|--------|--------|
| `smart-link`, `md-renderer` | `components/common/` |
| `auth-monitor` | `components/auth/` |
| `color-mode` (provider, hooks, button; **keep** `LightMode` / `DarkMode`) | `contexts/color-mode.tsx` |
| `reload-detector` | `utils/reload-detector.ts` (not a component; correct extension) |

### 3. Layering: components never import `$pages/*`

Page-only chrome that is reused by components moves under `components/`.

- `pages/share/header.tsx` → `components/share/share-header.tsx`
- Share page and share dialog both import from `$components/share/...`

### 4. Page file layout

Every top-level route uses a folder + `index.tsx`:

| Route | Path |
|-------|------|
| `/` | `pages/landing/index.tsx` |
| `/editor`, `/editor/:sceneId` | `pages/editor/index.tsx` |
| `/docs` | `pages/docs/index.tsx` (+ `docs-content.md`) |
| `/projects`, `/services`, `/share`, `/sandbox`, `/uhoh` | already folder-style; unchanged |

### 5. Feature folder homes

| Item | Target |
|------|--------|
| Results workspace (`results-panel`) + `use-merged-process-graph` | `components/editor/` |
| Setup controls (collection, temporal, cloud, bands) | `components/editor/setup/` |
| `ruff-linter` | `utils/ruff-linter.ts` |
| CodeMirror theme helpers | `styles/codemirror-theme.ts` |
| `NotFound` error class | `utils/errors.ts` |
| UDP / project graph helpers formerly `utils/process-graphs.ts` | `utils/openeo/user-defined-processes.ts` |

`ResultsPanel` (formerly `MapPanel`) is the right-hand editor shell with
Map / Visual / JSON tabs — not a map-only component, so it lives under
`editor/` with that name.

Scene UI is not landing-specific: `SceneCard` appears on the landing
catalog and in `SceneGrid` on projects/samples, so it belongs under
`components/scenes/`.

Band remove / grip controls use Lucide (`LuGripVertical`, `LuX`) inline in
`band-array-builder`; there is no shared `icon-buttons` module.

### 6. Shared service adapters

One module owns BackendService → display / map conversion:

`utils/openeo/service-adapters.ts`

- `getServiceDisplayName`
- `decodeServiceUrl`
- `getServiceExtent`
- `backendServiceToServiceInfo`

Share page, share dialog, and service options (narrative export URL/extent)
use these helpers. No local copies.

### 7. Default editor config

`config/default-editor-config.ts` exports `DEFAULT_EDITOR_CONFIG` and
`createInitialConfig()`. Consumers:

- `editor-store` initial / reset / hydrate
- `use-load-project` fallbacks when UDP metadata is incomplete
- blank-scene reset on the editor page

### 8. `ServiceScope` single source

`ServiceScope` is defined on `$types` and re-exported from
`service-scope-badge` for convenience. The services store and call sites
import the shared type; they do not redefine `'public' | 'private'`.

### 9. Service HTTP ownership

Permanent-service mutations go through `utils/openeo/permanent-services.ts`:

- `listPermanentServices`
- `getPermanentService`
- `createPermanentService`
- `deletePermanentService`
- `updatePermanentServiceConfiguration`

The Zustand services store orchestrates state only; the share page loads
details via `getPermanentService` rather than raw `fetchJson` + URL
assembly.

### 10. Empty state shell

`components/common/empty-state.tsx` provides the dashed-border empty / error
panel (`icon`, `title`, `description`, `variant`, optional `actions`).
Projects, services, and share error UIs use it. Domain cards and menus stay
separate.

### 11. Naming alignments

- `code-options-menu.tsx` → `code-info-menu.tsx` (matches `CodeInfoMenu`)
- `map-panel` / `MapPanel` → `results-panel` / `ResultsPanel`
- `components/landing/` → `components/scenes/`
- `config/baseUrl.ts` → `config/base-url.ts`
- Drop unnecessary `.js` suffixes on local / alias imports
- Process-graph barrel exports named `ProcessGraphViewer` only (no default
  re-export); lazy `results-panel` import unwraps the named export
- `AUTH_PREFIX` is module-private in `utils/api.ts`

### 12. Removals

Safe to delete / drop:

- `components/editor/loader-panel.tsx` (unused)
- `components/common/icon-buttons.tsx` (replaced by Lucide in band builder)
- `editor-store.clearServices` (unused; callers use `setServices` /
  `clearEditor`)
- Unused TS export `APP_DESCRIPTION` from `constants.ts` (runtime /
  `VITE_APP_DESCRIPTION` still powers HTML meta and Docker config)
- Unused `VITE_MAPBOX_ACCESS_TOKEN` typing (app uses MapTiler)
- Dependencies with zero imports: `polished`, `@testing-library/react`,
  `@testing-library/user-event`, `ts-node`, direct `playwright` (CLI comes
  from `@playwright/test`)
- Commented dead username block in `user-info.tsx`

Explicitly **not** removed: any file under `app/algorithms/**/*.py`.

### 13. Light shared UI / editor polish

- `AuthLoading` shared by `RequireAuth` and the OIDC callback shell in
  `app.tsx`
- `styles/codemirror-theme.ts` shares Fira Code theme + theme compartment
  helpers between editable and read-only editors (not a full mount lifecycle
  hook)
- Read-only CodeMirror hides active-line highlighting (transparent
  `.cm-activeLine` / `.cm-activeLineGutter`) so JSON / graph dumps do not
  show a selected-line chrome

## Resulting mental model

```
app/
  pages/<route>/index.tsx     # route entry only
  components/<feature>/       # UI + feature hooks for that feature
  components/common/          # cross-feature UI primitives
  contexts/                   # React providers (color mode, pyodide, …)
  stores/                     # Zustand orchestration
  styles/                     # Chakra system + CodeMirror theme helpers
  utils/                      # pure helpers + generic hooks
  utils/openeo/               # openEO HTTP + domain adapters
  config/                     # runtime / defaults / samples
  types/                      # shared TS types
```

Import direction: pages → components / stores / utils / styles; components →
stores / utils / contexts / styles; never components → pages.
