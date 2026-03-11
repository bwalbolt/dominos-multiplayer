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
  reset: () => void;
}

export const useLocalSessionStore = create<LocalSessionState>((set) => ({
  seed: null,
  events: [],
  reconstruction: null,

  initialize: (seed: number) => {
    const events = createLocalGameSession(seed);
    const reconstruction = reconstructGameState(events);
    set({ seed, events, reconstruction });
  },

  reset: () => {
    set({ seed: null, events: [], reconstruction: null });
  },
}));
