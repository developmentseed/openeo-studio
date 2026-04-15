# Plan: Resilient XYZ Service Lifecycle Management

OpenEO XYZ services are currently tracked only in-memory (`activeServices` array in `app/utils/code-runner.ts`) and orphaned on page reloads/tab close. We introduce an **instance UUID** (in `localStorage`) embedded in each ephemeral service's title for backend-side discovery and cleanup, plus a **permanent service** workflow with shareable links and a management panel.

---

## Phase 1: Instance UUID & Service Tagging

1. **Create `app/utils/instance-id.ts`** — utility that derives a stable instance UUID from `window.location.origin` (e.g. via a deterministic hash or by storing a UUID keyed by origin in `localStorage` key `openeo-studio-instance-id:<origin>`). Export `getInstanceId(): string`. This ties the identity to the deployment URL so that different studio instances (e.g. `https://studio.example.com` vs `https://staging.studio.example.com`) each get their own UUID and only clean up their own services.
2. **Define title conventions** in `app/utils/code-runner.ts` — Ephemeral: `"openeo-studio:ephemeral:<instanceUUID>"`, Permanent: `"openeo-studio:permanent:<serviceUUID>"`. Permanent services are never auto-cleaned.
3. **Update `createOpenEOService()`** to accept a `title` parameter instead of using the hardcoded `DEFAULT_SERVICE_CONFIG.title`.

## Phase 2: Cross-Session Cleanup

4. **Add `listOpenEOServices(authToken)`** — GET `${OPENEO_API_URL}/services`, returns `BackendService[]` with `{ id, url, title, type, enabled, configuration, created }`. *(new type in `app/types/index.ts`)* This is the shared primitive used by both cleanup and management workflows.
5. **Add `cleanupOrphanedServices(authToken, instanceId)`** — lists services, filters by `openeo-studio:ephemeral:<instanceId>` in title, deletes matches. Errors logged, never blocking.
6. **Startup cleanup hook** — new `useServiceCleanup` hook (or in `app/utils/auth-monitor.tsx`) calls `cleanupOrphanedServices()` once when the user becomes authenticated. *(depends on step 4-5)*
7. **Pre-execution cleanup** — update `processScript()` to also call `cleanupOrphanedServices()` as a safety net after the local in-memory cleanup. *(parallel with step 6)*

## Phase 3: Permanent Service Export

8. **Add `createPermanentService()`** in `app/utils/code-runner.ts` — creates service with permanent title and user-chosen `scope` (`'public'` or `'private'`). Returns the `BackendService` record from the backend (fetched via the `location` header after creation).
9. **Add `listPermanentServices(authToken)`** — calls `listOpenEOServices()` (from Phase 2), filters services whose title matches `openeo-studio:permanent:*`. Returns `BackendService[]` for display in the management panel.
10. **Add share button in `app/components/map/layer-control.tsx`** — icon button per service row, triggers permanent service creation + opens share dialog. *(depends on step 8)*
11. **Create `app/components/map/share-dialog.tsx`** — dialog with a **scope toggle** (`public` / `private`) shown before creation. After creation, shows copyable XYZ tile URL template + copyable link to the in-app viewer (`/share/<serviceId>`), with copy-to-clipboard buttons. For private services, the share link section is hidden (tile URL still shown for authenticated use in external tools).

## Phase 4: Shareable Viewer Page

12. **Create `app/pages/share-page.tsx`** — standalone page at `/share/:serviceId` that fetches service details and renders map with XYZ tiles using `MapViewer` + `MapLayers`. For public services: no auth needed, minimal UI. For private services or fetch failures: show an appropriate "Access denied" or "Service not found" message.
13. **Add route** in `app/app.tsx` — `/share/:serviceId` → `SharePage`.

## Phase 5: Permanent Service Management Panel

14. **Create `app/components/layout/services-panel.tsx`** — dialog accessible from the app header. On open, calls `listPermanentServices(authToken)` to fetch permanent services from the backend. Each entry shows: title, scope badge (`public`/`private`), creation date, copy share link (public only), delete button (calls `deleteOpenEOService()`). **Only visible when the user is authenticated.**
15. **Add trigger in app header** — icon button to open the panel. **Rendered conditionally: only shown when the user is logged in.**
16. **Handle errors** — on panel open, if the backend is unreachable or returns an error, show an appropriate message. Loading state while fetching.

---

## Relevant Files

| File | Changes |
|------|---------|
| `app/utils/code-runner.ts` | Add `listOpenEOServices`, `cleanupOrphanedServices`, `createPermanentService`, `listPermanentServices`; modify `createOpenEOService` to accept title param |
| `app/types/index.ts` | Add `BackendService` type (shared across cleanup + management) |
| `app/components/map/layer-control.tsx` | Add per-service share button |
| `app/components/map/map-viewer.tsx` | Pass share handler through |
| `app/app.tsx` | Add `/share/:serviceId` route |
| **New** `app/utils/instance-id.ts` | Instance UUID management |
| **New** `app/pages/share-page.tsx` | Standalone shared service viewer |
| **New** `app/components/map/share-dialog.tsx` | Share link dialog |
| **New** `app/components/layout/services-panel.tsx` | Permanent service management panel |
| **New** `app/hooks/use-service-cleanup.ts` | Startup cleanup hook |

## Verification

1. **Unit test**: `cleanupOrphanedServices()` filters only ephemeral services matching this instance UUID — mock `listOpenEOServices` returning mixed service types
2. **Unit test**: `getInstanceId()` returns stable UUID across calls, generates one if missing
3. **Unit test**: `listPermanentServices()` filters only `openeo-studio:permanent:*` services from the full backend list
4. **Playwright test**: Execute code → reload → execute again → list services API shows no orphans
5. **Playwright test**: Create permanent service → open share link in incognito → verify map renders
6. **Manual**: Open services panel → delete permanent service → verify removed from backend

## Decisions

- **Instance UUID scope**: One per studio instance URL (`window.location.origin`). The UUID is stored in `localStorage` keyed by origin, so different deployments (production, staging, local dev) each have their own identity and never interfere with each other's services. Multiple tabs on the same origin share the same UUID — the second tab's cleanup may remove the first tab's ephemeral services, but they're re-created on next execution
- **Title as tag**: `openeo-studio:<type>:<uuid>` format in the `title` field for easy filtering via `listOpenEOServices`
- **Service scope**: Users choose `public` or `private` when creating a permanent service. Public services are accessible without auth (shareable viewer works for anyone). Private services require authentication (share link hidden in UI, tile URL still usable with auth tokens in external tools).
- **Management panel auth-gated**: The services panel and its header trigger are only rendered when the user is authenticated
- **No localStorage for permanent services**: The openEO backend is the single source of truth. Permanent services are discovered by listing all services and filtering by the `openeo-studio:permanent:*` title prefix. This avoids stale local references and works across browsers/devices for the same authenticated user
- **Excluded from scope**: User-provided names for permanent services, quotas/limits, admin-level cross-user cleanup
