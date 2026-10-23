---
status: proposed
date: 2026-10-20
decision-makers: to be agreed
informed: OpenEO Studio contributors
---

# Where the first assistant departs from the agent contract

## Context and Problem Statement

ADR-0004 (agent integration contract) chose AG-UI and a proposal model, and
put the contract in `app/types/agent.ts`. The Assistant tab is the first
client of that contract. It talks to an agent built on
[mcp-toolsets-runtime](https://github.com/developmentseed/mcp-toolsets-runtime),
with its tools in the `openeo-studio` toolset of
[openeo-studio-assistant](https://github.com/developmentseed/openeo-studio-assistant).

Most of the tab follows ADR-0004. A few things cannot, yet, without losing
what the tab does today. This ADR records each departure: what ADR-0004
says, what the tab does instead, why, and the way back.

## Decision Drivers

- Keep to ADR-0004 wherever the tab can do so at no loss.
- Keep the token cost of a run low: the agent reads the project by
  reference, never by copying the code into the conversation.
- The user stays in control: no change applies without the user.
- Every departure is written down, with what ends it.

## Considered Options

- Hold the Assistant tab until the agent runtime supports everything that
  ADR-0004 assumes.
- Ship the tab with the departures below, recorded here.

## Decision Outcome

Chosen option: "Ship with the departures recorded". The departures are
listed below, with the work that removes each one. Most of that work belongs
to the agent runtime, not to Studio.

### The changes, by area

**openEO Studio as it was.** Changes outside the assistant, which every user
sees:

- `loader.py` gives `datacube` the collection's metadata, so `.band()` and
  `filter_bands` know the configured bands and the backend's name for the
  bands dimension. `code-runner.ts` passes it as `cubeDimensions`, and
  `RUN_CONFIG` is now read with `json.loads`.
- `loader.py` adds `algorithm(url)`, which runs a published process graph on
  the project's area, dates and cloud cover. When the graph leaves time alone,
  it takes the first clear pixel, as `reduced` does. The editor's linter knows
  the name (`ruff-linter.ts`).
- A failed run says which step failed: running the code, validating the
  graph, creating the map services, or saving. An HTTP error shows the
  backend's message (`api.ts`).
- The editor store counts revisions and keeps the last run's graphs and error.
  A project switch clears them.
- Saving a new project moves to its route before recording its id, so the
  blank page no longer resets the editor.

**The agent panel (the Assistant tab).**

- The tab is enabled when an agent is configured (`AGENT_URL` in the image,
  or `VITE_AGENT_URL`).
- The conversation is kept per project in `sessionStorage`
  (`assistant-store.ts`). It survives a tab switch, a reload and a save.
- A proposal is a card: a line diff for code, `before → after` for the
  configuration. The cards are held until the run ends, then accepted or
  rejected one by one or all together. Once the last card is decided, the project
  runs and saves, as the Save button does, if any card was accepted. A code card is superseded once the code
  moves on.
- An execution error offers "Ask the assistant", which sends the error.
- The agent sits behind the same sign-in as the backend, so Studio sends it
  the user's openEO token, as it does the backend.

**AG-UI and the agent runtime.** Departures 1, 2, 3, 6, 8 and 9 are here.

- Studio runs the agent with `@ag-ui/client`'s `HttpAgent`
  (`app/utils/agent.ts`). The state document goes in the run's `state`, under
  `studio`.
- The runtime stores the posted `state` as session state, for tools to take
  by handle. This is runtime work, on the `feat/client-state` branch of
  mcp-toolsets-runtime.
- Studio reads a proposed algorithm's code from the agent's state route, so
  the code never passes through the model.

**Others.** Departures 4, 5 and 7 are here.

- The `openeo-studio` toolset has 11 tools: lookups,
  `check_project`, `read_code`, and the three `propose_*` tools. The tools
  refuse an edit made against code that has since changed, a band index or
  dimension name the project does not have, code that does not parse,
  `.band()` inside a reducer, and a collection that lacks the configured
  bands.
- The algorithm catalogue (`scripts/build_catalogue.py`, `catalogue.json`)
  covers `openeo-udp` and APEx. Each entry has either code or the reason it
  cannot run here (`docs/assistant-algorithms.md`).
- The toolset, the agent and its system prompt are in
  [openeo-studio-assistant](https://github.com/developmentseed/openeo-studio-assistant),
  which publishes their images. `docs/assistant-prompts.md` holds prompts for
  trying them.

### What follows ADR-0004

- AG-UI over server-sent events, through `@ag-ui/client`'s `HttpAgent`.
- The state document has the shape of `StudioStateDocument`, built by
  `studioDocument()` in `app/utils/agent.ts`:
  - the project's id, title, origin, unsaved state and revision;
  - the collection, and the loader's `parameters` in openEO terms;
  - the code, the map layers, the diagnostics, the backend;
  - `sources` and `applyMode`.
- `revision` is a counter on the editor store. Every change by the user or by
  an accepted proposal increments it.
- `propose_configuration` takes openEO names and shapes: `time` as a
  temporal interval, `bounding_box` as a bounding box with
  `west`/`south`/`east`/`north`, plus `bands` and `cloud_cover_max`. These are
  the names that `loader.py` declares, except `cloud_cover_max`: the loader
  declares one parameter per property filter, and `cloud_cover_max` stands
  for the `eo:cloud_cover < max` filter only. Studio keeps the other filters
  as they are. `projectParameters()` and `deriveConfigFromProject()` convert
  in both directions, and a test checks that they agree.
- Every change is a proposal. The user accepts or rejects each one. The apply
  mode is `ask`, the only mode that ADR-0004 builds first.
- Proposal statuses are the contract's (`pending`, `accepted`, `rejected`,
  `superseded`).
- The agent sends arguments only. Studio computes the code change itself
  (`applyEdits`) and shows it as a diff.
- The conversation is a Zustand store persisted to `sessionStorage`, per
  ADR-0003, and is tied to its project.

### Where it departs

| # | ADR-0004 says | The tab does | Why | The way back |
|---|---|---|---|---|
| 1 | Studio declares the tools for each run in `RunAgentInput.tools`. | The tools live in the agent's MCP toolset. Studio declares none. Studio acts only on the three tool calls it knows: `propose_code_edit`, `propose_configuration` and `propose_algorithm`. Any other call is shown as a line and changes nothing. | The runtime runs server-side MCP tools and ignores `RunAgentInput.tools`. Its tools read the project from state by handle (`@state:studio`), which keeps the code out of the conversation. | The runtime runs client-declared AG-UI tools. Then the three `propose_*` tools become Studio-declared, and the lookups stay server-side. |
| 2 | A proposal's tool call waits for the user's decision, and Studio returns a `ToolDecision` as a ToolMessage. | The `propose_*` tools return at once. Studio holds the cards until the run ends, so they are decided together. The agent is not told the decision. It sees the result in the next run's state: the code, the parameters and the `revision`. | The runtime can pause a run and resume it: a tool calls LangGraph `interrupt()`, the run finishes with an AG-UI `interrupt` outcome, and the next run carries `resume`. But only a tool in the agent's own process can call `interrupt()`, and the `propose_*` tools run in the MCP toolset's server. Pausing on each proposal would also end the run at the first card, where users asked for the cards after the answer, decided together. | The runtime gates a named toolset tool on the user's answer: it pauses after the tool returns and resumes with the decision. Studio then answers with `ToolDecision`. One pause per run, holding every proposal of the run, would keep the cards decided together. |
| 3 | A proposal is a `Proposal`: a JSON Patch, its inverse, `baseRevision` and `toolCallId`. The kinds are `collection`, `parameters` and `code`. | The tab keeps a smaller record: the code edits with the code they were made against, or the configuration values with the values before them. One configuration proposal may change both the collection and the parameters. A code proposal is superseded when the code no longer matches the code it was made against. | The patch and its inverse exist to support undo and the `auto` modes. Neither is built, and ADR-0004 defers both. Comparing against the base code catches every edit, including typing that the debounce has not yet stored. | Build `Proposal` records when undo or the `auto` modes are built. Each configuration proposal then splits into a `collection` proposal and a `parameters` proposal. |
| 4 | Studio sends `loader.py` in the AG-UI `context`, so that the agent sees the code's environment, and nothing else describes it. | The agent's prompt names what the loader defines (`datacube`, `reduced`, `add_graph_to_map`, `algorithm(url)`). The rest comes back in tool results, when it is needed: `read_code` lists the bands loaded and the bands dimension's name, with the rules for Studio code, and `check_project` adds what to look for when debugging. | The runtime passes `state` to the agent, not `context`. And `loader.py` is 7.6k characters, about 2k tokens: sent with every model call, it would add half again to a call that now starts at about 4k. | The runtime gives `context` to the model. Before Studio sends `loader.py`, weigh that cost against the drift below; sending it once per thread, rather than per call, would remove most of it. |
| 5 | The state document holds the fields of `StudioStateDocument`. | The document also carries `graphs`: the process graphs of the last run. | `check_project` traces and validates the graph that the code built. Rebuilding it from the code would mean running Python in the agent. | Add `graphs` (or `lastRun.graphs`) to `StudioStateDocument`, and regenerate the schema with `pnpm schema:agent`. |
| 6 | `diagnostics` is sent for the error triggers only. | `diagnostics.execution` is sent with every run after a failed run. `validation` and `lint` are always empty. No trigger kind is sent: the "Ask the assistant" button on the error is the `editor.executionError` trigger in all but name. | A typed question such as "why is nothing rendering?" needs the error too. The message is one line, not a traceback. | Send the trigger kind with each run, and let the trigger decide what the document carries. Lift the validation and lint diagnostics into the editor store. |
| 7 | The agent proposes a catalogue item as a `catalogueItem` reference, from a provider in `sources`. | `sources` is empty. The agent's knowledge of published algorithms is the toolset's own catalogue, built from `openeo-udp` and the APEx `apex_algorithms` repository. An algorithm comes back as one `propose_algorithm` call that names the stored algorithm by handle. Studio reads the proposal (the configuration and the code) from the agent's state route and shows it as a configuration card and a code card. For an APEx process graph, the code calls `algorithm(url)` in `loader.py`. | The catalogue providers of the catalogue ADR (0004) are not built. | Once the `openeo-udp` and `apex` providers exist, `propose_algorithm` becomes a `catalogueItem` proposal of `{providerId, sourceRef}`, and Studio opens the item through its provider instead of reading the code from the agent. `algorithm(url)` is what an APEx provider needs to open an item that is only a graph. |
| 8 | The agent publishes `/.well-known/agent-card` with its contract versions. | The runtime publishes no card, and Studio checks none. | The runtime has no such endpoint. | The runtime serves the card, and Studio refuses an agent whose card lacks `AGENT_CONTRACT_VERSION`. |
| 9 | (not covered) | The state document is sent under the key `studio`: `{"studio": <document>}`. | The runtime stores each top-level key of `state` as a handle that tools can read. | None needed. The document itself is unchanged. |

### Consequences

- Good: the tab works today against a real agent, and keeps the code out of
  the conversation.
- Good: each departure is a known piece of runtime work. Most need no change
  in Studio beyond deleting a workaround.
- Bad: until #2 is closed, the agent cannot tell a rejected proposal from one
  that the user has not yet decided.
- Bad: until #4 is closed, the loader is described in two places, the agent's
  prompt and `read_code`'s rules, and either can fall behind `loader.py`.
- Bad: until #7 is closed, the catalogue is copied into the toolset and must be
  rebuilt (`scripts/build_catalogue.py`) when `openeo-udp` or APEx changes.

### Confirmation

- `studioDocument()` is typed as `StudioStateDocument & { graphs }`, so a
  change to the contract fails the type check here.
- `test/utils/agent.test.ts` checks that `projectParameters()` is read back
  unchanged by `deriveConfigFromProject()`.
- Close each departure by deleting its row, and its workaround, in the same
  change.
- Measured on 14 prompts, twice each, against the Mistral agent: about 15k
  input and 200 output tokens per run, half of the first version's 32k and
  430, with every run giving the expected cards.
