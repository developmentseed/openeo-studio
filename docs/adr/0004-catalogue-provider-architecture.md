---
status: proposed
date: 2026-09-08
decision-makers: @emmanuelmathot @danielfdsilva
informed: OpenEO Studio contributors
---

# Provider-based catalogue architecture for sample scenes

## Context and Problem Statement

Sample scenes come from one static file, `app/config/sample-scenes.ts`. Adding a sample means editing code and shipping a release, and every sample is coupled to whichever openEO backend is configured: a scene's `collectionId` and band names only make sense for one backend.

We want to load catalogue entries from more than one source (a local static list, the APEx Algorithm Catalogue, public UDPs from the connected openEO backend), without hardcoding a hand-maintained list of everything. The "sample" framing itself is being reconsidered in favor of a catalogue with text/tag search and pagination.


## Decision Drivers

- Add new catalogue sources without hardcoded lists or new app releases.
- Support providers that call out over the network and paginate on their own terms (e.g. APEx).
- Support providers that have no real pagination at all (the local static list).
- Support filtering by provider, free text, and tags.
- Support resolving one entry directly, for editor deep-links.
- The deployer decides which providers are active.
- One failing provider must not break the rest of the catalogue.

## Considered Options

- Full-list interface: `listScenes(): Promise<SampleScene[]>`, no query argument.
- Capability-based interface: a minimal base contract plus an optional, richer search/paginate capability some providers implement and others don't.
- Required `listScenes(query, cursor)` + `getScene(id)`, with each provider managing its own pagination cursor independently (chosen).

## Decision Outcome

Chosen option: "Required `listScenes(query, cursor)` + `getScene(id)`", because it is the simplest contract that behaves identically whether or not a given provider has real pagination, never requires fetching an entire remote catalogue into memory just to support search, and avoids maintaining two different provider shapes for "simple" versus "advanced" sources.

### Consequences

- Good: adding a provider for a new deployment means implementing two methods.
- Good: the registry can drop a failing provider without affecting the others.
- Good: id namespacing (below) means an editor deep-link resolves with exactly one provider call, not a fan-out over every active provider.
- Bad: the catalogue UI cannot show one combined "page 3 of 47" across all sources. It must treat each provider as an independently-paginated section instead (see below).
- Bad: existing static-list consumers (`EditorPage`, `samples.tsx`, the landing page) move from synchronous access to hooks with a loading state.

## Pros and Cons of the Options

### Full-list interface (`listScenes(): Promise<SampleScene[]>`)

- Good: simplest possible contract.
- Good: trivial to implement for the local static list.
- Bad: a provider like the APEx one would have to fetch its entire catalogue up front, or invent an out-of-band paging mechanism the interface doesn't express, which defeats the purpose of the catalogue's own pagination.
- Bad: filter could only happen after getting all the entries.

### Capability-based interface

- Good: lets trivial providers opt out of query handling entirely.
- Bad: none of the known providers actually benefit from an interface that's dynamic. Even the local list needs to support the catalogue's text/tag filtering.

### Required `listScenes(query, cursor)` + `getScene(id)`, independent cursors (chosen)

- Good: one contract works for static and remote, paginated and non-paginated sources alike.
- Good: "has more" reduces to "did I get a `nextCursor` back?" No special-casing needed for providers that always return everything in one call.
- Bad: slightly more boilerplate for the trivial local-list provider, which must accept a query object it only filters in memory, versus a bare `listScenes()`.

## Why traditional pagination doesn't apply here

A conventional paginated list assumes one authoritative source that knows its total count and page boundaries: "page 3 of 47." Nothing here has that.

The providers don't even agree on what a "page" is: the local list has no real pagination at all, just a fixed, small, in-memory array. They don't agree on total counts either, since a remote catalogue may not report how many results exist up front, and computing that would mean fetching everything anyway, which defeats the point of its own pagination. And there's no meaningful shared page number: "page 2 of the combined catalogue" is undefined when one source has five items total and another has hundreds spread across an unknown number of pages, so a shared index can't stay in sync across sources with unrelated internal page sizes.

