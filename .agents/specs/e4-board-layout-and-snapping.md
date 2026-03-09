# Board Layout Geometry & Legal Snapping

## Why

Reliable drag-and-drop requires deterministic anchor geometry and placement rules independent from UI gestures. This prevents visual-only placement bugs and keeps client behavior aligned with server legality.

## What

Implement a pure board-layout engine that computes legal anchors, projected tile placements, branch paths (including spinner behavior), and snap targets for move intents.

## Context

**Relevant files:**

- `.agents/specs/e2-domino-tile-identity-and-svg-renderer.md` — tile dimensions and orientation contract used for geometry.
- `.agents/specs/e3-fives-rules-and-reconstruction.md` — legality/scoring constraints feeding anchor validity.
- `docs/product-requirements.md` — board supports right-angle chain layout.
- `docs/user-interface-design.md` — board center composition and move animation expectations.

**Patterns to follow:**

- Geometry outputs as plain data (`x`, `y`, `rotationDeg`, `anchorId`).
- Deterministic branch direction rules for spinner and turns.
- Layout logic separate from touch handling and rendering.

**Key decisions already made:**

- Layout must support nearest legal snap feedback.
- Spinner and branch expansion are required mechanics.
- Board should stay readable and as zoomed-in as possible within viewport constraints.

## Constraints

**Must:**

- Keep all geometry calculations pure and reproducible.
- Expose stable anchor identifiers for client intent + server payload consistency.
- Handle collision/overlap checks during projection.

**Must not:**

- Depend on React state/hooks in layout modules.
- Encode animation timing in geometry engine.

**Out of scope:**

- Camera transform interpolation (except constraints passed to viewport policy).
- Final gesture UI wiring.

## Tasks

### T1: Implement anchor and placement geometry primitives

**Do:** Build models and helpers to compute legal anchors and projected placements per board state + tile dimensions.

**Files:** `src/game-domain/layout/types.ts`, `src/game-domain/layout/anchors.ts`, `src/game-domain/layout/project-placement.ts`

**Verify:** `npm run test -- layout-anchors`

### T2: Implement spinner branch layout rules

**Do:** Encode deterministic branch unlock sequence and directional growth for spinner-based play.

**Files:** `src/game-domain/layout/spinner.ts`, `src/game-domain/layout/anchors.ts`

**Verify:** `npm run test -- spinner-branches`

### T3: Implement snap target resolution

**Do:** Given drag endpoint and legal anchors, resolve nearest valid target with thresholding and tie-break rules.

**Files:** `src/game-domain/layout/snap.ts`, `src/game-domain/layout/types.ts`

**Verify:** `npm run test -- snap-resolution`


### T4: Add drag-target highlight contract

**Do:** Define geometry metadata for active-drop highlighting so UI can show a blue focus glow on the anchor domino being chained off; nearest highlighted legal target determines snap destination and removes ambiguous-equal-distance behavior.

**Files:** `src/game-domain/layout/types.ts`, `src/game-domain/layout/snap.ts`

**Verify:** `npm run test -- snap-resolution`

## Done

- [ ] `npm run test` passes for layout suites
- [ ] Manual: sample placements return stable anchor IDs across repeated runs
- [ ] No regressions in rules reconstruction outputs

## Decisions Confirmed

- Auto-rotate policy is confirmed: the engine always auto-rotates snapped placements (no manual rotate control in MVP).
- Ambiguous-drop tie handling is resolved by explicit user drag feedback: highlight the targeted legal chain anchor with blue focus glow and snap to that highlighted target.
- Minimum readable tile size floor is 56px x 117px, enforced by viewport constraints (implemented in e5).
