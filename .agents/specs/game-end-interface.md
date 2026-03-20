# Game End Transition Overlay + Figma End Screen

## Summary

Replace the current completed-game modal in [`app/game/[id].tsx`](/c:/Users/Brent/Projects/dominos-multiplayer/app/game/%5Bid%5D.tsx) with a hybrid end-state flow that stays on the game route for the transition, while rendering the final UI through a reusable end-screen component.

This should remain in-route, not a true route change. That keeps the shared headline/banner animation physically continuous without introducing a shared-element library. The final screen UI should still be implemented as a reusable component so it can be mounted elsewhere later if needed.

## Implementation Changes

- In [`app/game/[id].tsx`](/c:/Users/Brent/Projects/dominos-multiplayer/app/game/%5Bid%5D.tsx), replace the `"Game Resolution Overlay"` modal with a phase-driven full-screen overlay:
  - phases: `intro`, `hold`, `reveal`, `idle`
  - trigger: `!isScoreBurstPending && game.status === "completed"`
  - while active: disable gameplay interaction, hide dev affordances, and fade the board/hand/header beneath the overlay

- Build a reusable game-end presentation module for:
  - hero layer: animated headline + banner
  - screen layer: background gradient, score rows, XP section, sticky footer actions
  - reveal phase: the screen layer fades in while the hero elements move/scale into their final Figma positions

- Hero animation spec:
  - `victory`
    - text `"Victory!"`
    - starts at `translateY +50`, `scale 0.8`, `opacity 0`
    - animates to final centered position at `175` from top
    - overshoots to `scale 1.2`, then settles at `1`
    - banner uses [`victory-banner.png`](/c:/Users/Brent/Projects/dominos-multiplayer/assets/images/victory-banner.png), centered at `74` from top, from `translateY +100`, `scale 0.7`, `opacity 0`
  - `defeat`
    - text `"Defeat"`
    - starts above final position with `scale 0.9`, `opacity 0`
    - slower drop-in, no bounce
    - banner uses [`defeat-banner.png`](/c:/Users/Brent/Projects/dominos-multiplayer/assets/images/defeat-banner.png), same under-slide behavior
  - timing
    - victory headline about `550ms`
    - defeat headline about `700ms`
    - banner overlaps the end of the headline animation
    - hold after isolated hero intro: about `300ms`
    - reveal into full screen: about `400ms`
  - reduced motion: replace bounce/drop choreography with a short fade/settle

- Render the hero headline with `react-native-svg` so the styling is exact:
  - `typography.headline1`
  - fill `colors.iron`
  - `6px` white stroke
  - shadow offset `4,4`, blur `4`, color `colors.shadow`

- Final end-screen content:
  - use live match result for outcome and final scores
  - use dummy data for XP/profile metadata for now
  - order score rows **player first**, opponent second, regardless of outcome
  - keep the Figma layout/styling, but apply the row-order override above

- Footer actions:
  - `Add Friend`
    - placeholder only, no side effects yet
    - use uploaded icon [`User_Add.svg`](/c:/Users/Brent/Projects/dominos-multiplayer/assets/images/icons/User_Add.svg)
  - `Rematch`
    - use uploaded icon [`Redo.svg`](/c:/Users/Brent/Projects/dominos-multiplayer/assets/images/icons/Redo.svg)
    - replace the current in-place replay with `router.replace()` to a fresh local game route id while preserving opponent context
    - example shape: `/game/local-${Date.now()}?opponentName=...`
  - `Back to Home`
    - `router.replace("/(tabs)/home")`

- Reuse and extend [`components/Button.tsx`](/c:/Users/Brent/Projects/dominos-multiplayer/components/Button.tsx):
  - add compact sizing for the Figma footer buttons
  - add explicit custom-icon support for end-screen actions
  - keep styling token-driven and aligned with existing button variants

## Public Interfaces / Types

- Add a typed presentation model, for example:
  - `MatchOutcome = "victory" | "defeat"`
  - `GameEndPresentation`
    - `outcome`
    - `headline`
    - `bannerSource`
    - `scoreRows`
    - `xp`
    - `actions`
- Add a pure mapper from `GameState` to `GameEndPresentation`
- Extend `Button` props for compact size and explicit icon source/rendering

## Test Plan

- Jest
  - mapper returns correct `victory`/`defeat` headline and banner
  - score rows are player-first and use final live scores
  - rematch route builder creates a fresh local id and preserves opponent context
- Manual verification
  - victory intro, hold, reveal
  - defeat intro, hold, reveal
  - hero elements visually morph into final end-screen positions
  - Add Friend and Rematch show the uploaded icons
  - rematch starts a different local match instead of replaying the same seed
  - Back to Home exits the completed game route
  - reduced-motion path avoids bounce-heavy animation
  - safe-area layout holds on common iPhone sizes

## Assumptions

- Scope remains the completed-game flow only; round-resolution UI is unchanged.
- The Figma node `341:255` remains the visual source of truth for this screen, with the explicit override that score rows are player-first.
- Existing local `.png` banner assets are used unless you provide replacements later.
