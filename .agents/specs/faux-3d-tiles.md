# Skia Faux-3D Tile Rendering Plan

## Summary
- Replace the current SVG-based tile presentation with a Skia-backed faux-3D tile renderer, while keeping the existing board layout logic, drag targeting, and event-sourced game rules unchanged.
- Use a stylized 2.5D material model instead of true 3D. That should address the current snap/layout jank more directly, especially the shadow instability, while staying much easier to customize for cosmetics, colors, textures, and future tile-specific effects.
- Keep Reanimated as the animation driver. Skia should render the tile body, bevel/depth, shadow, highlight, and cosmetic layers from shared animated pose values so drag, snap, settle, and board re-layout all use the same visual model.

## Key Changes
- Introduce a GPU-backed tile renderer with a small material system:
  - `TileAppearance` for face color, edge/bevel treatment, divider/pip styling, optional texture/accent layers, and selection/highlight variants.
  - `TilePose` for animated translation, rotation, scale, elevation, shadow parameters, and optional tilt/flip progress.
- Replace the current path-based faux depth and shifting shadow treatment with a single consistent rendered tile stack:
  - face
  - bevel/edge
  - divider/pips
  - shadow/elevation
  - overlay states such as selection, legal-slot highlight, and cosmetic effects
- Unify all tile visuals under that renderer:
  - board tiles
  - drag overlay tile
  - snap preview tile
  - projected/open-slot highlight shell
  This prevents phase-to-phase style mismatches that currently show up during snap and layout transitions.
- Treat drag, snap preview, settle animation, and board placement as phase changes of one renderer, not separate visual implementations. The tile may change pose ownership between subsystems, but it must not switch to a different appearance, shadow, bevel, or highlight implementation during those handoffs.
- Standardize animation handoff so the same pose/shadow model is used for:
  - free drag
  - hard snap
  - settle into slot
  - board re-layout
  That should eliminate the "shadow shifting around" effect caused by separate render paths behaving differently.
- Add a visual continuity rule for all handoffs:
  - pose ownership may move between the hand overlay and board scene
  - appearance ownership must remain with the shared tile renderer
  - shadows, bevel depth, highlight thickness, and texture treatment must remain visually stable across drag -> snap -> settle -> layout
- Build future-readiness into the renderer:
  - flip animation should be supported as a first-class pose/effect
  - roll/tilt should be supported as a bounded stylized motion, not true rigid-body physics
  - cosmetic skins should be data-driven so new materials do not require new tile component trees

## API / Type Changes
- Add a renderer-facing appearance type such as `TileAppearance` or `TileMaterial` with token-driven color inputs and optional texture/accent descriptors.
- Add a shared `TilePose` contract consumed by board, drag, preview, and settle phases so all tile states render consistently, regardless of whether pose values originate from screen-space drag or board-space layout animation.
- Refactor `DominoTile` into either:
  - a thin facade over the new renderer with the existing semantic props preserved, or
  - a Skia-native replacement component with equivalent game-facing props plus optional `appearance`/`pose`
- Add a shared renderer adapter/facade early in the migration so both overlay and board code paths call the same tile-rendering surface, even before the SVG implementation is fully removed.
- Keep the current game-domain and layout interfaces stable. This is a presentation-layer migration, not a rules or board-geometry rewrite.

## Migration Plan
- Phase 1: Build a Skia tile that matches the current default tile look in its idle state, including outline and selected/highlight styling.
- Phase 2: Introduce the shared renderer facade and route drag overlay, snap preview, and settle rendering through it first, since that is where the visible jank is most noticeable.
- Phase 3: Migrate board tiles and re-layout transitions to the same renderer and pose system.
- Phase 4: Add one small proof-of-future-capability effect, preferably a face flip, to validate the renderer choice before expanding cosmetics further.
- Keep the current SVG tile path available behind a temporary compatibility flag until parity and performance are confirmed.

## Test Plan
- Visual parity checks for the default tile skin across idle, selected, playable highlight, drag, snap preview, and board placement states.
- Transition checks for drag -> snap -> settle -> board re-layout with specific attention to shadow/elevation continuity.
- Explicit acceptance scenario: no visible style jump when transitioning from active drag -> hard snap -> settle hold -> board layout animation.
- Performance validation on device with a dense board and repeated placements; success criteria is equal or better perceived smoothness than the current renderer during snap and layout transitions.
- Cosmetic coverage tests for color variants, optional texture layers, and facedown/alternate tile states.
- Future-readiness acceptance checks:
  - a basic flip prototype
  - a simple roll/tilt prototype
  Both must be implemented using the same appearance/pose system rather than one-off animation code.

## Assumptions
- The preferred direction is faux-3D, not a true 3D scene graph. Full 3D would add more complexity than the problem justifies and would make cosmetics-first iteration harder.
- Native performance is the main target; web parity can be treated as secondary during the initial migration if needed.
- This plan requires explicit approval before adding a new dependency for Skia, per the repo rules.
- Existing board logic, move validation, anchor resolution, and layout math remain unchanged unless a presentation issue exposes a specific geometry bug.
