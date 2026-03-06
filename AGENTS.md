# AI Agent Guidelines (AGENTS.md)

Welcome! You are an AI agent contributing to the **Dominoes Multiplayer** app. This document outlines the strict technical rules, architectural principles, and styling guidelines you must follow to maintain code quality, consistency, and alignment with the project's vision.

## 1. Project Overview & Tech Stack

- **Platform**: iOS (Primary), Android/Web (Future)
- **Framework**: React Native + Expo (Expo Router for navigation)
- **Language**: TypeScript (Strict mode enabled)
- **Backend / BaaS**: Supabase (Postgres, Realtime, Edge Functions)
- **State Management**: Zustand (Client UI state) + TanStack Query (Server state)
- **Styling**: React Native Unistyles + `tokens.ts` (Design tokens)
- **Testing**: Vitest for business logic

## 2. Core Architectural Rules

We use a **Client-Server Architecture** with a **Backend-for-Frontend (BFF)** pattern powered by Supabase Edge Functions. The game state relies on an **Event Sourced Model**.

- **Clear Separation of Concerns**: Always maintain modular boundaries between:
  - **Game Rules Engine**: Must be composed of pure, deterministic functions (same inputs -> same outputs). This must be independent of UI or network and easily testable.
  - **Persistence Layer**: Handled via Supabase DB and edge functions.
  - **Networking Layer**: Typed API client interacting with Supabase.
  - **UI Layer**: React Native components using Unistyles.
- **Event Sourcing**: Game state is always derived/reconstructed from an immutable log of events (e.g., `MOVE`, `GAME_END`, `FORFEIT`). Do not mutate the game state directly on the client.
- **Deterministic Validation**: The server is the ultimate source of truth. The client UI should prevent illegal moves, but the server Edge Function must re-validate before appending an event.

## 3. Strict UI & Styling Requirements

- **NO TAILWIND**: Do not use TailwindCSS or NativeWind.
- **NO HARDCODED VALUES**: You must never hardcode hex colors, spacing units (margins/paddings), font sizes, or border radii directly in components.
- **Design Tokens are the Source of Truth**: All UI styling must map to tokens defined in `tokens.ts` (which are synced from Figma).
- **Hybrid Unistyles Approach**: Use **React Native Unistyles** for dynamic theming, but restrict its theme registry _only_ to `colors`.
- **Static Layout & Typography**: Never put typography, layout, or spacing inside the Unistyles theme registry. Import layout tokens (like `spacing`, `typography`, and flat semantic tokens like `siteGutter` or `defaultBorderRadius`) directly from `tokens.ts`.
- **Flat Semantic Tokens**: Implement flat semantic aliases mapped from primitives rather than deeply nested categories (e.g. `export const siteGutter = spacing[24];`).
- **No Inline Hook Styling**: Do not pull styles directly into JSX using `useUnistyles()` hooks. Always use Unistyles' intercepting `StyleSheet.create((theme) => (...))` at the bottom of your component files.
- **Figma MCP Workflow**: We pull shared UI components from Figma using the Figma MCP server.
  - Always check for an existing shared component (e.g., `Button`, `Card`, `Avatar`, `Segmented Input`) before creating a new one.
  - Use the `figma-implement-design` skill when translating Figma specs to code to ensure 1:1 visual fidelity.
- **Modern Minimal Strategy**: Keep components clean, use large accessible touch targets (min 44pt), and ensure the Domino Tiles remain the visual hero.

## 4. UI Implementation & Animation Patterns

- **Animations**: Use `react-native-reanimated` exclusively for smooth, performant micro-interactions and transitions (e.g., `useAnimatedStyle`, `withTiming`, `Animated.createAnimatedComponent`). Do not use React Native's standard `Animated` API.
- **Complex Visuals & Gradients**: Use `react-native-svg` for elaborate backgrounds, radial/linear gradients, and text masking. Avoid bringing in specialized third-party masking or gradient libraries (e.g., do not use `expo-linear-gradient`).
- **Minimal Dependencies**: Build robust custom components leveraging native primitives (`View`, `Pressable`, `TextInput`) plus Unistyles rather than relying on external cross-platform UI libraries. **CRITICAL: You must explicitly ask the user for permission before installing any new npm packages.** We want to exhaust all native/custom options before adding dependencies.

## 5. State Management Conventions

- Use **Zustand** exclusively for ephemeral, app/UI state (e.g., current tab selection, visual toggle flags).
- Use **TanStack Query** exclusively for server state (e.g., fetching profiles, game event logs, active games lists).
- Utilize **Supabase Realtime channels** to trigger query invalidations or append to event logs.

## 6. Agent Workflow & Best Practices

1. **Analyze First**: Before writing code, review the `/docs/` folder (`product-requirements.md`, `software-requirements-specification.md`, `user-interface-design.md`) to understand feature context.
2. **Prioritize Types**: Always define strict TypeScript interfaces/types for Supabase payloads, Edge Function responses, and shared UI component props. No `any` types.
3. **Figma First**: If instructed to build a UI feature, ask for or refer to the Figma node/URL to generate the component accurately using the MCP.
4. **Testable Logic**: Any changes to the rules engine or scoring logic must be purely functional and include corresponding Vitest coverage.
5. **No Scope Creep**: Refer to the "MVP Boundary" in the PRD. Do not implement out-of-scope features like ranked mode, 4-player, chat, or IAP unless explicitly instructed.

By following these rules, you ensure that Dominoes Multiplayer remains robust, scalable, and visually premium.
