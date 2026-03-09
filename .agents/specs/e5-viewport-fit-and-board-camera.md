# Viewport Fit Policy & Board Camera Model

## Why

As the chain grows, board readability and visibility can degrade quickly without a deterministic fit policy. A predictable camera model is required to keep all tiles visible while minimizing disruptive zoom/pan jumps.

## What

Create a viewport policy that derives board bounds and computes a stable camera transform (`scale`, `translateX`, `translateY`) from layout snapshots.

## Context

**Relevant files:**

- `.agents/specs/e4-board-layout-and-snapping.md` — provides tile placement geometry and bounds inputs.
- `docs/user-interface-design.md` — establishes board as primary visual focus and move animation expectations.
- `theme/tokens.ts` — source for viewport paddings and safe margins.

**Patterns to follow:**

- Pure transform calculations from deterministic layout inputs.
- Hysteresis to reduce camera jitter.
- UI layer only animates between precomputed transform states.

**Key decisions already made:**

- Entire board should remain visible when possible.
- Preserve maximum practical zoom for readability.
- Avoid frequent micro-zoom adjustments.

## Constraints

**Must:**

- Compute transform solely from layout bounds + viewport dimensions + tokenized padding.
- Include optional focus target for latest move emphasis.
- Keep transform outputs platform-neutral.

**Must not:**

- Depend on runtime gesture libs or animation libraries in policy functions.

**Out of scope:**

- Gesture-driven manual pan/zoom overrides.
- Reanimated implementation details.

## Tasks

### T1: Add board-bounds and fit transform calculators

**Do:** Implement board bounds aggregation and fit-to-viewport transform solver, including a minimum on-screen domino size floor of 56px x 117px by clamping zoom-out behavior.

**Files:** `src/game-domain/layout/viewport.ts`, `src/game-domain/layout/types.ts`

**Verify:** `npm run test -- viewport-fit`

### T2: Add camera stability policy

**Do:** Implement hysteresis thresholds and transform smoothing constraints to prevent jitter between similar states.

**Files:** `src/game-domain/layout/viewport-policy.ts`, `src/game-domain/layout/viewport.ts`

**Verify:** `npm run test -- viewport-hysteresis`

### T3: Expose focus-target metadata

**Do:** Extend layout/viewport outputs with semantic focus hints for last move and turn-change transitions.

**Files:** `src/game-domain/layout/types.ts`, `src/game-domain/layout/viewport-policy.ts`

**Verify:** Manual: inspect debug output for expected focus target after sample move sequence

## Done

- [ ] `npm run test` passes for viewport suites
- [ ] Manual: transform changes remain stable for minor board updates
- [ ] No regressions in anchor/layout calculations

## Decisions Confirmed

- Full-board fit is confirmed as the top priority (no temporary latest-move override in MVP).
- Use viewport-driven, device-agnostic camera logic rather than per-device-class presets.
- Magic numbers are acceptable for board-camera constraints where needed (separate from main UI spacing system).
