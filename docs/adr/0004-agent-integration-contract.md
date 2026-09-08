---
status: proposed
date: 2026-09-08
decision-makers: @emmanuelmathot @danielfdsilva
consulted: @olafveerman, VITO (@VictorVerhaert, @jdries)
informed: OpenEO Studio contributors
---

# Use AG-UI and a proposal model for the agent integration

## Context and Problem Statement

APEx CR1 section 2.2.2.2 makes Studio the visual layer for the openEO agent. VITO builds the agent, we build Studio. Issues #81, #82, #83 and #84 describe the features, but there is no contract between the two systems. Neither side can start without one.

Two questions need an answer. First, how does the agent talk to Studio? Second, how does the agent change the project without taking control away from the user?

The full design is a chapter in the APEx design book, `propagation/openeo_studio_agent.qmd` in `ESA-APEx/apex_design`. This ADR records the two decisions and their effect on this repository.

## Decision Drivers

- The user must stay in control. The agent must not change code or configuration on its own.
- We must be able to connect a different agent later. No supplier lock-in.
- The interface should use openEO terms, so that the agent works against a published standard.
- The contract must survive our own refactors, in particular the catalogue work in #102.

## Considered Options

- AG-UI (Agent-User Interaction Protocol) over server-sent events.
- A bespoke NDJSON stream of agent state, as in our `agent-kai` prototype.
- An embedded Chainlit copilot widget, as proposed in `apex_design` issue #24.

## Decision Outcome

Chosen option: **AG-UI, with a proposal model on top**, because AG-UI is an open protocol for exactly this connection, it has a LangGraph adapter for the agent of VITO, and it already defines the pieces we need: streamed text, tool calls, state deltas as RFC 6902 patches, and a human-in-the-loop pattern.

Two rules complete the decision:

1. **Studio declares the tools for each run.** AG-UI sends the tool list in `RunAgentInput.tools`. The agent cannot call a function that Studio does not declare, so Studio controls the set of possible changes.
2. **The agent proposes, the user decides.** Every change to code or configuration becomes a `Proposal`. The tool call waits until the user accepts or rejects it. This replaces the rule in issue #82, which let simple configuration changes apply on their own.

### Consequences

- Good: the user always sees a change before it happens.
- Good: any agent that speaks AG-UI works with Studio.
- Good: the agent reads openEO terms (`load_collection` arguments and openEO `Parameter` objects), not our internal `EditorConfigValues`.
- Bad: a proposal can become old while the user keeps typing. The design answers this with a `revision` counter and a `superseded` state.
- Bad: the context document needs a projection layer between the editor store and openEO terms. That is extra code, but it is also what keeps the contract stable across our refactors.

### Confirmation

This repository carries the contract only, not the implementation:

- `app/types/agent.ts` — the contract types: the Studio context document, `Proposal`, `ToolDecision`, `TriggerDescriptor`, and the AG-UI events that Studio reads.

Issue #86 asks how to separate our boilerplate from the code that the agent writes. The answer is in the design chapter, not in a file here. Studio runs three parts together: a configuration object, `app/algorithms/base/loader.py`, then the code of the user. The agent returns the third part only. When Studio starts a run, it sends the loader source itself in the AG-UI `context` field, so the agent sees the symbols that the code can use. We do not keep a second description of that environment, because `loader.py` is already the exact one.

The implementation is separate work. It needs a projection layer, an agent session store, a `revision` counter on the editor store, and the execution and lint diagnostics lifted into state so that the error triggers can read them.

## Pros and Cons of the Options

### AG-UI over server-sent events

- Good: an open protocol, related to MCP and A2A, with an official LangGraph adapter.
- Good: defines state snapshots and deltas as RFC 6902 patches, so a new field costs no protocol change.
- Good: human-in-the-loop is a tool call that waits for the user, which is exactly our proposal model.
- Bad: a newer protocol with a smaller ecosystem than a plain REST interface.

### Bespoke NDJSON, as in `agent-kai`

- Good: closest to the prototype we already wrote.
- Bad: no token streaming, and no error event on the connection.
- Bad: the client has to guess the meaning of each state field, so every new field costs coordinated edits in two languages.
- Bad: no approval step. We would invent a protocol where one exists.

### Embedded Chainlit widget

- Good: the fastest route to a demonstration.
- Bad: it supplies a complete chat application, and we need a protocol.
- Bad: it ties Studio to one agent, which defeats the goal of connecting other agents.
