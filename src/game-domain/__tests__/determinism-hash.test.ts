import type { GameEvent, GameState } from "../index";
import {
  getReconstructionHashFromEvents,
  getReconstructionStateHash,
  reconstructGameState,
} from "../index";
import { calculateBoardGeometry } from "../layout/anchors";
import { computeBoardBounds, computeFitTransform } from "../layout/viewport";
import { BLOCKED_ROUND_EVENT_LOG, OPENING_EVENT_LOG, SPINNER_EXPANSION_EVENT_LOG } from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

const toStableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => toStableValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, toStableValue(nestedValue)]),
    );
  }

  return value;
};

const createLayoutFingerprint = (events: readonly GameEvent[]) => {
  const state = reconstructGameState(events);
  const game = requireGame(state.game);
  const geometry = calculateBoardGeometry(game.currentRound!.board);
  const bounds = computeBoardBounds(geometry.placedTiles);
  const transform = computeFitTransform(bounds, { width: 320, height: 480 }, 24);

  return JSON.stringify(
    toStableValue({
      reconstructionHash: getReconstructionStateHash(state),
      placedTiles: geometry.placedTiles,
      anchors: geometry.anchors,
      bounds,
      transform,
    }),
  );
};

describe("Determinism hashes", () => {
  it("replays the same opening fixture into the same reconstruction hash every time", () => {
    const hashes = Array.from({ length: 5 }, () =>
      getReconstructionHashFromEvents(OPENING_EVENT_LOG),
    );

    expect(hashes).toEqual([
      hashes[0],
      hashes[0],
      hashes[0],
      hashes[0],
      hashes[0],
    ]);
    expect(hashes[0]).toMatch(/^[0-9a-f]{8}$/);
  });

  it("keeps the full state-plus-layout fingerprint identical across repeated spinner replays", () => {
    const fingerprints = Array.from({ length: 5 }, () =>
      createLayoutFingerprint(SPINNER_EXPANSION_EVENT_LOG),
    );

    expect(new Set(fingerprints).size).toBe(1);
  });

  it("preserves the same reconstruction hash when events are cloned but semantically unchanged", () => {
    const clonedLog = OPENING_EVENT_LOG.map((event) => ({ ...event }));

    expect(getReconstructionHashFromEvents(clonedLog)).toBe(
      getReconstructionHashFromEvents(OPENING_EVENT_LOG),
    );
  });

  it("changes the reconstruction hash when the authoritative replay state changes", () => {
    expect(getReconstructionHashFromEvents(BLOCKED_ROUND_EVENT_LOG)).not.toBe(
      getReconstructionHashFromEvents(OPENING_EVENT_LOG),
    );
  });
});
