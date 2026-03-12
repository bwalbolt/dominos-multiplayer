# Computer Player

## Why

The casual flow already exposes "Play Computer", but the current implementation only opens a local board with a generic opponent and no automated turn-taking. Adding a deterministic computer opponent completes the MVP solo loop described in the product docs and lets players finish full matches offline.

## What

Implement a local/offline computer-player flow that starts from the Casual Game screen and creates a game against one of three named bot profiles: `Computer (Easy)`, `Computer (Medium)`, or `Computer (Hard)`. In v1, all three difficulties use the same move-selection logic and avatar `@/assets/images/avatar(9).png`. When it is the computer's turn, it should automatically take legal game actions and obey all Fives rules: if any playable move scores, choose the move that yields the highest immediate score; otherwise choose the playable move whose tile has the lowest total pip value. Completion means a user can start a local computer game from the casual screen and watch the bot play out its turns without manual intervention.

## Context

**Relevant files:**

- `app/(tabs)/home/casual.tsx` - existing difficulty selector and current "Play Computer" entry point.
- `app/game/[id].tsx` - current local game screen, move append flow, round progression, and draw/pass handling.
- `src/game-domain/local-session.ts` - local game bootstrap and player profile creation for offline sessions.
- `src/game-domain/local-session-store.ts` - Zustand store holding the local event log and reconstruction state.
- `src/game-domain/variants/fives/legal-moves.ts` - authoritative legal move generation for playable bot options.
- `src/game-domain/variants/fives/scoring.ts` - deterministic scoring rules that should be reused when ranking candidate bot moves.
- `src/game-domain/variants/fives/round-resolution.ts` - round end detection that bot turns must continue to respect.
- `src/game-domain/__tests__/` - existing domain test location for deterministic rules coverage.

**Patterns to follow:**

- Keep computer decision-making inside pure deterministic domain helpers, similar to the existing rules modules in `src/game-domain/variants/fives`.
- Continue using the local event-log session flow (`GAME_STARTED`, `ROUND_STARTED`, `TILE_PLAYED`, `TILE_DRAWN`, `TURN_PASSED`) instead of mutating board state directly.
- Use Expo Router route params from `app/(tabs)/home/casual.tsx` to pass local setup context into `app/game/[id].tsx` instead of introducing a new persistence layer.

**Key decisions already made:**

- This feature is for the current local/offline implementation, not Supabase-backed multiplayer.
- Difficulty selection affects bot label only in v1; strategy is identical for Easy, Medium, and Hard.
- All computer profiles use `avatar(9).png`.
- Bot turns are automatic; the user should not press a second CTA to make the computer act.
- The bot should prefer maximum immediate score first, then lowest pip total among non-scoring playable moves.

## Constraints

**Must:**

- Preserve the event-sourced local game architecture and derive all state from appended events.
- Keep bot move selection deterministic and pure so it can be unit tested.
- Reuse existing legal-move and scoring utilities instead of duplicating Fives rules in the UI layer.
- Ensure the computer also handles blocked turns correctly by drawing from the boneyard or passing when the boneyard is empty.
- Start games with the selected bot name visible in the existing board header/opponent UI.

**Must not:**

- Add new npm packages.
- Introduce `any` types in new bot-related code.
- Refactor unrelated board-screen UI or multiplayer architecture.
- Implement different strategic behavior per difficulty in this spec.

**Out of scope:**

- Supabase AI game creation, realtime sync, or server-side bot execution.
- Animation polish beyond whatever is required to make the automated turn understandable.
- Advanced AI strategy such as lookahead, inference, or difficulty tuning.

## Tasks

### T1: Add deterministic computer-player domain policy

**Do:** Create a pure domain module for choosing the computer's next action from reconstructed round state. It should evaluate legal moves using the existing Fives move generator, compute immediate score outcomes for candidate plays, break ties deterministically, and return one of: play tile, draw tile, or pass turn. Add Jest coverage for opening moves, scoring preference, lowest-pip fallback, draw behavior, and pass behavior when blocked with an empty boneyard.

**Files:** `src/game-domain/computer-player.ts` (new), `src/game-domain/index.ts`, test files under `src/game-domain/__tests__` or `src/game-domain/variants/fives/__tests__`

**Verify:** `npm test -- computer-player`

### T2: Thread bot configuration through local session bootstrap

**Do:** Extend the local game bootstrap so `createLocalGameSession` can accept local opponent metadata for the selected computer difficulty and emit the correct opponent display name while preserving deterministic dealing. Add typed route/setup plumbing from `app/(tabs)/home/casual.tsx` into the game route so selecting Easy, Medium, or Hard creates the matching bot profile and still launches a local game.

**Files:** `app/(tabs)/home/casual.tsx`, `app/game/[id].tsx`, `src/game-domain/local-session.ts`, `src/game-domain/local-session-store.ts`, related shared types if needed

**Verify:** Manual: Select each difficulty from Casual Game, tap `Play Computer`, and confirm the board header shows `Computer (Easy)`, `Computer (Medium)`, or `Computer (Hard)` with avatar `avatar(9).png`.

### T3: Execute automatic computer turns in the local game loop

**Do:** Integrate the computer-player policy into the local board screen/session flow so that when `p2` is active, the app automatically appends the correct event sequence for the bot action. This includes playing the selected tile, drawing when no legal move exists but tiles remain in the boneyard, re-evaluating after a draw, and passing only when blocked with an empty boneyard. Ensure round-end and game-end overlays still resolve correctly after bot actions.

**Files:** `app/game/[id].tsx`, optional extracted helpers under `src/game-domain/` for event drafting, local store files if sequencing is cleaner there

**Verify:** Manual: Start a computer game, make a player move, and observe the opponent automatically respond without user input. Manual: Reach a blocked turn and confirm the bot draws or passes according to the rules.

### T4: Clean up board presentation and regression coverage for computer matches

**Do:** Update the board route and any opponent presentation components so the selected computer name and fixed avatar render consistently in the top header and opponent hand area. Add focused regression coverage for local event-sequence application if new helper functions are introduced for automated turns.

**Files:** `app/game/[id].tsx`, `components/game/BoardHeader.tsx`, `components/game/OpponentHand.tsx`, related tests if needed

**Verify:** `npm run lint` and Manual: Play through at least one full round versus the computer and confirm no illegal bot move, no stuck turn, and no mismatch between displayed opponent identity and selected difficulty.

## Done

- [ ] `npm run lint` passes
- [ ] `npm test -- computer-player` passes
- [ ] Manual: From Casual Game, each difficulty launches a local game against the correctly named computer using `avatar(9).png`
- [ ] Manual: On the computer's turn, the bot automatically plays the highest immediate scoring move when available
- [ ] Manual: If no scoring move exists, the bot chooses a legal move using the lowest pip-total tile
- [ ] Manual: When blocked, the bot draws from the boneyard or passes only when the boneyard is empty
- [ ] No regressions in local round resolution, scoring, or game-end flow
