# Optimal Board Layout

## Why

Ignoring the codebase for a moment, let's start from scratch with a plan on how we could lay tiles on the board such that the most tiles can fit on the screen with as little need for zooming out as possible.

## What

Plan a system that can lay tiles on the board in a way that maximizes the number of tiles that can fit on the screen without overlapping. The system should insure no tiles overlap or go outside of the viewport. The system should also try to keep the tiles as close to the center of the screen as possible. There should always be an amount of space around the tiles that is equal to the width of one tile (accounting for the current size of tiles at the current zoom level). Each arm should prefer a counter-clockwise layout, but should be able to go clockwise if needed. Only the first double tile played will have four open ends, so we need to account for only a max of 4 arms, but there could also be layouts with no double tile at all, which will also need to be optimized. With only 28 tiles total in a double-six set, there are theoretically a finite number of optimal layouts. At the very least there are likely patterns that emerge that can be used to generate optimal layouts.

### Knowns

- The viewport is 402x560
- The tiles are 56x117 at 100% zoom
- Tiles can only be positioned in 4 directions (up, down, left, right) at 90 degree increments
- Tiles can only be laid such that their ends match (1-5 domino next to 5-6 domino for example)

## Screenshot Reference

**desired-layout.png**

- This screenshot shows a potential layout. Notice the blue rectangles at the open end of each arm. These show where the next tile could be placed but also represent the minimum ammount of space that should exist between an open end and the edge of the viewport.

**left 1 bend bottom 1 bend up 1 bend.png**

- This screenshot shows an optimzed layout with 4 arms with 3 of those arms having a bend.

**left 1 bend up 2 bends.png**

- This screenshot shows an optimzed layout also has 4 arms with 2 of those arms having a bend. Notice the up arm has a second bend.

**right arm 3 bends.png**

- This screenshot shows an optimzed layout with 4 arms with one arm having 3 bends. Notice how the 3rd bend in the right arm is necessary to avoid running into the up arm. Also notice that if play were to continue on the right arm, it would eventually overlap itself and need to be repositioned. At that point all bends would need to be reevaluated to find an optimal layout without overlaps.

## Constraints

**Must:**

- Re-center the chain of dominoes after each new tile is laid
- Position double tiles perpendicular to the arm they are played on and centered on the arm
- Match each tile end to end
- Bent tiles must connect the matching face to line up with the matched face of the previous tile

**Must not:**

- Position a tile such that it overlaps with any other tile
- Position a tile such that it goes outside of the viewport
- Position a tile such that there isn't room for a domino to slot between the chain and the edge of the viewport
- Zoom out more than necessary to fit all tiles on the screen
- Zoom in more than 100%

## Final Note

My hypothesis is that a counter clockwise pattern of "three tiles, bend, three tiles, bend, two tiles, bend" will get us most of the way there to optimzed for most layouts, but we should try to confirm that and set up a system that can best meet our needs.
