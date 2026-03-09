# Match Policy Layer for Casual MVP and Future Modes

## Why

Rules for Fives gameplay should not be tangled with mode lifecycle policies (turn deadlines, forfeits, ranked timers). A dedicated policy layer lets us ship casual MVP cleanly while preparing for ranked and multiplayer expansion.

## What

Add a pluggable match-policy interface with an MVP casual async policy (3-day expiration) and placeholders for ranked timer behavior without implementing ranked gameplay.

## Context

**Relevant files:**

- `docs/product-requirements.md` — MVP vs post-MVP boundaries (casual now, ranked/4-player later).
- `docs/software-requirements-specification.md` — expiration and forfeiture server behavior.
- `.agents/specs/e3-fives-rules-and-reconstruction.md` — gameplay variant logic that should stay policy-agnostic.

**Patterns to follow:**

- Policy interfaces separated from variant rule modules.
- Explicit deadline and terminal-state handlers.
- Server-enforceable policy outcomes represented as events.

**Key decisions already made:**

- MVP casual expiration is `last_move_at + 3 days`.
- Ranked turn timer is future scope but should have architectural hooks.
- Forfeits are terminal events in immutable event log.

## Constraints

**Must:**

- Implement only casual policy behavior for MVP execution.
- Keep ranked support as non-functional scaffold/interfaces.
- Ensure policy outputs are deterministic from explicit timestamps.

**Must not:**

- Implement full ranked queue/match flow.
- Add background schedulers outside current architecture.

**Out of scope:**

- 4-player turn-order policy.
- Notification delivery implementation.

## Tasks

### T1: Define policy interfaces and lifecycle hooks

**Do:** Add interfaces for deadline computation, timeout outcomes, and policy-specific metadata.

**Files:** `src/game-domain/match-policies/types.ts`, `src/game-domain/index.ts`

**Verify:** `npm run lint`

### T2: Implement casual async policy

**Do:** Implement 3-day expiration and forfeit outcome logic from explicit timestamps.

**Files:** `src/game-domain/match-policies/casual-async-policy.ts`, `src/game-domain/match-policies/index.ts`

**Verify:** `npm run test -- casual-policy`

### T3: Add ranked policy scaffold (non-functional)

**Do:** Add ranked interface implementation stubs and typed TODO guards for future 60-second timer semantics.

**Files:** `src/game-domain/match-policies/ranked-realtime-policy.ts`, `src/game-domain/match-policies/index.ts`

**Verify:** `npm run lint`

## Done

- [ ] `npm run test -- casual-policy` passes
- [ ] Manual: casual expiration edge cases produce deterministic outcomes
- [ ] No regression in Fives rules module boundaries

## Open Questions

- Should expiration enforcement occur only on read/write touchpoints (per SRS) or also via scheduled cleanup jobs later?
- Do we want grace-period semantics after deadline for push-delay tolerance?
