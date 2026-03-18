# Draggable Hand Tile Interaction Cleanup

## Summary

- Fix the clipped lift-off and scroll-mode return bugs by moving the active dragged tile out of both clipped containers (`BoardArea` and the hand `ScrollView`) into a screen-level drag overlay.
- Make scrollable hands scroll-first by activating drag only on clear vertical intent; keep immediate drag for non-scrollable hands.
- Split the work into two independently shippable behavior tasks, plus focused regression coverage.

## Implementation Changes

### Task 1: Screen-Level Drag Overlay and Return Animation
- Add an absolute drag layer in [app/game/[id].tsx](/c:/Users/Brent/Projects/dominos-multiplayer/app/game/[id].tsx) above the board and hand, with `pointerEvents="none"`.
- Stop using [components/game/BoardArea.tsx](/c:/Users/Brent/Projects/dominos-multiplayer/components/game/BoardArea.tsx) to render the active dragged tile. `BoardArea` should keep static board rendering and snap highlight only.
- Expand the hand drag-start contract so [components/game/PlayerHand.tsx](/c:/Users/Brent/Projects/dominos-multiplayer/components/game/PlayerHand.tsx) and [components/game/DraggableHandTile.tsx](/c:/Users/Brent/Projects/dominos-multiplayer/components/game/DraggableHandTile.tsx) provide typed source-slot metrics for the tile being lifted.
- Use the measured source slot as both the overlay start position and the return target. Keep the in-hand tile hidden only while the overlay owns the visual.
- Drive the overlay from [src/game-domain/layout/useBoardInteraction.ts](/c:/Users/Brent/Projects/dominos-multiplayer/src/game-domain/layout/useBoardInteraction.ts):
  - Free drag follows the finger in screen space.
  - Snapped drag uses projected board geometry converted back into screen space from the current board camera transform.
  - Failed drops animate the overlay back to the measured hand slot before restoring the in-hand tile.
- This task alone fixes:
  - The tile being visible only once it reaches the board area.
  - The scroll-mode return animation disappearing until it re-enters the hand viewport.

### Task 2: Scrollable Hand Gesture Arbitration
- Only when `hand.length >= 8`, change [components/game/DraggableHandTile.tsx](/c:/Users/Brent/Projects/dominos-multiplayer/components/game/DraggableHandTile.tsx) to use manual pan activation with vertical-intent gating.
- Gesture rule:
  - Clear horizontal movement should fail the tile gesture quickly so the hand `ScrollView` scrolls.
  - Clear upward/vertical movement should activate drag.
  - Small ambiguous movement should do nothing until one intent wins.
- Keep immediate drag behavior for non-scrollable hands.
- Keep scroll enabled until drag actually activates; do not disable scroll on touch-down.
- Extract the intent decision into a pure helper so thresholds and dominance rules are explicit and testable.

### Task 3: Regression Coverage and Verification
- Add Jest coverage for the new pure gesture-intent helper.
- Add Jest coverage for any extracted board-to-screen drag projection helper used by the overlay.
- Reuse the existing `Force Hands` dev path to manually verify 8-tile scroll mode and rejected-drop return behavior.

## Important API / Type Changes

- `PlayerHand` and `DraggableHandTile` drag-start callbacks should change from `tileId` only to a typed payload that includes the tile id and its source screen-space rect.
- `BoardAreaProps` should drop active drag-preview ownership and only keep static board rendering plus snap/highlight inputs.
- Add small internal types such as `HandTileDragStart`, `ActiveHandDrag`, and a pure intent result like `"wait" | "activate_drag" | "yield_to_scroll"`.

## Test Plan

- Unit: vertical-intent helper activates drag on upward pulls, yields to scroll on horizontal swipes, and waits on micro-movements.
- Unit: overlay projection helper returns correct screen coordinates from board geometry across camera transforms.
- Manual: with a short hand, start dragging and confirm the tile stays continuously visible from hand into board space.
- Manual: with `Force Hands`, scroll to later tiles, attempt an illegal drop, and confirm the tile animates fully back without disappearing outside the hand viewport.
- Manual: with 8+ playable tiles, horizontal swipes on playable tiles scroll the hand; deliberate upward pulls start drag.

## Assumptions

- The chosen scroll-first interaction applies only to scrollable hands; non-scrollable hands keep direct drag.
- No new dependencies are needed; use the existing `react-native-gesture-handler` and `react-native-reanimated` stack.
- The current scroll-mode threshold of 8 tiles stays unchanged.