Because of this, the design never reconciles providers into one global page counter. Each provider manages its own continuation independently through a cursor, and the registry keeps that per-provider rather than merging it into a single number.

**What the cursor is:** an opaque, provider-defined string returned alongside a batch of results, meaning "there is more after this batch, and this is what you hand back to get it." It carries no meaning to the registry or to any other provider. It is passed straight through, unexamined, to `listScenes` on the same provider that issued it. For a provider that never has more than one batch, the cursor is simply absent.

**How it's used:**

1. The registry calls `listScenes(query, providerIds?)`, fanning out to every named provider (or all active providers if `providerIds` is omitted) in parallel.
2. Each provider returns `{ items, nextCursor? }`. A present `nextCursor` means "ask again with this for more"; an absent one means this provider is exhausted for this query.
3. Continuing one provider's pagination is a distinct call: `registry.loadMore(providerId, query, cursor)`. It always names the provider and its cursor explicitly.
4. A provider that never returns a `nextCursor` is simply never handed to `loadMore` again. Nothing needs to detect or configure that.

Every provider only has to answer "given this cursor, or none, here is a batch and maybe a cursor for more." It never has to reason about any other provider.

## Provider interface

```ts
interface CatalogueQuery {
  text?: string;
  tags?: string[];
  pageSize?: number;
  providerIds?: string[]; // registry-only: restrict fan-out to these providers
}

interface SampleSourceProvider {
  id: string; // 'json' | 'apex' | 'openeo-udp' | ...
  listScenes(
    query: CatalogueQuery,
    cursor?: string
  ): Promise<{
    items: SampleScene[];
    nextCursor?: string;
  }>;
  getScene(id: string): Promise<SampleScene | undefined>;
}
```

`pageSize` is a hint from the caller, not a directive the registry enforces. Each provider still fully owns its own pagination mechanics and may honor it exactly, clamp it to its own upstream limit, or ignore it altogether if it never paginates.

## Registry

The registry owns the list of active providers. It is built once, from an explicit list passed in at construction.

```ts
interface ProviderPage {
  providerId: string;
  items: SampleScene[];
  nextCursor?: string;
  error?: unknown; // set, with items omitted, if this provider's call failed
}

interface SampleRegistry {
  listScenes(query: CatalogueQuery, providerIds?: string[]): Promise<ProviderPage[]>;
  loadMore(providerId: string, query: CatalogueQuery, cursor: string): Promise<ProviderPage>;
  getScene(id: string): Promise<SampleScene | undefined>;
}

const scopeId = (providerId: string, localId: string) => `${providerId}:${localId}`;

function splitScopedId(scopedId: string): [providerId: string, localId: string] | undefined {
  const i = scopedId.indexOf(':');
  return i === -1 ? undefined : [scopedId.slice(0, i), scopedId.slice(i + 1)];
}

const scopeScene = (providerId: string, scene: SampleScene): SampleScene => ({
  ...scene,
  id: scopeId(providerId, scene.id)
});

function createSampleRegistry(providers: SampleSourceProvider[]): SampleRegistry {
  const providersById = new Map(providers.map((p) => [p.id, p]));

  function resolve(providerIds?: string[]): SampleSourceProvider[] {
    return providerIds
      ? providerIds.map((id) => providersById.get(id)).filter((p): p is SampleSourceProvider => !!p)
      : providers;
  }

  return {
    async listScenes(query, providerIds) {
      const targets = resolve(providerIds);
      const settled = await Promise.allSettled(targets.map((p) => p.listScenes(query)));

      return settled.map((result, i): ProviderPage => {
        const providerId = targets[i].id;
        if (result.status === 'fulfilled') {
          return {
            providerId,
            items: result.value.items.map((s) => scopeScene(providerId, s)),
            nextCursor: result.value.nextCursor
          };
        }
        console.error(`Provider "${providerId}" failed`, result.reason);
        return { providerId, items: [], error: result.reason };
      });
    },

    async loadMore(providerId, query, cursor) {
      const provider = providersById.get(providerId);
      if (!provider) throw new Error(`Unknown provider: ${providerId}`);
      try {
        const { items, nextCursor } = await provider.listScenes(query, cursor);
        return { providerId, items: items.map((s) => scopeScene(providerId, s)), nextCursor };
      } catch (error) {
        console.error(`Provider "${providerId}" failed`, error);
        return { providerId, items: [], error };
      }
    },

    async getScene(id) {
      const parsed = splitScopedId(id);
      if (!parsed) return undefined;
      const [providerId, localId] = parsed;
      const scene = await providersById.get(providerId)?.getScene(localId);
      return scene && scopeScene(providerId, scene);
    }
  };
}
```

