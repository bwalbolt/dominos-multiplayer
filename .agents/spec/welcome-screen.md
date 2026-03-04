# Welcome Screen

## Why

The app currently opens to the Expo placeholder, so the first-run experience does not match the product or UI requirements. The MVP needs a polished welcome/profile-setup screen that matches the Figma onboarding design and establishes the first real route users see on initial launch.

## What

Build the initial `/welcome` screen from Figma node `5:1613` in file `C4ZIO7dO9LwK158lzLUKCH`, then make app launch land on that screen instead of the Expo stub. Done means the screen visually matches the provided design on iPhone-sized layouts, supports avatar selection and display-name entry states, and exposes a clear primary CTA without adding unrelated onboarding flow or backend persistence.

## Context

**Relevant files:**

- `app/index.tsx` - current entry route; should stop rendering the Expo placeholder and instead hand off to the welcome screen route.
- `app/_layout.tsx` - Expo Router stack root; use it to define welcome-screen navigation behavior and header visibility.
- `app/theme/tokens.ts` - existing color and typography tokens extracted from the same Figma file; extend this instead of hardcoding styling values.
- `docs/product-requirements.md` - onboarding requires preset avatar selection and display-name entry before play.
- `docs/software-requirements-specification.md` - route design expects `/welcome`; styling must stay token-driven and avoid Tailwind.
- `docs/user-interface-design.md` - onboarding is a single-column centered layout with avatar grid, display-name input, and primary CTA.

**Patterns to follow:**

- Expo Router file-based routes, matching [`app/_layout.tsx`](/C:/Users/Brent/Projects/dominos-multiplayer/app/_layout.tsx).
- Token-first styling, matching [`app/theme/tokens.ts`](/C:/Users/Brent/Projects/dominos-multiplayer/app/theme/tokens.ts).
- Figma-first implementation using the provided node structure: 24px horizontal gutters, 4x4 avatar grid, 56px input, 52px pill CTA, gradient background/button treatment.

**Key decisions already made:**

- Initial launch should resolve to `/welcome`, not render onboarding inline at `/`.
- Scope is the welcome/profile-setup screen UI only; onboarding submission, anonymous auth creation, and profile persistence stay separate.
- Use assets sourced from the Figma node for the domino mark, avatar art, and input/button icons; do not introduce a new icon set for design-matching assets.
- All spacing, typography, colors, radii, borders, and shadows must come from tokens or token extensions, not inline hardcoded values.

## Constraints

**Must:**

- Match Figma node `5:1613` closely for layout, typography, gradients, and state treatment.
- Use Expo Router routes and React Native primitives aligned with this repo.
- Keep styling token-driven and ready for React Native Unistyles adoption; if Unistyles is still absent, add only the minimum setup required by this screen.
- Support safe-area top spacing and a scrollable layout if smaller devices need it.
- Represent the selected avatar visually, including the highlighted border/shadow state shown in Figma.
- Include display-name input affordances shown in design: leading user icon, placeholder/value styling, helper copy, and success/check state treatment.

**Must not:**

- Add Tailwind, NativeWind, or other styling systems.
- Introduce unrelated app structure, home screen work, or backend onboarding completion.
- Refactor unrelated files beyond what is needed to route into and render the welcome screen.

**Out of scope:**

- Supabase anonymous auth creation and profile-row writes.
- Terms of Service screen/content implementation beyond making the text/link render.
- Validation rules beyond local UI behavior needed for the designed happy path.
- Navigation after tapping `Start Playing` beyond a temporary stub or TODO-safe handoff.

## Tasks

### T1: Route the app into a real welcome screen

**Do:** Create a dedicated `app/welcome.tsx` route for the first-run screen, update `app/index.tsx` to redirect into `/welcome`, and configure [`app/_layout.tsx`](/C:/Users/Brent/Projects/dominos-multiplayer/app/_layout.tsx) so the screen renders without a default header. If needed, add the minimal styling/runtime setup required to support token-driven screen styling cleanly.

**Files:** `app/index.tsx`, `app/_layout.tsx`, `app/welcome.tsx`

**Verify:** `npm run lint`

### T2: Implement the Figma-matched welcome UI shell

**Do:** Build the background, header, domino mark, welcome copy, avatar-grid section, display-name field, CTA, and footer copy to match the Figma frame. Extend `app/theme/tokens.ts` with any missing semantic tokens for gradients, spacing, radii, borders, shadows, and form text styles instead of hardcoding screen-specific values.

**Files:** `app/welcome.tsx`, `app/theme/tokens.ts`

**Verify:** Manual: launch the app and confirm the screen visually matches the Figma screenshot on an iPhone-sized simulator, including 24px page gutters, 16px section gaps, 4-column avatar grid, and pill CTA sizing.

### T3: Add welcome-screen interaction state and assets

**Do:** Add local state for selected avatar and display name, wire the selected-tile visual treatment, render the check-state input suffix, and add the Figma-provided visual assets in a durable local location so the screen does not depend on expiring MCP asset URLs. Keep the CTA enabled/disabled behavior aligned with the chosen local validation rule and document any temporary submission stub inline.

**Files:** `app/welcome.tsx`, `assets/images/...`

**Verify:** Manual: tap different avatars and confirm only one selected state is visible; edit the display name and confirm the field and CTA states respond as designed.

## Done

- [ ] `npm run lint` passes
- [ ] Manual: app launch opens the welcome screen instead of the Expo placeholder
- [ ] Manual: welcome screen matches Figma node `5:1613` in layout, typography, spacing, and gradients on iPhone-sized viewports
- [ ] Manual: avatar selection, display-name entry, and CTA affordances all render and respond without runtime errors
- [ ] No regressions to router startup behavior or token usage in the current app shell
