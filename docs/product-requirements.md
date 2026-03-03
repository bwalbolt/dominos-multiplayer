# Dominoes Multiplayer - Product Requirements Document

## 1. Elevator Pitch

A clean, modern iOS dominoes app built with React Native + Expo that lets players compete in **1v1 Fives to 100** matches—either asynchronously against friends or instantly against AI. The MVP focuses on polished core gameplay, frictionless onboarding, and a simple friend-code system, while laying architectural foundations for ranked seasons, cosmetics, monetization, cross-platform play, and future multiplayer expansion.

---

## 2. Who is this app for

- Casual players who want low-pressure async dominoes games.
- Friends/family who want to easily start games using a simple friend code.
- Solo players who want AI matches at varying difficulty.
- Competitive players (future ranked mode).

Target demographic: **all ages**, with safe identity rules and approachable design.

---

## 3. Functional Requirements

---

### 3.1 Core Game Rules (MVP)

- Variant: **Fives (All Fives)**
- Win condition: **First to 100 points**
- Full ruleset will be documented separately
- App must enforce all legal moves.
- Illegal moves are impossible via UI.

Future: support additional variants via modular rules engine.

---

### 3.2 Modes

#### MVP: Casual 1v1

- 1v1 only (AI or human)
- Async turn-based gameplay
- Game expires **3 days after last move**
- If expired → forfeited
- Active games listed on Home screen
- Users can resume any active game

#### Post-MVP

- Ranked 1v1 (60-second turn timer)
- 4-player casual
- Seasonal ranking
- Story mode

---

### 3.3 Async / Networking Model (MVP)

- Turn-based, event-driven architecture.
- Each move is sent/stored as a discrete event.
- Opponent interactions are reconstructed locally from events.
- No need to stream real-time drag animations.
- Game state must always be reconstructable from event log.

Implementation detail left flexible:

- Could support real-time later.
- Must support reliable async persistence.

---

### 3.4 Identity & Profiles

#### Onboarding (Required)

- User must:
  - Select preset avatar
  - Enter display name
- Display names:
  - Do NOT need to be unique
  - Must pass content guidelines (no explicit content, limited characters, etc.)
- Each player is assigned a unique:
  - **12-digit numeric friend code** (system-generated)

Profile stores:

- Avatar
- Display name
- Friend code
- Total wins
- Win rate
- Recently completed games
- Wins/losses with each friend

Future:

- Optional connected account (Apple/email/social)
- Cross-device progression (requires connected account)

---

### 3.5 Friend System (MVP Scope)

#### Starting a Game

- Player enters opponent’s **12-digit friend code**
- Receiving player gets a game request
- Receiver can:
  - Accept (game starts)
  - Deny (no penalty, no record impact)

#### Post-Game Friendship

- After a completed game:
  - Button: “Add as Friend”
- Friendship is mutual:
  - Other player must accept
  - If accepted → both become friends

#### Post-MVP Enhancements

- Dedicated friend management UI
- Add from profile history
- Friend list management
- Invites & presence

---

### 3.6 AI Opponents (MVP)

- Play vs Computer
- Difficulty options:
  - Easy
  - Medium
  - Hard
- AI must:
  - Follow all rules
  - Produce reasonable strategy variance
- Does not require advanced predictive modeling in MVP.

---

### 3.7 Game Expiration Logic

- Casual games expire **3 days after the last move**
- Expired game = forfeit
- Expiration must be:
  - Deterministic
  - Visible to both players (countdown indicator)

Future:

- Premium subscription tier:
  - Casual games do not expire
  - Other benefits TBD

---

### 3.8 Profile Screen (MVP)

Displays:

- Avatar
- Display name
- Friend code (copy/share)
- Total wins
- Win rate
- Recently completed games list

---

### 3.9 Non-Functional Requirements

- Smooth tile animations
- Large, accessible tap areas
- Clear turn indication
- Low-friction resume flow
- Stable async state persistence
- Modular game rules engine (for future variants)

Architecture should:

- Be backend-compatible with future:
  - Ranked real-time matches
  - Android
  - Web client (cross-play)

---

## 4. User Stories

### Onboarding

- As a new user, I must pick an avatar and enter a display name to begin.
- As a user, I am automatically assigned a unique 12-digit friend code.

---

### Home

- As a user, I see:
  - Active games
  - Recently completed games
- As a user, I can resume an active game in one tap.
- As a user, I see “Coming Soon” for non-MVP features.

---

### Start Casual Game

- As a user, I can choose:
  - Play vs Computer (select difficulty)
  - Play vs Friend (enter friend code)
- As a receiving user, I can accept or deny a game request.
- Denying does not affect my stats.

---

### Gameplay

- As a player, I can only make legal moves.
- As a player, I can clearly see:
  - Board layout
  - Scores
  - Whose turn it is
  - Expiration timer (if applicable)
- As a player, when I reopen the app, I see opponent’s last move animated.
- As a player, when I complete a move, I can go to my next active game (if available) with one tap.

---

### Post-Game

- As a player, I see:
  - Final score
  - Win/loss
- As a player, I can send a friend request to my opponent.
- As a receiving player, I must accept to finalize friendship.

---

### Profile

- As a user, I can view:
  - Total wins
  - Win rate
  - Recently completed games
  - My friend code (copyable)

---

## 5. User Interface

### Design Principles

- Clean, modern aesthetic
- Minimal clutter
- Strong visual hierarchy
- Accessible for all ages
- Domino chain always visible within viewport

---

### Key Screens (MVP)

#### 1. Welcome Screen

- Avatar grid (preset only)
- Display name input
- Continue button

---

#### 2. Home

- Header: avatar + display name
- Primary CTA: Casual Game
- Active Games list
  - Opponent name
  - Current score
  - Last played
  - Disabled state if opponent's turn
- Coming Soon tiles:
  - Ranked
  - Store
  - Daily Bonus
- Persistent bottom nav for all but Game Board
  - Home
  - Story
  - Quests
  - More (MVP link to profile)

---

#### 3. Casual Game Setup

- Play Computer (difficulty selector)
- Play Friend (enter 12-digit code)

---

#### 4. Game Board

- Top: opponent info + score
- Center: domino chain (right-angle layout support)
- Bottom: player hand
- Turn indicator
- Subtle animations for moves

---

#### 5. End Game Screen

- Winner
- Final score
- Rematch button
- Add as Friend button
- Return to Home

---

#### 6. Profile

- Avatar
- Display name
- Friend code (copy button)
- Stats
- Recently completed games

---

## MVP Boundary (Locked Scope)

Included:

- iOS (Expo RN)
- Fives to 100
- 1v1 casual (AI or friend via code)
- Async with 3-day expiration
- Basic stats
- Post-game friend request flow

Excluded:

- Ranked
- 4-player
- Story mode
- Cosmetics/store/IAP
- Ads
- Chat
- Connected accounts
- Android/Web

---

## Architecture Direction (Strategic Note)

- Use event-based game state storage to support:
  - Async
  - Replay reconstruction
  - Future web client
- Separate:
  - Game rules engine
  - Networking layer
  - UI rendering
- Design friend code system to remain stable across future auth upgrades.
