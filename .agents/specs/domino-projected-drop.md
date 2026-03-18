# Closest Legal Auto-Play After Hand Escape

## Summary
- Preserve the current hard-snap behavior inside the existing 100px board-space snap radius.
- Add a second drop-resolution path that activates only when the dragged tile body has moved upward by `spacing[80]` from its source position.
- Once that threshold is active, releasing a playable tile submits to the nearest legal anchor even if it is not within snap radius.
- Show a blue animated open-slot outline for that resolved target so the user can see where release will play.

## Implementation Changes
- Update `useBoardInteraction` so drag start captures the tile’s source screen rect, then compute three states on every update: `snapAnchor` (existing hard snap), `hasClearedHandThreshold` (tile top has moved up by `spacing[80]`), and `dropTargetAnchor` (use `snapAnchor` first; otherwise nearest legal anchor with no distance cap only when the threshold is cleared).
- Keep snap and projection visually distinct: `snapAnchor` continues to drive the existing snapped preview tile and hide the floating drag overlay; projected-only targets drive release selection and highlight, but the dragged tile keeps following the finger.
- Change drag-end resolution to submit the move for `dropTargetAnchor` instead of only `snapAnchor`, so a release beyond the threshold plays to the highlighted legal end.
- Replace the current small circular board highlight with a domino-sized blue stroke outline that uses the same animated `AnimatedRect` style as the selected domino tile.
- Reuse layout geometry for the slot outline by exposing a small helper that converts a `LayoutAnchor` into its full open-slot rect/orientation, including the empty-board opening anchor.
- Keep all new values token-driven: use `spacing[80]`, `theme.colors.blue`, and `domino.borderRadius`; do not introduce hardcoded spacing or colors.

## API / Type Changes
- Change `useBoardInteraction.onDragStart` to accept drag-origin metrics, not just `tileId`.
- Change `useBoardInteraction` output to expose separate `snapAnchor` and `dropTargetAnchor` values, plus a small projected-mode boolean if needed by the screen.
- Add a reusable domino-outline primitive or shared helper so `DominoTile` and the board slot highlight use the exact same animated stroke treatment.

## Test Plan
- Unit test target resolution for: hard snap still winning inside 100px; no target before threshold when outside snap radius; nearest legal anchor resolving after threshold; deterministic switching between multiple legal anchors; clearing the threshold again when dragged back down.
- Add geometry tests for the anchor-to-slot helper across `left`, `right`, `up`, `down`, and the empty-board initial anchor.
- Update drag visual tests so projected-only mode keeps the floating tile under the finger, while hard snap mode still uses the snapped board preview.
- Manually verify: direct snap still works; projected highlight appears only after the tile body clears 80px; highlight switches to the nearest legal end as you drag; release beyond threshold plays there; release below threshold returns to hand.

## Assumptions
- The 80px rule is based on the tile body’s current position relative to its source rect, not the finger position.
- The threshold is not sticky: if the tile is dragged back below it, the projected highlight clears and release returns to hand unless a hard snap is active.
- In projected-only mode, the UI shows the slot outline but not a full snapped tile preview; full preview remains reserved for true hard snaps.
