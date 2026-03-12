# E9 Board Screen Vertical Slice (Local/Offline First)

## Why

The project needs a playable board-screen slice to validate core Fives gameplay UX and visual direction before backend wiring. Shipping this vertical slice now de-risks the game loop by proving board rendering, interactions, and round flow on-device.

## What

Implement a concrete Expo Router gameplay route at `app/game/[id].tsx` that matches the Figma board direction and supports a full local playable loop using deterministic engine outputs only. Completion means a single device can run a round from first move to round transition with no Supabase dependency in T1–T2.

Figma reference: `https://www.figma.com/design/C4ZIO7dO9LwK158lzLUKCH/Dominoes-Multiplayer?node-id=217-172`

## Context

**Relevant files:**

- `app/(tabs)/home/casual.tsx` — existing casual entry point; likely launch surface for local game route.
- `app/_layout.tsx` — root router layout where non-tab game route integration will be added.
- `app/theme/tokens.ts` — token source for spacing, typography, radii, and semantic aliases.
- `docs/user-interface-design.md` — board screen zone structure and gameplay UI expectations.
- `docs/software-requirements-specification.md` — deterministic/event-sourced architecture and validation constraints.

**Patterns to follow:**

- Expo Router file-based screens for new route creation.
- Token-first styling via Unistyles + `tokens.ts`; no hardcoded visual constants.
- Deterministic game-state derivation from engine/event-log outputs, not ad-hoc mutable UI state.

**Key decisions already made:**

- This vertical slice is **local/offline first** for early gameplay validation.
- **No Supabase integration for T1–T2** (no queries, no edge calls, no realtime).
- Server-authoritative flow remains future architecture, but local deterministic validation must mirror that shape.

## Constraints

**Must:**

- Target route: `app/game/[id].tsx` (or equivalent Expo Router dynamic game route if repository conventions require grouping).
- Use the Figma reference above for board background/layout composition.
- Render: player hand, opponent hand placeholder, boneyard, scores, and turn status.
- Wire drag/snap/highlight UI interactions to engine-provided legal moves/endpoints.
- Provide local-only session controls: start round, force hands, reset seed.
- Keep logic deterministic and testable; avoid `any`.

**Must not:**

- Add Supabase dependencies or networking logic in T1–T2.
- Introduce Tailwind/NativeWind or hardcoded color/spacing/typography/radius values.
- Refactor unrelated app navigation or non-game screens.

**Out of scope:**

- Multiplayer sync, persistence, friend turn handoff, expiration, or push/realtime.
- Ranked mode, 4-player mode, chat, economy, or post-match social flows.

## Tasks

### T1: Scaffold offline board route + static Figma-aligned layout shell

**Do:** Create `app/game/[id].tsx` and required local UI components to reproduce the board-screen structure from Figma (top status zone, center board area, bottom hand/action zone). Build only static shell and placeholders (no drag yet). Ensure navigation can enter this route from casual setup/debug path (for now wire to "Play Computer" button).

**Files:** `app/game/[id].tsx`, `app/_layout.tsx`, `app/(tabs)/home/casual.tsx`, game UI component files as needed, `app/theme/tokens.ts` (token additions only if required)

**Verify:** Manual: Open the game route and confirm visual zones/labels align with Figma reference and use tokenized styling.

### T2: Render local deterministic game state primitives

**Do:** Connect the board route to local deterministic game session state and render player hand, opponent hand placeholder/count, boneyard count, both scores, and explicit turn status. Seed with a local session factory so repeated seeds produce identical initial deals.

**Files:** `app/game/[id].tsx`, local game-session store/module files, shared game state types

**Verify:** `npm run lint` and Manual: Reload with same seed and confirm identical initial hands/turn metadata.

### T3: Drag/snap/highlight move interactions wired to engine outputs

**Do:** Implement tile drag interactions with snap-to-legal-endpoint behavior and highlight legal placements based on engine-derived move options. On drop, reject illegal placements and commit legal moves through local event append/replay flow. Resize domino on drop to match board space.

**Files:** board interaction components/hooks, local event-log reducer/replay utilities, `app/game/[id].tsx`

**Verify:** Manual: Attempt illegal drop (must reject/return), then legal drop (must snap, append event, and update board/turn).

### T4: Local session controls + round progression loop

**Do:** Add developer-facing local controls on the board screen for: Start Round, Force Hands (deterministic test setup), and Reset Seed. Support blocked-turn draw flow from boneyard, score updates from played/drawn actions, round-end detection, and next-round start within same local session.

**Files:** `app/game/[id].tsx`, local game session controller/store, scoring/round utilities, optional test files for deterministic round transitions

**Verify:** Manual playable loop (single device):

1. Place a legal tile.
2. Draw from boneyard when blocked.
3. Observe score updates.
4. Reach round end and start next round.

## Done

- [ ] `npm run lint` passes.
- [ ] Manual: Board screen visually matches Figma direction for node `217:172` structure and hierarchy.
- [ ] Manual: Player hand, opponent placeholder, boneyard, scores, and turn status all render from local deterministic state.
- [ ] Manual: Drag/snap/highlight behavior follows legal-move outputs; illegal drops are blocked.
- [ ] Manual (single-device playable loop): legal play → blocked draw → score update → round end → next round start.
- [ ] Confirmed: T1–T2 use **local/offline only**, with **no Supabase dependency**.
