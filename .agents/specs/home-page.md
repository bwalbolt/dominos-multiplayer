# Play Home Screen

## Why

After the initial user setup on the welcome screen, the app needs a primary hub where users can view active games, start new ones, and navigate throughout the application. This establishes the first authenticated screen, introduces the persistent bottom navigation, and serves as the main landing page for returning users.

## What

Build the `Play Home Screen` UI from Figma node `5:1865` in file `C4ZIO7dO9LwK158lzLUKCH`. This includes the header (user info, tokens, settings button), the "Active Games" list, the "Get Started" game mode grid, and the persistent `Nav` bottom navigation component. At this stage, implement only the visual design using mocked values that match the Figma texts exactly. No backend functionality or real data wiring is required at this time.

## Context

**Relevant files:**

- `app/welcome.tsx` — current onboarding screen; its "Start Playing" button must be updated to route to the new home screen.
- `app/(tabs)/_layout.tsx` — new Expo Router tab layout to manage the bottom navigation and sub-screens.
- `app/(tabs)/index.tsx` — the main home screen route.
- `app/theme/tokens.ts` — existing design tokens; extend this for new colors, spacing, and typography instead of hardcoding.
- `components/bottom-nav.tsx` — new component for the custom bottom navigation matching the Figma `Nav` node.
- `components/game-card.tsx` — new reusable component for the "Active Games" list items.
- `components/mode-button.tsx` — new reusable component for the "Get Started" grid items.

**Patterns to follow:**

- Expo Router file-based routing, matching the `(tabs)` conventions for bottom navigation.
- Token-first styling, matching `app/theme/tokens.ts`.
- Component composition for repeated UI elements (game cards, mode buttons).

**Key decisions already made:**

- The page will be purely UI for now; no real data fetching or state management.
- Use mocked values with text directly from the Figma design (e.g., "Sarah M.", "Computer (Easy)").
- The custom bottom navigation (`Nav` component) should be built to match Figma instead of relying on default OS tab bars.
- Assets (icons, avatars) should be sourced from the Figma nodes and stored locally.

## Constraints

**Must:**

- Match Figma node `5:1865` closely for layout, typography, gradients, and colors.
- Use tokens from `app/theme/tokens.ts` for styling; add missing ones as needed.
- Implement a custom bottom tab bar component and integrate it with Expo Router's `<Tabs>`.
- Wrap the main home screen in a scrollable area (or `ScrollView`) to support smaller devices.
- Route from the `welcome.tsx` screen to the new home screen when "Start Playing" is tapped.

**Must not:**

- Add Tailwind or other styling systems; use Unistyles/StyleSheet.
- Wire up real Supabase queries or backend logic.
- Hardcode colors, spacing, or typography values inline if they can be added to tokens.

**Out of scope:**

- Implementing the content for other tabs (Friends, Leaderboard, Profile)—empty placeholders are fine.
- Interactive UX flows beyond basic button routing and styling.

## Tasks

### T1: Build the Custom Bottom Navigation and Tabs Layout

**Do:** Create the `components/bottom-nav.tsx` component matching the Figma `Nav` node (`9:3139`). Implement an Expo Router `<Tabs>` layout in `app/(tabs)/_layout.tsx` that uses this custom `tabBar`. Define an empty placeholder route for the `index.tsx` home page. Update `app/welcome.tsx` to route to `/(tabs)` instead of its current stub.

**Files:** `components/bottom-nav.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/welcome.tsx`

**Verify:** Manual: Tap "Start Playing" on the welcome screen and confirm it transitions to a new screen showing the custom bottom navigation.

### T2: Create Reusable UI Components

**Do:** Build `components/game-card.tsx` for the "Active Games" list items and `components/mode-button.tsx` for the "Get Started" grid. Ensure they accept props for titles, subtitles, avatars, icons, and values securely. Update `app/theme/tokens.ts` to include any missing design tokens (colors, font styles, drop shadows) required by Figma node `5:1865`.

**Files:** `components/game-card.tsx`, `components/mode-button.tsx`, `app/theme/tokens.ts`

**Verify:** `npm run lint`

### T3: Assemble the Home Screen UI

**Do:** Implement the main layout in `app/(tabs)/index.tsx`. Build the header section displaying the user avatar, name ("Clicky McClickerson"), level ("Lvl. 12"), and coin balance ("4,250"). Use the new reusable components to populate the "Active Games" and "Get Started" sections with the exact mocked data from the Figma design. Ensure appropriate Safe Area padding.

**Files:** `app/(tabs)/index.tsx`

**Verify:** Manual: Launch the app, navigate to the home screen, and verify the layout visually matches Figma node `5:1865` exactly, including all mocked text, spacing, and the custom bottom navigation.

## Done

- [ ] `npm run lint` passes
- [ ] Manual: Tapping "Start Playing" on Welcome properly navigates to the Home screen
- [ ] Manual: Home screen visually matches Figma node `5:1865` in layout, typography, and spacing on iPhone-sized viewports
- [ ] Manual: Custom bottom navigation is visible, matches Figma design, and persists on the screen
- [ ] Manual: Reusable components correctly render mocked data matching the Figma text
