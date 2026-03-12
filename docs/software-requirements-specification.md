# Dominoes Multiplayer — Software Requirements Specification (MVP)

---

## System Design

- Mobile-first iOS app built with React Native (Expo).
- Backend powered by Supabase:
  - Postgres (primary datastore)
  - Realtime subscriptions (game updates)
  - Edge Functions (server logic)
- Event-sourced game model:
  - Each move stored as immutable event
  - Game state reconstructed from event log
- Deterministic expiration logic enforced server-side (3 days since last move).
- UI implementation must follow design-system constraints:
  - **No Tailwind**
  - **No hard-coded styling values**
  - Use `tokens.ts` as the single source of truth for design tokens
  - Use shared UI components pulled from Figma via MCP server whenever available

---

## Architecture pattern

- Client–Server architecture.
- Backend-for-Frontend (BFF) via Supabase Edge Functions.
- Event Sourcing for game state + deterministic rules engine.
- Modular domain separation:
  - Game Rules Engine (pure deterministic logic)
  - Persistence Layer (Supabase/Postgres)
  - Networking Layer (typed API client)
  - UI Layer (components + token-driven styles)

Game rules engine requirements:

- Pure + deterministic (same inputs → same outputs)
- Testable independently (unit tests for rules and scoring)
- Framework-agnostic (shared across mobile + future web)

---

## State management

Frontend state:

- **Zustand** for app/UI state (auth session, current selection, ephemeral UI flags).
- **TanStack Query** for server state (profiles, games list, event logs).
- Supabase Realtime channels to invalidate/refetch or append events.

State categories:

- Auth/session state
- Profile state (avatar, display name, friend code)
- Active games list
- Selected game event log
- Derived game state (reconstructed)
- Friend requests + outcomes

Reconstruction flow:

- Fetch ordered `game_events`
- Replay via rules engine to derive:
  - Board layout
  - Scores
  - Current turn
  - Playable moves
  - Expiration timestamp
- Derived state is non-authoritative; server remains source of truth.

---

## Data flow

### Async Move Submission

1. Player attempts move
2. Client validates legality locally (UI prevents illegal moves)
3. Client calls Edge Function `submit-move`
4. Server:
   - Validates correct turn + legality (rules engine)
   - Appends event to `game_events`
   - Updates `games.last_move_at` + `games.expiration_at`
5. Realtime pushes new event to opponent
6. Opponent reconstructs state and animates last move from event log

### App Resume

- Home loads active games list
- Selecting a game loads event log → reconstructs → animates opponent’s last move (per UI doc)

### Game Expiration

- Expiration = `last_move_at + 3 days` (MVP rule)
- Server enforces on:
  - Any move submission
  - Any game fetch that would display “active”
- If expired:
  - Game marked forfeited/expired
  - Terminal result event appended (e.g., `FORFEIT`)

---

## Technical Stack

Frontend:

- Expo (React Native)
- TypeScript
- Zustand
- TanStack Query
- Supabase JS client
- **Styling: React Native Unistyles**
  - Token-driven styles
  - Future-ready for web/responsive needs (breakpoints/media queries)
  - Coexists with RN primitives (no Tailwind)

Design System Integration:

- `tokens.ts` generated/maintained from Figma tokens (via MCP pipeline)
- Shared component library pulled from Figma via MCP server:
  - Button (Primary/Secondary/Disabled)
  - Card (Elevated/Flat), Stat Card, Game Card
  - Avatar, XP Progress Bar
  - Segmented Input (friend code)
  - Countdown Timer
  - Modal, Toast
  - Game-specific: Domino Tile, Chain Renderer, Turn Indicator, Score Display, Expiration Pill
- Rules:
  - All spacing, typography, color, elevation must come from `tokens.ts`
  - Components must be used when available; avoid one-off duplicates
  - No hard-coded hex values, sizes, shadows, or font sizes

Backend:

- Supabase
  - Postgres
  - Realtime
  - Row Level Security (RLS)
  - Edge Functions (TypeScript)

Database:

- Postgres (Supabase-managed)

Testing:

- Jest for rules engine + server validators
- Minimal integration tests for Edge Functions (happy path + security checks)

---

## Authentication Process

MVP model:

- Supabase Auth anonymous user created during onboarding.
- On onboarding completion:
  - Create profile row linked to auth user id
  - Assign unique 12-digit numeric friend code

