import { create } from "zustand";
import { GameEvent } from "./events/schema";
import { createLocalGameSession } from "./local-session";
import { reconstructGameState } from "./reconstruct";
import { ReconstructionState } from "./types";

interface LocalSessionState {
  seed: number | null;
  events: readonly GameEvent[];
  reconstruction: ReconstructionState | null;

  // Actions
  initialize: (seed: number) => void;
  appendEvent: (event: GameEvent) => void;
  appendEvents: (events: readonly GameEvent[]) => void;
  reset: () => void;
}

export const useLocalSessionStore = create<LocalSessionState>((set, get) => ({
  seed: null,
  events: [],
  reconstruction: null,

  initialize: (seed: number) => {
    const events = createLocalGameSession(seed);
    const reconstruction = reconstructGameState(events);
    set({ seed, events, reconstruction });
  },

  appendEvent: (event: GameEvent) => {
    const { events } = get();
    const nextEvents = [...events, event];
    const reconstruction = reconstructGameState(nextEvents);
    set({ events: nextEvents, reconstruction });
  },

  appendEvents: (newEvents: readonly GameEvent[]) => {
    const { events } = get();
    const nextEvents = [...events, ...newEvents];
    const reconstruction = reconstructGameState(nextEvents);
    set({ events: nextEvents, reconstruction });
  },

  reset: () => {
    set({ seed: null, events: [], reconstruction: null });
  },
}));

