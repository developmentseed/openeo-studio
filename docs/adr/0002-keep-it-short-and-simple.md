---
status: superseded by ADR-0003
date: 2026-01-16
decision-makers: @AliceR
consulted: OpenEO Studio contributors
informed: OpenEO Studio contributors
---

# Keep it short and simple (KISS)

## Context and Problem Statement

We wanted to avoid premature complexity in state management while the project was evolving. The team preferred to address problems as they appeared and avoid adding external state libraries unless required.

## Decision Drivers

- Keep dependencies minimal and the mental model simple.
- Focus on solving one problem at a time.
- Avoid introducing a state library without a clear, immediate need.

## Considered Options

- Add a dedicated state management library (e.g., Zustand, Redux).
- Use React Context plus local state and targeted fixes.
- Introduce a full state machine approach (e.g., XState).

## Decision Outcome

Chosen option: "React Context plus local state and targeted fixes", because it aligned with KISS and allowed us to tackle issues incrementally without adding dependency overhead.

### Consequences

- Good: Fewer dependencies and a simpler architecture in early stages.
- Good: Faster iteration for isolated problems.
- Bad: Persistence across reloads remained a gap until later work.

### Confirmation

We confirm adherence by avoiding new state libraries unless a specific problem requires it and by documenting any future change with a new ADR.
