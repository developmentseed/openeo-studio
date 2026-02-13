---
status: accepted
date: 2026-02-12
decision-makers: @AliceR
informed: OpenEO Studio contributors
---

# Use Zustand for editor state persistence

## Context and Problem Statement

Users report that the Studio refreshes and they lose in-progress work (Issue #54). We need to persist editor state across token refreshes, accidental reloads, and other transient page reloads while keeping the implementation simple and lightweight.

## Decision Drivers

- Persist editor state across reloads without server dependence.
- Keep implementation small and easy to maintain.
- Avoid over-engineering and complex state machines.
- Provide a clear path to remove or adjust persistence later.

## Considered Options

- React Context + manual sessionStorage persistence
- XState Store
- TanStack Query persistence
- Zustand with persist middleware

## Decision Outcome

Chosen option: "Zustand with persist middleware", because it provides a lightweight, ergonomic store with built-in persistence and minimal boilerplate while fitting local UI state better than server-state tooling or a state machine.

### Consequences

- Good: State survives page reloads when persisted to `sessionStorage`.
- Good: Simple hook-based API fits existing React usage.
- Bad: Requires mindful partial persistence to avoid stale map services.

### Confirmation

Manual verification: refresh the page and confirm editor code and configuration are restored. Token refresh should not clear state. If `sessionStorage` is cleared (tab closed), state resets by design.

## Pros and Cons of the Options

### React Context + manual persistence

- Good: No new dependency.
- Bad: More custom glue code and more places to maintain.
- Bad: Easy to miss fields and create inconsistent persistence.

### XState Store

XState Store (https://stately.ai/docs/xstate-store) is a lightweight state management library from the XState team, separate from the full XState state machine library. It provides stores with reducers, snapshots, and event-driven updates.

- Good: Strong typing with TypeScript inference.
- Good: Event-driven architecture encourages explicit state transitions.
- Good: Built-in snapshot system for persistence use cases.
- Good: Smaller than full XState (focused on state management, not state machines).
- Good: Can integrate with XState actors if complex workflows emerge later.
- Bad: Less mature ecosystem and fewer community resources than Zustand.
- Bad: Event-driven model adds verbosity for simple setter patterns.
- Bad: No built-in persistence middleware - requires custom snapshot/restore logic.
- Bad: Larger bundle size (~4KB) compared to Zustand (~1KB core).
- Bad: Steeper learning curve with store/event/reducer concepts vs. simple setters.

**Why not chosen**: While XState Store's event-driven model is excellent for complex workflows with explicit state transitions, our editor state is primarily simple user input (code changes, slider adjustments, scene selection). The additional structure and verbosity of events/reducers doesn't justify the complexity for our use case. Zustand's direct setter approach is more ergonomic for UI state. If we need complex state machines later (e.g., multi-step data transformation pipelines with branching logic, complex form wizards with conditional steps), XState Store would be worth reconsidering.

### TanStack Query

- Good: Excellent for server state caching.
- Bad: Editor state is local UI state, not server data.

### Zustand with persist middleware

- Good: Small API surface and minimal boilerplate.
- Good: Built-in persistence via `sessionStorage` or `localStorage`.
- Bad: Must explicitly exclude transient state (e.g., map services).

## Persistence Across Reloads

Zustand persistence uses `sessionStorage` or `localStorage`. With `sessionStorage`, state survives actual page reloads in the same tab. It is cleared when the tab or browser is closed. If longer-lived persistence is required, `localStorage` can be used instead.
