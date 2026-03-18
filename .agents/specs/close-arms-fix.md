# Close Arms Fix

## Goal

Capture a follow-up for the layout solver that treats visually ambiguous arm adjacency as unacceptable, even when the geometry is technically non-overlapping.

## Problem

The exact solver now avoids overlap and preserves open-slot space, but it can still choose layouts where two unrelated arms pass very close to each other.

Those cases are technically legal, but some are visually ambiguous enough that the board becomes hard to read. A player can read two nearby tiles as if they belong to the same local connection, especially when:

- a bent arm passes near another arm at a similar height
- a double bends near an unrelated branch
- two arms create a narrow corridor that still satisfies the no-overlap rule
- unrelated arm ends nearly touch, making the connection path unclear at a glance

## Proposed Approach

Split this into two tiers:

1. A hard visual-clarity check that rejects layouts where unrelated geometry is too close to read confidently.
2. A softer clearance preference that still improves breathing room among the remaining valid layouts.

The hard clarity rule should:

- never allow an illegal overlap
- reject layouts where a reasonable player could misread which dominoes are connected
- be allowed to reduce `fitScale` if that is the only way to preserve clear connectivity

The soft preference should:

- apply only after the hard clarity rule passes
- improve readability between otherwise clear layouts
- avoid unnecessary crowding when multiple layouts have similar fit quality

## Candidate Evaluation Model

Introduce two measures over unrelated geometry:

- `clarityViolation`
- `proximityPenalty`

`clarityViolation` should capture cases where unrelated geometry is close enough to create connection ambiguity. If `clarityViolation > 0`, the layout should be rejected.

`proximityPenalty` should capture suboptimal but still readable crowding among layouts that already pass the clarity check.

Relevant pairings:

- tile-to-tile pairs that are not directly adjacent in the same chain
- tile-to-open-slot pairs for unrelated arms
- open-slot-to-open-slot pairs if useful

One possible approach for `clarityViolation`:

1. Expand each rect by a small visual comfort radius.
2. Use a stricter radius for connection-facing edges or arm endpoints.
3. Reject any layout where unrelated expanded geometry intrudes beyond the allowed amount.

One possible approach for `proximityPenalty`:

1. Measure the shortest edge-to-edge distance between unrelated rects.
2. Penalize any distance below a preferred threshold.

## Suggested Thresholds

Use a stricter threshold for ambiguity rejection and a smaller one for soft crowding preference.

Possible starting values:

- hard clarity threshold: `12` to `20`
- soft proximity threshold: `8` to `12`

The hard threshold can justify extra zoom if needed. The soft threshold should stay well below a full domino width so we preserve packing efficiency.

## Lexicographic Placement

If added, the score order should likely become:

1. Minimize `clarityViolation`
2. Maximize `fitScale`
3. Minimize `proximityPenalty`
4. Minimize `compactness`
5. Minimize `bendCount`
6. Prefer fewer right turns
7. Prefer more left turns

This makes board readability more important than raw packing density whenever the two are in conflict.

## Important Constraint

Do not treat every close approach as a failure.

The hard rule is specifically about preventing ambiguous connectivity, not enforcing generous whitespace everywhere.

A blanket buffer would still be too aggressive because it could:

- force unnecessary zoom-out
- block otherwise optimal late-game layouts
- make four-arm boards harder to fit in portrait

The intended behavior is narrower:

- reject layouts that are hard to parse
- accept dense layouts that are still visually unambiguous
- use soft spacing preference only inside that readable set

## Validation Ideas

When this is implemented later, add cases that compare two legal layouts with identical fit scale where:

- one layout has unrelated arms nearly touching
- the other layout has slightly more breathing room

The solver should choose the second layout.

Also add cases where:

- the highest-scale layout has ambiguous near-touching unrelated arms
- a slightly smaller-scale layout keeps the connections visually obvious

The solver should choose the smaller but clearer layout.

Also confirm that:

- existing fit-scale regression tests still pass
- bend regressions still pass
- no new overlaps are introduced
- the solver does not prefer looser layouts if the denser layout is still clearly readable

## Non-Goals

This note does not propose:

- changing domino rules
- changing anchor legality
- changing open-slot reservation rules
- changing the exact-search structure

It is a presentation-level readability rule for visual clarity, plus an optional tie-break improvement inside the readable set.
