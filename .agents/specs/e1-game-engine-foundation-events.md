# Game Engine Foundation & Event Contracts

## Why

We need a deterministic, shared core before implementing board interaction and rendering details. Locking event contracts and state reconstruction first prevents client/server drift and protects replayability.

## What

Create a framework-agnostic game-domain foundation for 1v1 casual Fives with strict TypeScript types and versioned events. This should define tile identity, game event schema, and deterministic reconstruction entry points used by app code and future edge functions.

## Context

**Relevant files:**

- `docs/product-requirements.md` — defines MVP scope (1v1 casual Fives to 100, async model).
- `docs/software-requirements-specification.md` — defines event sourcing, deterministic validation, and immutable `game_events`.
- `docs/user-interface-design.md` — defines board replay expectations and turn/expiration UX states.
- `.agents/templates/spec.md` — template requirements for executable task breakdown.

**Patterns to follow:**

- Pure deterministic engine functions, independent from UI/network.
- Event-sourced reconstruction as the source of derived game state.
- Strict TypeScript discriminated unions for payloads and event parsing.

**Key decisions already made:**

- MVP game mode is casual async 1v1 Fives to 100.
- Game state is reconstructed from immutable event logs.
- Server re-validates all move submissions before appending events.

## Constraints

**Must:**

- Keep domain logic pure and framework-agnostic.
- Use strict TypeScript types (no `any`).
- Include event versioning from first implementation.

**Must not:**

- Add new npm dependencies.
- Implement UI rendering, gesture handlers, or network calls.
- Refactor unrelated app routes/components.

**Out of scope:**

- Full Fives scoring rules implementation.
- Board layout geometry and viewport fitting.

## Tasks

### T1: Create core game-domain type system

**Do:** Define canonical tile/player/game identifiers and state contracts in a new engine domain folder. Include state slices needed by reconstruction and validation.

**Files:** `src/game-domain/types.ts`, `src/game-domain/index.ts`

**Verify:** `npm run lint`

### T2: Define versioned event schema and guards

**Do:** Add discriminated union event contracts (`GAME_STARTED`, `TILE_PLAYED`, `TILE_DRAWN`, `TURN_PASSED`, `ROUND_ENDED`, `GAME_ENDED`, `FORFEIT`) with parse/assert helpers for compatibility.

**Files:** `src/game-domain/events/schema.ts`, `src/game-domain/events/guards.ts`, `src/game-domain/index.ts`

**Verify:** `npm run lint`

### T3: Scaffold deterministic reconstruction entrypoint

**Do:** Add `reconstructGameState(events)` scaffold and deterministic state hash helper so replay consistency can be tested as subsequent specs are implemented.

**Files:** `src/game-domain/reconstruct.ts`, `src/game-domain/index.ts`

**Verify:** `npm run lint`

## Done

- [ ] `npm run lint` passes
- [ ] Manual: event schema can represent a complete round lifecycle without `any`
- [ ] No regressions in app navigation/UI code

## Decisions Confirmed

- Event ordering will use explicit `event_seq` (Option A) for deterministic replay and easier debugging.
- Round boundaries will be inferred from `GAME_STARTED` and `ROUND_ENDED`; no dedicated `ROUND_STARTED` event in MVP.