Friend code requirements:

- 12-digit numeric string
- Unique constraint + index
- Treated as stable identifier across future auth upgrades

Security:

- RLS ensures users can only:
  - Read their own profile
  - Read games where they are a participant
  - Read events for games they participate in
- All writes (create game, submit move, accept/deny) go through Edge Functions.

Future:

- Link anonymous → Apple/email/social account for cross-device progression.

---

## Route Design

Mobile routes:

- `/welcome`
- `/home`
- `/game-setup`
- `/game/:gameId`
- `/end-game/:gameId`
- `/profile`

Navigation rules:

- Bottom nav persists across non-game screens (per UI doc)
- Bottom nav hidden during `/game/:gameId`

---

## API Design

All write APIs are Edge Functions; reads may be via PostgREST with RLS or Edge Functions (preferred for complex joins).

### `POST /create-game`

- Creates:
  - Human vs human game (via friend code)
  - AI game (stores AI config in game metadata)

Body:

- `opponent_friend_code?`
- `ai_difficulty?` = `easy | medium | hard`

Returns:

- `game_id`

### `POST /accept-game`

Body:

- `game_id`

Returns:

- updated game status

### `POST /deny-game`

Body:

- `game_id`

Returns:

- denied status (no stats impact)

### `POST /submit-move`

Body:

- `game_id`
- `move_payload` (see event schema)

Server responsibilities:

- Validate player is participant
- Validate game active + not expired
- Validate correct turn
- Validate legality using rules engine
- Append event
- Update timestamps + expiration
- Emit realtime update

Returns:

- `event_id`
- `event_seq` (optional) and/or latest `created_at`

### `GET /active-games`

Returns:

- list of active games for user with:
  - opponent name/avatar
  - current score snapshot (can be cached/denormalized)
  - last played
  - expiration_at
  - whose turn indicator

### `GET /game/:id/events`

Returns:

- ordered immutable event list
- game metadata (`last_move_at`, `expiration_at`, status)

### `POST /send-friend-request`

Body:

- `game_id` OR `opponent_profile_id`

Returns:

- friend_request_id

### `POST /accept-friend-request`

Body:

- `friend_request_id`

Returns:

- friendship created

Event schema (conceptual):

- `MOVE`
- `GAME_END`
- `FORFEIT`
- `FRIEND_REQUEST_SENT` (optional; can be separate table-only in MVP)

---

## Database Design ERD

Tables (conceptual):

### `auth.users` (Supabase-managed)

- `id (uuid, PK)`
- `created_at`

### `profiles`

- `id (uuid, PK, FK -> auth.users.id)`
- `display_name`
- `avatar_id`
- `friend_code (unique, indexed)`
- `total_wins`
- `total_games`
- `created_at`

### `games`

- `id (uuid, PK)`
- `player_one_id (FK -> profiles.id)`
- `player_two_id (FK -> profiles.id, nullable for AI?)`
- `ai_difficulty (nullable)`
- `status (ACTIVE | COMPLETED | EXPIRED | DENIED?)`
- `winner_id (FK -> profiles.id, nullable)`
- `last_move_at`
- `expiration_at`
- `created_at`

Indexes:

- `(player_one_id, status)`
- `(player_two_id, status)`
- `(expiration_at)` for housekeeping queries

### `game_events`

- `id (uuid, PK)`
- `game_id (FK -> games.id)`
- `player_id (FK -> profiles.id, nullable for system events)`
- `event_type (MOVE | GAME_END | FORFEIT)`
- `payload (jsonb)`
- `created_at`

Indexes:

- `(game_id, created_at)`

### `friend_requests`

- `id (uuid, PK)`
- `requester_id (FK -> profiles.id)`
- `receiver_id (FK -> profiles.id)`
- `status (PENDING | ACCEPTED | DENIED)`
- `created_at`

### `friendships`

- `id (uuid, PK)`
- `user_one_id (FK -> profiles.id)`
- `user_two_id (FK -> profiles.id)`
- `created_at`

Constraints:

- unique composite `(user_one_id, user_two_id)` (store normalized ordering to prevent duplicates)

Notes:

- Optional denormalization for MVP performance:
  - `games.score_p1`, `games.score_p2`, `games.turn_profile_id`
  - Still derived from events, but cached for home list speed
