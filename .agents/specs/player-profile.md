# Player Profile Specification

## Why

Users need a dedicated screen to view their current profile statistics, level progress, and recent match history. This page will temporarily act as the "More" tab, providing a sense of progression and identity within the game using realistic placeholder data.

## What

Build the `Player Profile` UI from Figma node `5:1209` in file `C4ZIO7dO9LwK158lzLUKCH`. This includes a header with a "Profile" title, a main profile card (avatar, level badge, name "Clicky McClickerson", title "Novice", and XP progress bar), a stats row ("Total Wins" and "Win Rate"), a "Recent Matches" list, and the global bottom navigation. The page should focus purely on UI using dummy data matching the Figma texts exactly. Real functional links (other than basic routing) are not required at this time.

## Context

**Relevant files:**

- `app/(tabs)/more.tsx` — existing placeholder for the "more" tab. Update this file to contain the profile UI.
- `app/theme/tokens.ts` — existing design tokens; extend this for any new colors, spacing, or shadows.
- `components/bottom-nav.tsx` — global bottom navigation component.

**Patterns to follow:**

- Expo Router UI flow for tabs.
- Token-first styling matching `app/theme/tokens.ts`.
- Use native layout components (`View`, `Text`, `ScrollView` for main vertical scrolling constraint, etc.).

**Key decisions already made:**

- The "More" tab route (`more.tsx`) will house this Profile page for now.
- The page will be purely UI for now; no real backend wiring or data fetching.
- Use dummy data with text directly from the Figma design (e.g., "Level 12", "Clicky McClickerson", "Novice", "1,250 / 2,000", "Total Wins 48", "Win Rate 62%").
- Assets (icons, avatars) should be sourced from the Figma nodes and stored locally or mocked realistically.

## Constraints

**Must:**

- Match Figma node `5:1209` closely for layout, typography, backgrounds, and styling.
- Use tokens from `app/theme/tokens.ts` for styling.
- Ensure the header has a consistent style with "Profile" as the title.
- Make the screen vertically scrollable.

**Must not:**

- Implement real frontend-backend flow (e.g., Supabase integration or live match history).
- Hardcode inline styles containing colors or dimensions that should be mapped to tokens.

## Tasks

### T1: Build the Main Profile Header and Info Card

**Do:** Update `app/(tabs)/more.tsx` to include the standard screen layout with a vertical `ScrollView`. Implement the Header containing the "Profile" title (omit the back button for this MVP since it is acting as the root "more" page). Create the main info card containing the Avatar, Level Badge (Level 12), Name (Clicky McClickerson), Title (Novice), and the Experience Progress bar (1,250 / 2,000). Use `app/theme/tokens.ts` for backgrounds, typography, and precise border radiuses.

**Files:** `app/(tabs)/more.tsx`, `components/profile-card.tsx` (optional), `app/theme/tokens.ts`

**Verify:** UI visually matches the top portion of the Figma design (node `5:1209`). `npm run lint` passes without errors.

### T2: Build the Stats Row

**Do:** Implement the "Total Wins" and "Win Rate" cards below the main info card. Include the stat numbers (48, 62%) and the extra badges ("+3" with arrow, and the background vector graphics). Use the provided SVG assets in `assets/images/` and `assets/images/icons/` for the background graphics.

**Files:** `app/(tabs)/more.tsx`, `components/stat-card.tsx` (optional)

**Verify:** Manual: Check that the stats row aligns side-by-side cleanly and handles basic responsive constraints gracefully.

### T3: Build the Recent Matches Section

**Do:** Implement the "Recent Matches" list below the stats row. Include the section header ("Recent Matches", "View all") and build reusable match list items. Use dummy data from Figma ("vs. Computer (Easy)", "vs. JohnDoe"). Include the subtle icons, XP rewards ("+24 XP", "+5 XP"), and score comparisons. Use the provided SVG assets in `assets/images/icons/` for the background graphics.

**Files:** `app/(tabs)/more.tsx`, `components/recent-match-item.tsx` (optional)

**Verify:** Manual: Check that the list items match the padding and typography in Figma. Ensure the screen is vertically scrollable past the bottom navigation.
