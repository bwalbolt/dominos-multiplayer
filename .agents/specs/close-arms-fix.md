# Close Arms Fix

## Goal

Capture a possible follow-up for the layout solver that reduces visually confusing near-misses between unrelated arms without changing the current hard constraints.

## Problem

The exact solver now avoids overlap and preserves open-slot space, but it can still choose layouts where two unrelated arms pass very close to each other.

Those cases are technically legal, but visually ambiguous. A player can read two nearby tiles as if they belong to the same local connection, especially when:

- a bent arm passes near another arm at a similar height
- a double bends near an unrelated branch
- two arms create a narrow corridor that still satisfies the no-overlap rule

## Proposed Approach

Add a soft-clearance preference to scoring rather than a hard spacing rule.

The preference should:

- never allow an illegal overlap
- never reduce fit scale in favor of extra spacing
- only break ties between otherwise-valid layouts

## Candidate Scoring Term

Introduce a `proximityPenalty` term computed from the minimum separation between unrelated geometry:

- tile-to-tile pairs that are not directly adjacent in the same chain
- tile-to-open-slot pairs for unrelated arms
- open-slot-to-open-slot pairs if useful

One possible approach:

1. Expand each rect by a small visual comfort radius.
2. Measure how much those expanded rects intrude into each other.
3. Sum that intrusion as a soft penalty.

Alternative:

1. Measure the shortest edge-to-edge distance between unrelated rects.
2. Penalize any distance below a preferred threshold.

## Suggested Threshold

Start with a small board-space threshold, likely in the range of:

- `8`
- `12`
- `16`

This should stay well below a full domino width so we preserve packing efficiency.

## Lexicographic Placement

If added, the score order should likely become:

1. Maximize `fitScale`
2. Minimize `proximityPenalty`
3. Minimize `compactness`
4. Minimize `bendCount`
5. Prefer fewer right turns
6. Prefer more left turns

This keeps the new preference subordinate to fit quality but stronger than pure centering.

## Important Constraint

This should remain a soft preference only.

Do not convert it into a hard collision buffer unless testing proves that the visual ambiguity is severe enough to justify reduced packing density.

A hard buffer could:

- force unnecessary zoom-out
- block otherwise optimal late-game layouts
- make four-arm boards harder to fit in portrait

## Validation Ideas

When this is implemented later, add cases that compare two legal layouts with identical fit scale where:

- one layout has unrelated arms nearly touching
- the other layout has slightly more breathing room

The solver should choose the second layout.

Also confirm that:

- existing fit-scale regression tests still pass
- bend regressions still pass
- no new overlaps are introduced
- the solver does not prefer looser layouts if they require more zoom-out

## Non-Goals

This note does not propose:

- changing domino rules
- changing anchor legality
- changing open-slot reservation rules
- changing the exact-search structure

It is only a possible tie-break improvement for visual clarity.
