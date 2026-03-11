# Engine Test Harness, Fixtures, and Determinism Checks

## Why

A deterministic engine and layout stack must be protected with repeatable automated tests before UI complexity increases. Fixtures also become the shared contract for client/server parity.

## What

Create a Vitest harness for rules, reconstruction, layout, viewport, and policy modules using reusable fixture event logs and deterministic snapshot/hash checks.

## Context

**Relevant files:**

- `.agents/specs/e1-game-engine-foundation-events.md` — event schema + reconstruction entrypoint.
- `.agents/specs/e3-fives-rules-and-reconstruction.md` — rules/scoring behavior under test.
- `.agents/specs/e4-board-layout-and-snapping.md` — geometry/snap behavior under test.
- `.agents/specs/e5-viewport-fit-and-board-camera.md` — camera transform policy under test.
- `.agents/specs/e7-match-policy-and-future-modes.md` — casual deadline policy under test.

**Patterns to follow:**

- Jest unit tests for pure domain logic.
- Deterministic fixtures that can be replayed in any environment.
- Explicit unhappy-path cases (illegal moves, invalid anchors, expired turn).

**Key decisions already made:**

- Rules engine and validators must be independently testable.
- Replay from event logs is authoritative.
- Deterministic output is non-negotiable for client/server consistency.

## Constraints

**Must:**

- Keep tests isolated from React Native rendering/runtime APIs.
- Reuse shared fixture builders across suites.
- Assert stable output, not just non-throwing behavior.

**Must not:**

- Depend on network or Supabase availability.
- Introduce brittle snapshots tied to unrelated formatting.

**Out of scope:**

- End-to-end UI gesture tests.
- Performance benchmarking pipeline.

## Tasks

### T1: Build fixture factories and sample logs

**Do:** Add strongly typed fixture helpers for common game states and event sequences (opening, spinner expansion, blocked round, expiration).

**Files:** `src/game-domain/__tests__/fixtures/builders.ts`, `src/game-domain/__tests__/fixtures/event-logs.ts`

**Verify:** `npm run test -- fixtures`

### T2: Add core deterministic suites

**Do:** Implement focused tests for legality, scoring, reconstruction, and policy modules with explicit expected outputs.

**Files:** `src/game-domain/__tests__/fives-legal-moves.test.ts`, `src/game-domain/__tests__/fives-scoring.test.ts`, `src/game-domain/__tests__/reconstruct-from-events.test.ts`, `src/game-domain/__tests__/casual-policy.test.ts`

**Verify:** `npm run test`

### T3: Add layout/viewport determinism and hash checks

**Do:** Validate anchor stability, snap target resolution, bounds/fit transforms, and invariant state/layout hash for repeated replays.

**Files:** `src/game-domain/__tests__/layout-anchors.test.ts`, `src/game-domain/__tests__/snap-resolution.test.ts`, `src/game-domain/__tests__/viewport-fit.test.ts`, `src/game-domain/__tests__/determinism-hash.test.ts`

**Verify:** `npm run test`

## Done

- [ ] `npm run test` passes for all domain suites
- [ ] Manual: rerun tests twice and confirm no nondeterministic failures
- [ ] No regressions in existing non-domain tests

## Open Questions

- Should determinism hash include layout transforms or be limited to canonical game state?
- Do we treat renderer-facing geometry ordering as part of deterministic contract?
