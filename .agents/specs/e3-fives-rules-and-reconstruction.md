# Fives Rules Engine & State Reconstruction

## Why

The game must be legal and deterministic on both client and server, and all state must be replayable from events. We need complete Fives-to-100 rule logic before interaction layers can be trusted.

## What

Implement pure Fives move legality, scoring, turn progression, and round/game end conditions using event-sourced reconstruction.

## Context

**Relevant files:**

- `docs/product-requirements.md` — defines Fives to 100 as locked MVP mode.
- `docs/software-requirements-specification.md` — deterministic validation + reconstruction requirements.
- `.agents/specs/e1-game-engine-foundation-events.md` — prerequisite event/type scaffolding.

**Patterns to follow:**

- Pure functions for validation, apply move, and scoring.
- Replay from immutable events to compute authoritative derived state.
- Typed error/validation result objects (no exceptions for expected rule failures).

**Key decisions already made:**

- Server is authoritative and re-validates legality.
- Client local validation exists for UX only.
- Event log is the only durable source of truth.

## Constraints

**Must:**

- Keep Fives logic isolated in variant-specific modules.
- Support blocked-round and pass/draw flow needed for realistic gameplay.
- Remain deterministic for identical event logs.

**Must not:**

- Couple rules to UI coordinates/animations.
- Add networking logic in this spec.

**Out of scope:**

- Ranked timers and mode policy differences.
- 4-player support.

## Tasks

### T1: Implement Fives legality evaluation

**Do:** Build legal move generation and intent validation for current player based on open ends, spinner branch status, and tile orientation constraints.

**Files:** `src/game-domain/variants/fives/legal-moves.ts`, `src/game-domain/variants/fives/validate-move.ts`, `src/game-domain/types.ts`

**Verify:** `npm run test -- fives-legal-moves`

### T2: Implement scoring + round progression

**Do:** Add Fives pip-sum scoring, draw/pass handling, domino/block end conditions, and target score evaluation (to 100).

**Files:** `src/game-domain/variants/fives/scoring.ts`, `src/game-domain/variants/fives/round-resolution.ts`

**Verify:** `npm run test -- fives-scoring`

### T3: Integrate rules into reconstruction pipeline

**Do:** Update `reconstructGameState(events)` to apply Fives events and return complete derived state (turn, open ends, scores, round/game status, legal-move hints).

**Files:** `src/game-domain/reconstruct.ts`, `src/game-domain/variants/fives/index.ts`

**Verify:** `npm run test -- reconstruct-from-events`

## Done

- [ ] `npm run test` passes for rules/reconstruction suites
- [ ] Manual: replaying identical event fixture yields identical final state hash
- [ ] No regressions in non-engine app modules

## Decisions Confirmed

- Opening rule: highest double is required as the first move.
- Blocked-round scoring: use standard pip-difference scoring.
