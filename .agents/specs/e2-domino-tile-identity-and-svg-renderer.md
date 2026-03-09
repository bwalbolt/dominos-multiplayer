# Domino Tile Identity & SVG Renderer

## Why

We need the production tile representation early so layout, snapping, and viewport logic are tested against realistic dimensions and orientation. Separating tile identity from visual style also unlocks future themes (pips, numerals, textures, 3D-ready adapters).

## What

Implement a reusable domino tile rendering contract and first SVG renderer, wired to domain tile identity without coupling mechanics to pips-only visuals.

## Context

**Relevant files:**

- `docs/user-interface-design.md` — current board composition and visual hierarchy constraints.
- `docs/product-requirements.md` — MVP polish expectations for core gameplay presentation.
- `theme/tokens.ts` — source of truth for sizing, spacing, radius, and color tokens.
- `theme/unistyles.ts` — theme registry constraints (colors only).
- `https://www.figma.com/design/C4ZIO7dO9LwK158lzLUKCH/Dominoes-Multiplayer?node-id=220-546` — source tile visual spec for the initial domino component.

**Patterns to follow:**

- Token-driven styling and `StyleSheet.create((theme) => ...)` usage.
- `react-native-svg` for tile visuals and effects.
- Renderer consumes typed tile data from domain layer.

**Key decisions already made:**

- SVG is the base tile rendering approach.
- Mechanics should identify tiles by canonical values/ids, not rendered glyph type.
- Future renderer variants (numerals/3D) should be adapters, not engine rewrites.

## Constraints

**Must:**

- Build the initial tile visuals from the referenced Figma node (`220:546`) including the bottom-edge rectangle behavior.
- Keep renderer API independent from rules engine internals.
- Ensure touch target can satisfy minimum 44pt requirements.
- Infer pip locations for non-3|5 tile values from the defined face rendering system.

**Must not:**

- Add external UI component libraries.
- Implement 3D rendering in MVP.

**Out of scope:**

- Drag/drop gesture system.
- Board-level placement logic.

## Tasks

### T1: Define tile presentation contracts

**Do:** Add typed presentation interfaces to map domain tile identity to renderable face glyphs (pips now, numerals later).

**Files:** `src/game-domain/presentation/tile-face.ts`, `src/game-domain/types.ts`, `src/game-domain/index.ts`

**Verify:** `npm run lint`

### T2: Build base SVG domino component from Figma tile design

**Do:** Create a shared `DominoTile` component from Figma node `220:546` that renders a tile body, center divider, two faces from adapter output, and a bottom-edge rectangle that always spans 100% tile width at the visual bottom regardless of orientation.

**Files:** `components/domino/domino-tile.tsx`, `components/domino/domino-tile.types.ts`, `theme/tokens.ts`

**Verify:** `npm run lint`

### T3: Add renderer variants and visual states

**Do:** Support orientation (horizontal/vertical), interaction state styles (idle/selected/ghost), and face renderer swap (pips/numeral placeholder).

**Files:** `components/domino/domino-tile.tsx`, `components/domino/face-renderers.tsx`, `components/domino/domino-tile.types.ts`

**Verify:** Manual: render sample tile states in a temporary screen and confirm no hardcoded non-token styles

## Done

- [ ] `npm run lint` passes
- [ ] Manual: same tile identity renders with at least two face strategies (pips + numeral placeholder)
- [ ] No regressions in existing screens/components

## Decisions Confirmed

- Use a flat tile look for the first shipped renderer (no extra material effects).
- Doubles will not receive a distinct visual treatment in MVP beyond standard rendering.
- Hardcoded visual constants are acceptable for this one-off tile renderer, while maintaining typed renderer contracts.