```ts
// app/config/sample-providers.ts
export const sampleRegistry = createSampleRegistry([jsonProvider]);
// a deployment enables apex/openeo-udp by adding them to this array
```

- `listScenes` and `loadMore` both go through `Promise.allSettled`/`try-catch` per provider. A rejected provider produces a `ProviderPage` with `error` set and an empty item list (logged), and is otherwise ignored, so the rest of the catalogue is unaffected. A provider that fails on `loadMore` is not automatically retried; the caller decides whether to try again.
- Providers only ever see and return their own local ids. The registry stamps every scene's id with `${providerId}:` on the way out (`scopeScene`) and strips it back off on the way in (`splitScopedId`) before calling `getScene`/`loadMore`. This is the one place that translation happens.

## jsonProvider (migration of the current static list)

Wraps the current `SAMPLE_SCENES` array unchanged: same thumbnails, algorithm files, and defaults. `listScenes` filters in memory by `text`/`tags` and returns every match in one call (`nextCursor` always absent). `getScene` is an array lookup. No network call, ships with the app; the registry assigns it the `json:` id prefix.

## Faking pagination over a larger flat, static JSON source

A JSON-backed provider pointed at a much larger file (bundled or fetched over HTTP) still has no native paging; it is just one array. The cursor mechanism above needs no change to support this: the provider fakes pagination entirely on its own side by loading the array once and slicing it, and the cursor just encodes a position in that array.

Building it as a function that returns a provider, rather than a single hardcoded provider object, means the same JSON-source logic can be pointed at more than one file: each call gets its own `id` and its own cached data, entirely independent of any other instance.

```ts
interface JsonCursor {
  offset: number;
}

const encodeCursor = (c: JsonCursor) => btoa(JSON.stringify(c));
const decodeCursor = (s: string): JsonCursor => JSON.parse(atob(s));

function createStaticJsonProvider(config: {
  id: string;
  url: string;
}): SampleSceneProvider {
  let cachedPromise: Promise<SampleScene[]> | undefined; // in-flight/resolved fetch, shared across calls

  function loadAll(): Promise<SampleScene[]> {
    cachedPromise ??= fetch(config.url)
      .then((r) => r.json())
      .then((data) => data.map(mapToSampleScene));
    return cachedPromise;
  }

  return {
    id: config.id,

    async listScenes(query, cursor) {
      const filtered = (await loadAll()).filter((s) => matchesQuery(s, query));
      const offset = cursor ? decodeCursor(cursor).offset : 0;
      const pageSize = query.pageSize ?? 20;

      const items = filtered.slice(offset, offset + pageSize);
      const nextOffset = offset + pageSize;
      const nextCursor =
        nextOffset < filtered.length
          ? encodeCursor({ offset: nextOffset })
          : undefined;

      return { items, nextCursor };
    },

    async getScene(id) {
      return (await loadAll()).find((s) => s.id === id);
    }
  };
}
```

```ts
// app/config/sample-providers.ts
export const sampleRegistry = createSampleRegistry([
  createStaticJsonProvider({ id: 'json', url: '/samples/official.json' }),
  createStaticJsonProvider({ id: 'community-json', url: '/samples/community.json' })
]);
```

One nuance: an offset is only valid against the *filtered* array it was computed from, so a cursor must always be replayed against the same query that produced it.

From the registry's side this provider is indistinguishable from a genuinely paginated one like the APEx provider: it sometimes returns a `nextCursor`, sometimes not. Whether the next batch came from a live paginated API or a slice of an array already sitting in memory is an implementation detail entirely internal to the provider.
