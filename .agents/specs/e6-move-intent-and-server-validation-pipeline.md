# Move Intent Pipeline & Server Validation Contract

## Why

Drag interactions must produce authoritative, replay-safe events instead of mutating board state directly. A formal intent pipeline ensures the same legality logic runs locally (UX) and on server (truth).

## What

Define and implement move-intent payload contracts, client-side intent validation flow, edge-function validation integration points, and optimistic reconciliation rules.

## Context

**Relevant files:**

- `.agents/specs/e1-game-engine-foundation-events.md` — event/type schema prerequisites.
- `.agents/specs/e3-fives-rules-and-reconstruction.md` — legality/scoring behavior consumed by validation.
- `.agents/specs/e4-board-layout-and-snapping.md` — provides anchor IDs and candidate orientation from drag/snap.
- `docs/software-requirements-specification.md` — async submit flow and server-side re-validation requirements.

**Patterns to follow:**

- Client emits typed `MoveIntent` payload.
- Server validates with same rules module, appends immutable event.
- Client reconciles with authoritative event log via reconstruction.

**Key decisions already made:**

- Client prevents illegal moves for UX, server remains authoritative.
- Realtime updates propagate new events to opponent.
- Reconstruction drives UI state after each authoritative update.
- Illegal drops should never be committed: dragged tiles snap to nearest highlighted legal move or return to hand.

## Constraints

**Must:**

- Keep move-intent schema stable and explicit.
- Handle optimistic-UI rollback when server rejects intent.
- Preserve deterministic replay from stored events.

**Must not:**

- Persist derived board coordinates as authoritative state.
- Introduce ad-hoc server-only rules that diverge from shared domain logic.

**Out of scope:**

- Ranked matchmaking flow.
- Chat/toast/notification UX polish.

## Tasks

### T1: Define move-intent and validation result contracts

**Do:** Add strict intent/result types for client submission and server response, including machine-readable failure codes.

**Files:** `src/game-domain/move-intent.ts`, `src/game-domain/types.ts`

**Verify:** `npm run lint`

### T2: Implement client intent resolution flow scaffold

**Do:** Build a domain-facing adapter that accepts drag/snap output and produces validated `MoveIntent` for submission; illegal drop attempts return to hand and do not emit submit payloads.

**Files:** `src/game-domain/intent/resolve-intent.ts`, `src/game-domain/intent/index.ts`

**Verify:** `npm run test -- resolve-intent`

### T3: Define edge-function validation and reconciliation contract

**Do:** Specify request/response typing and reconciliation behavior (accepted event append vs rejected rollback path).

**Files:** `src/game-domain/network/submit-move-contract.ts`, `src/game-domain/network/reconcile.ts`

**Verify:** Manual: simulate accepted and rejected responses against fixture events

## Done

- [ ] `npm run lint` and intent tests pass
- [ ] Manual: rejected intents can be reconciled without corrupting local board state
- [ ] No regressions in event reconstruction flow

## Decisions Confirmed

- Optimistic UX policy: users cannot make illegal moves; dragged tile snaps to nearest legal highlighted move, otherwise snaps back to hand.
- Include idempotency keys in MVP move submission contract (Option A).
