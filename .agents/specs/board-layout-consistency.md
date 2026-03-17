# Board Layout Consistency

## Goal

Capture a separate follow-up for the board layout solver that favors layouts with more consistent orientation and fewer bends, while preserving the existing readability-first work in `close-arms-fix`.

This task is intentionally separate from close-arms readability. Close-arms is about rejecting ambiguous connectivity. This task is about preferring cleaner, more stable board shapes when the readability requirement is already satisfied.

## Problem

The solver currently optimizes primarily for:

1. `fitScale`
2. `compactness`
3. `bendCount`
4. `rightTurnCount`
5. `leftTurnCount`

That means the solver already avoids extra bends as a late tie-break, but it does not explicitly optimize for broader layout consistency. In practice, it can still choose a layout that:

- rotates the board more than necessary
- introduces a bend when a nearly-as-good straighter layout exists
- changes the visual character of the board for a very small zoom gain

Those layouts can still be technically correct and readable, but they may feel less intentional and harder to scan than a simpler shape.

## Scope

This spec should cover two things:

1. Add developer-facing zoom and layout-score diagnostics so zoom trade-offs can be judged from real boards.
2. Add a consistency-scoring path that can prefer straighter, less-rotated layouts when the zoom cost is negligible.

This spec should not decide the final allowed zoom trade yet. That threshold is not known yet and should be informed by the new dev-mode readout.

## Non-Goals

This note does not propose:

- changing domino rules
- changing anchor legality
- changing overlap or open-slot reservation rules
- changing close-arms readability rejection behavior
- introducing manual board rotation controls or gesture zoom

## Proposed Approach

Treat consistency as a separate scoring layer after readability and fit quality, with an adjustable zoom-tolerance gate.

### Phase 1: Instrumentation First

Add a small board-layout diagnostics section to the existing developer tools area on the game screen.

The diagnostics should print:

- current `fitScale`
- current `camera.scale`
- `compactness`
- `bendCount`
- `rightTurnCount`
- `leftTurnCount`
- a new `rotationChangeCount` or equivalent consistency metric if added

The zoom readout should be easy to compare across seeds and forced-hand setups. Show the raw decimal value and a percentage form, for example:

- `fitScale: 0.9342`
- `zoom: 93.4%`

Use the already-derived board layout data from `useBoardCamera()` rather than recomputing a second debug-only layout.

### Phase 2: Consistency Scoring

Add an explicit consistency metric to the layout score so the solver can distinguish between:

- equally readable layouts with similar zoom
- one layout that stays straighter or keeps the board orientation more stable
- another layout that adds bends or rotates more for only a tiny zoom gain

The new metric should cover at least:

- fewer bends
- less board-level rotation from the preferred baseline orientation

If useful, this can remain split into multiple score fields instead of one combined scalar, as long as the ordering is deterministic.

## Candidate Metrics

The exact formula does not need to be finalized yet, but the score model should support these concepts explicitly:

- `bendCount`: total bends across all arms
- `rightTurnCount`
- `leftTurnCount`
- `rootRotationPenalty` or `boardRotationPenalty`: penalize layouts that rotate the overall board away from the preferred baseline when that rotation is not buying meaningful fit

Preferred baseline orientation:

- keep the current root orientation preference unless there is a measurable fit or readability benefit from rotating
- do not rotate simply because it produces a marginally more compact shape

Important: this is not trying to eliminate all bends or all rotations. It is trying to avoid unnecessary ones.

## Zoom Tolerance Policy

Do not hard-code a final non-zero zoom tolerance yet.

Instead:

- introduce a dedicated constant for this policy, such as `CONSISTENCY_ZOOM_TOLERANCE`
- default it to `0` for the first implementation pass
- structure score comparison so this constant can later be increased without redesigning the score model

Behavior with the default value of `0`:

- consistency can break true ties
- consistency cannot beat a layout with materially better `fitScale`

Behavior after a future threshold is chosen:

- if two layouts are both readable and their `fitScale` difference is less than or equal to the configured tolerance, prefer the more consistent layout

This keeps the first pass safe while allowing real-device observation to determine what "just a little bit of zoom" should mean.

## Lexicographic Placement

The intended comparison order for this task should become:

1. Minimize `clarityViolation` if the close-arms rule exists in the solver by then
2. Maximize `fitScale`, except where the fit-scale delta is within `CONSISTENCY_ZOOM_TOLERANCE`
3. Minimize `boardRotationPenalty`
4. Minimize `bendCount`
5. Minimize `rightTurnCount`
6. Prefer more `leftTurnCount` if a handedness tie-break is still desired
7. Minimize `compactness`

Notes:

- `compactness` should move below consistency in this task. A slightly more spread-out but clearer and straighter board is preferable if the zoom cost is negligible.

## Developer Tools Requirement

Extend the existing game-screen developer tools tray instead of creating a new debug screen.

The board diagnostics section should:

- sit alongside the current reset/seed buttons
- update live as the board changes
- show enough precision to compare small zoom deltas between candidate seeds
- be safe to leave behind for future board-layout debugging

Preferred source data:

- `layout.fitScale`
- `layout.camera.scale`
- `layout.score`

Relevant current entry point:

- `app/game/[id].tsx`

Relevant current solver files:

- `src/game-domain/layout/anchors.ts`
- `src/game-domain/layout/types.ts`
- `src/game-domain/layout/useBoardCamera.ts`

## Validation Ideas

Add tests for cases where:

- two layouts have equal readable fit and one has fewer bends
- two layouts have equal readable fit and one avoids extra board rotation
- one layout has slightly better fit but worse consistency, and with tolerance `0` the solver still keeps the better-fit layout
- one layout has slightly better fit but worse consistency, and after raising the tolerance constant in a targeted test the solver prefers the more consistent layout

Also confirm that:

- current overlap and open-slot reservation tests still pass
- close-arms readability behavior is unchanged
- existing portrait wrapping cases still bend when the fit difference is truly meaningful
- the dev tools zoom readout matches the actual `layout.camera.scale`

## Implementation Notes

Prefer an incremental rollout inside this task:

1. Extend `LayoutScore` with the new consistency field(s).
2. Surface `layout.score` and zoom values in the developer tools tray.
3. Refactor score comparison helpers so fit-vs-consistency tolerance is explicit.
4. Keep the tolerance constant at `0` until manual observation justifies a non-zero value.

This makes the first implementation useful immediately without prematurely locking the zoom trade policy.
