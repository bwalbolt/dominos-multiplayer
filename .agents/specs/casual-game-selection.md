# Casual Game Selection

## Why

Users need a dedicated screen to configure and start a Casual Game after clicking the mode option from the Home screen. This screen lets them choose to play entirely offline against a computer or challenge an existing friend, expanding the core gameplay loop.

## What

Build the `Casual Game Selection` UI from Figma node `5:2052` in file `C4ZIO7dO9LwK158lzLUKCH`. This includes a header with a back button, a "Vs Computer" configuration section (offline mode, difficulty selection, play button), and a "Play a Friend" horizontal scrolling list of avatars that ends with an "Add New" button. The page should primarily focus on UI using dummy data matching the Figma texts exactly. Real functional links (other than the back button and the entry route) are not required at this time.

## Context

**Relevant files:**

- `app/(tabs)/home/_layout.tsx` — new stack layout specifically for the home tab.
- `app/(tabs)/home/index.tsx` — existing home screen (moved from `app/(tabs)/index.tsx`). Update the "Casual Game" `ModeButton` to route to the new casual selection screen.
- `app/(tabs)/home/casual.tsx` — new route for the casual game selection page. This structure ensures the `<BottomNav />` remains visible naturally.
- `app/welcome.tsx` — current onboarding screen; update its final navigation route.
- `app/theme/tokens.ts` — existing design tokens; extend this for any new colors, spacing, or shadows.
- `components/bottom-nav.tsx` — existing custom bottom navigation component.
- `components/mode-button.tsx` — existing UI component used on the `index.tsx` page.

**Patterns to follow:**

- Expo Router file-based routing with nested stacks inside tabs (e.g., `router.push('/home/casual')`).
- Token-first styling matching `app/theme/tokens.ts`.
- Use native `ScrollView` with `horizontal={true}` and `showsHorizontalScrollIndicator={false}` for the friends list.

**Key decisions already made:**

- The "Play a Friend" section should be horizontally scrollable.
- The friends list will end in an "Add New" button (which will eventually be used to make games via friend code).
- The page will be purely UI for now; no real backend wiring or data fetching.
- Use dummy data with text directly from the Figma design (e.g., "Lilly289", "Mike", "Alex", "JoeBob Chill", "Jessica", "Add New").
- The route is accessible by clicking the "Casual Game" ModeButton on the `index` (Home) page.
- Assets (icons, avatars) should be sourced from the Figma nodes and stored locally or mocked realistically.

## Constraints

**Must:**

- Match Figma node `5:2052` closely for layout, typography, backgrounds, and styling.
- Use tokens from `app/theme/tokens.ts` for styling.
- Ensure the header has a functional Back button.
- Make the "Play a Friend" section scrollable horizontally.

**Must not:**

- Implement real frontend-backend flow (e.g., Supabase integration or live buddy system).
- Hardcode inline styles containing colors or dimensions that should be tokens.

**Out of scope:**

- Actual game creation, lobbies, or matchmaking logic.
- Adding a real friend code input modal at this stage.

## Tasks

### T1: Set Up the Nested Stack Routing

**Do:** Refactor the current Home screen to exist inside a nested stack.

1. Move `app/(tabs)/index.tsx` to `app/(tabs)/home/index.tsx`.
2. Update `app/(tabs)/_layout.tsx` to reference the `<Tabs.Screen name="home" />` instead of `"index"`.
3. Create `app/(tabs)/home/_layout.tsx` with a basic `<Stack screenOptions={{ headerShown: false }} />`.
4. Create the new `app/(tabs)/home/casual.tsx` page.
5. In `app/(tabs)/home/index.tsx`, update the `ModeButton` for "Casual Game" to push to this new route (`router.push('/home/casual')`).
6. On the new `casual.tsx` page, build the top header containing the "Casual Game" title and the Back button (which should `router.back()`).
7. Update `app/welcome.tsx` to replace the "Start Playing" routing from `/(tabs)` to `/(tabs)/home`.

**Files:** `app/(tabs)/_layout.tsx`, `app/(tabs)/home/_layout.tsx`, `app/(tabs)/home/index.tsx`, `app/(tabs)/home/casual.tsx`, `app/welcome.tsx`

**Verify:** Manual: Tap "Casual Game" on the Home screen and ensure it transitions to the new page while keeping the bottom navigation visible. Tap the Back button on the header to ensure it returns to Home.

### T2: Build the "Vs Computer" Section

**Do:** Implement the "Vs Computer" section UI according to the Figma layout. Include the "Offline mode" badge, the 3 difficulty option buttons (Easy, Medium, Hard) within their specific responsive grid/flex container, and the primary "Play Computer" button underneath. Create a reusable component for the difficulty option if applicable. Use `app/theme/tokens.ts` to add any newly required shadows or theme colors.

**Files:** `app/(tabs)/home/casual.tsx`, `components/difficulty-button.tsx` (optional), `app/theme/tokens.ts`

**Verify:** UI visually matches the Figma design (node `5:2052`). `npm run lint` passes without errors.

### T3: Build the "Play a Friend" Scrolling Section

**Do:** Implement the "Play a Friend" area directly below "Vs Computer". Create a horizontally scrollable list containing simulated friend elements using dummy text from Figma ("Lilly289", "Mike", "Alex", "JoeBob Chill", "Jessica"). Append an "Add New" button item as the final element in the scroll view. Address the bottom area of the screen to accommodate either the global bottom nav or rendering the component manually if needed.

**Files:** `app/(tabs)/home/casual.tsx`

**Verify:** Manual: Check that the friends list easily scrolls horizontally. Ensure the screen layout matches the Figma node gracefully on typical mobile viewports.
