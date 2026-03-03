# Dominoes Multiplayer — User Interface Design Document (MVP)

Tone: Neutral / Modern Strategy  
Design Direction: Modern Minimal Strategy  
Platform: iOS (React Native + Expo)  
Typography: Alpino (Display), SF Pro (Body)  
Design System: All UI must use established Figma design tokens and shared components. No hard-coded values.

---

# Layout Structure

## Global App Structure

### Primary Navigation (Persistent Bottom Nav)

- Home
- Story (Coming Soon)
- Quests (Coming Soon)
- More (Profile in MVP)

Bottom navigation is hidden during active gameplay.

---

## Screen Hierarchy

### 1. Onboarding

Single-column centered layout:

- Avatar selection grid
- Display name input
- Primary CTA button

---

### 2. Home

Vertical scroll layout divided into sections:

1. Header Bar
   - Avatar (left)
   - Display name + Level (stacked)
   - Currency/XP summary (right)

2. Active Games Section
   - Section title
   - Game cards (stacked)
   - Disabled state if opponent turn

3. Get Started Section
   - 2x2 feature grid:
     - Casual Game
     - Ranked (Coming Soon badge if locked)
     - Daily Bonus (Coming Soon)
     - Shop (Coming Soon)

All spacing must use system spacing tokens.

---

### 3. Casual Game Setup

Centered vertical stack:

- Play vs Computer (difficulty selector inline)
- Play vs Friend (12-digit segmented input)
- Primary CTA button

---

### 4. Game Board

Structured in 3 vertical zones:

Top Bar:

- Opponent avatar
- Opponent name
- Score display
- Expiration countdown (if async)

Center:

- Domino chain
- Must always remain within viewport
- Supports right-angle wrapping

Bottom:

- Player hand
- Clear turn indicator
- Subtle action affordances

Bottom navigation hidden.

---

### 5. End Game

Centered result layout:

- Winner display (Alpino)
- Final score
- XP earned
- Rematch (Primary CTA)
- Add as Friend (Secondary CTA)
- Return Home (Tertiary)

---

### 6. Profile

Top gradient header section:

- Avatar (centered)
- Level badge
- Display name (Alpino)
- Rank tier (future-ready)
- XP progress bar

Scrollable body:

- Stat cards (Wins, Win Rate)
- Recent Matches list
- Friend code (copy button)

---

# Core Components

All components must use established Figma tokens and shared components.

## System Components

- Button (Primary / Secondary / Disabled)
- Card (Elevated / Flat)
- Stat Card
- Game Card
- Avatar (preset only)
- XP Progress Bar
- Segmented Input (friend code)
- Countdown Timer
- Bottom Navigation
- Modal (Accept / Deny request)
- Toast (Copy success, errors)

---

## Game-Specific Components

- Domino Tile (interactive / disabled / highlighted)
- Domino Chain Renderer (responsive layout logic)
- Turn Indicator Badge
- Score Display Component
- Expiration Countdown Pill

Domino tiles must:

- Enforce legal moves via UI
- Clearly show playable state
- Provide subtle scale or glow on valid drop

---

# Interaction Patterns

## Async Gameplay

- When reopening app:
  - Opponent’s last move animates from event log
- Move confirmation:
  - Subtle placement animation
  - Immediate state persistence
- After move:
  - “Next Game” quick-switch CTA appears if available

---

## Friend Code Entry

- 12-digit segmented input
- Auto-advance between segments
- Paste auto-distributes digits
- Validation before submission

---

## Expiration

- Visible countdown on game card and board
- Color transitions as deadline approaches
- Expired → locked state → forfeit result screen

---

## Turn Clarity

- Clear top-bar highlight
- Subtle pulse/glow on player hand when it’s their turn
- Disabled interaction when waiting

---

## Ranked Scalability

Structure must allow:

- Turn timer (60s)
- Rank badge display in header
- Match history filtering (Casual vs Ranked)

---

# Visual Design Elements & Color Scheme

## Overall Tone

Neutral, modern, strategy-focused.  
Minimal decorative noise.  
Domino tiles are the visual hero.

---

## Backgrounds

- Light neutral surfaces (token-based)
- Subtle gradient reserved for Profile header only
- Cards elevated via shadow tokens

---

## Color System

Use design tokens only.

Expected structure:

- Primary Accent (CTAs)
- Success (win states, XP gains)
- Danger (loss states, expiration warning)
- Neutral scale (backgrounds, borders)

No hard-coded hex values.

---

## Elevation & Depth

- Soft shadow tokens for cards
- Domino tiles slightly elevated
- Minimal skeuomorphism

---

# Mobile, Web App, Desktop Considerations

## iOS (Primary MVP)

- Safe-area compliant
- Thumb-zone optimized
- Large tap targets (minimum 44pt)
- Native gestures respected

---

## Future Android

- Maintain token system
- Typography shifts to native Android sans-serif
- Ensure density scales appropriately

---

## Future Web

- Centered layout with max-width constraint
- Board scales responsively
- Hover states added (desktop only)
- Keyboard input for friend code

---

# Typography

## Display Typography

Font: Alpino

Used for:

- Display name
- Section headers
- End game results
- Large score emphasis

Weight hierarchy defined via token scale.

---

## Body Typography

Font:

- SF Pro (iOS native)
- Platform-native equivalent elsewhere

Used for:

- Game metadata
- Stats
- Labels
- Supporting text

---

## Numeric Emphasis

Scores use:

- Larger size tier
- Medium weight
- Tight tracking
- Clear alignment

---

# Accessibility

## Touch Targets

- Minimum 44pt
- Generous spacing tokens

---

## Color Contrast

- WCAG AA minimum
- Score + expiration must remain readable at all times

---

## Motion

- Subtle animations only
- Reduced motion setting respected
- No critical information conveyed by motion alone

---

## Legibility

- Avoid thin weights
- Clear numeric differentiation (1 vs 7, 0 vs O)

---

## Input Safety

- Display name validation
- Content filtering at submission
- Clear error states

---

# Architectural Alignment

UI must support:

- Event-based reconstruction of games
- Deterministic expiration logic
- Modular rules engine
- Future ranked integration

UI components must remain independent from networking layer.
