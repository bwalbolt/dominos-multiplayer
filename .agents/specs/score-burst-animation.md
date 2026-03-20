# Score Burst + Header Count-Up Animation

## Summary
Add a single high-performance score-feedback sequence for positive `TILE_PLAYED` scoring only. When either player scores from a domino play, show a centered burst at `50% x / 30% y` of the screen, run the 2.0s burst effect there, then send the score text in an arc to the scoring side of the board header over 350ms, and finish with a 150ms header count-up. Gameplay, AI follow-up, and round-resolution overlays stay paused until the full 2.5s sequence completes.

## Key Changes
- Update [components/game/BoardHeader.tsx](/c:/Users/Brent/Projects/dominos-multiplayer/components/game/BoardHeader.tsx):
  - accept displayed score values separately from authoritative scores
  - expose measured rect callbacks for each score value (`player`, `opponent`) using `measureInWindow` with `collapsable={false}` wrappers
  - keep only the scoring side animated; non-scoring side remains static
- Add a new score-feedback overlay component, rendered from [app/game/[id].tsx](/c:/Users/Brent/Projects/dominos-multiplayer/app/game/[id].tsx):
  - detect score bursts by diffing previous vs current reconstructed scores when the latest event is `TILE_PLAYED` and delta `> 0`
  - ignore `ROUND_ENDED` scoring so this feature only reflects “points from playing a domino”
  - queue bursts FIFO, though normal play should only surface one at a time
  - gate player interaction, draw/pass CTA, opponent AI timeout, and round-resolution overlay while a burst is active
  - keep the header display frozen at the pre-score total until the burst reaches the header

## Animation / Rendering Spec
- Render the burst in a full-screen, `pointerEvents="none"` overlay using `react-native-svg` plus Reanimated shared values.
- Use existing color tokens only: `colors.blurple`, `colors.purple`, `colors.pink`, `colors.white`, and `colors.shadow`.
- Hardcode the requested animation values inside the component:
  - text size `50`
  - text stroke `1`
  - text shadow `dx=4`, `dy=4`, blur `4`
  - circle diameter `200`
  - ring stroke `3`
  - total duration `2500ms`
- Burst phase: `0ms` to `2000ms`
  - score text uses `typography.scoreText` as the base style, overridden to size `50`
  - gradient fill left-to-right `blurple -> purple at 50% -> pink`
  - `1px` white stroke and shadow using `colors.shadow`
  - text motion: opacity `0 -> 1`, scale `0.4 -> 1.06 -> 0.98 -> 1` with a spring-like overshoot
  - white circle behind text expands from scale `0` to diameter `200`; at `60%` progress it starts cutting out from the center until it becomes a `3px` ring; fade the ring near the end
- Travel phase: `2000ms` to `2350ms`
  - move the same score text along a quadratic Bezier arc from burst origin to the measured target score rect center in the header
  - shrink scale to `0.1` and fade opacity to `0` by arrival
- Header phase: `2350ms` to `2500ms`
  - animate the target header score numerically from previous total to new total
  - drive with a Reanimated shared value and only bridge to React state when the displayed integer changes
  - add a small scale pulse on the target score during the count-up

## State / Flow Changes
- In the game screen, introduce transient UI state for:
  - active burst payload: actor id, delta, from score, to score, target rect
  - queued bursts
  - displayed header scores separate from authoritative reconstructed scores
  - `isScoreBurstActive` gate used by interaction enablement, AI autoplay effect, and round-resolution overlay rendering
- For scoring moves that also end the round:
  - run the full burst first
  - show the existing round-resolution overlay only after the burst finishes
- For non-scoring moves:
  - no burst
  - existing gameplay flow stays unchanged

## Test Plan
- Add unit tests for the pure helpers that:
  - detect a valid score burst only from positive `TILE_PLAYED` deltas
  - ignore non-scoring plays and `ROUND_ENDED` score changes
  - choose the correct header target by scoring player id
  - compute the ring progression and arc interpolation deterministically
- Manual verification:
  - player scores on a normal move: burst appears at `30%` screen height, travels to player score, header counts up
  - opponent scores on a normal move: same behavior to opponent score
  - scoring move that ends the round: burst finishes before round overlay appears
  - during burst, player cannot act and AI does not start its next move
  - non-scoring move shows no burst and no delay

## Assumptions
- Burst origin is fixed at horizontal center and `30%` from the top of the screen.
- The sequence pauses gameplay until completion.
- The feature applies only to immediate in-round scoring from domino plays, not round-end award text.
- Reuse color tokens, but other animation constants may be hardcoded in the new score-burst implementation.
