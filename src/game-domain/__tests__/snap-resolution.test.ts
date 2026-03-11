import type { GameState } from "../index";
import { reconstructGameState } from "../index";
import { calculateBoardGeometry } from "../layout/anchors";
import { resolveSnapTarget } from "../layout/snap";
import { getFixtureTileId } from "./fixtures/builders";
import { OPENING_EVENT_LOG, SPINNER_EXPANSION_EVENT_LOG } from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

describe("Snap resolution from fixture anchors", () => {
  it("snaps to the closest legal opening anchor and highlights the owning tile", () => {
    const game = requireGame(reconstructGameState(OPENING_EVENT_LOG).game);
    const anchors = calculateBoardGeometry(game.currentRound!.board).anchors;
    const result = resolveSnapTarget({ x: 30, y: 3 }, anchors, 20);

    expect(result).toEqual({
      anchor: {
        id: `${getFixtureTileId(6, 6)}-right`,
        ownerTileId: getFixtureTileId(6, 6),
        attachmentPoint: { x: 28, y: 0 },
        direction: "right",
        openPip: 6,
      },
      distance: Math.sqrt(13),
      highlightTileId: getFixtureTileId(6, 6),
    });
  });

  it("picks the nearest spinner branch endpoint after full expansion", () => {
    const game = requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game);
    const anchors = calculateBoardGeometry(game.currentRound!.board).anchors;
    const result = resolveSnapTarget({ x: 4, y: -160 }, anchors, 20);

    expect(result).toEqual({
      anchor: {
        id: `${getFixtureTileId(3, 6)}-up`,
        ownerTileId: getFixtureTileId(3, 6),
        attachmentPoint: { x: 0, y: -168 },
        direction: "up",
        openPip: 3,
      },
      distance: Math.sqrt(80),
      highlightTileId: getFixtureTileId(3, 6),
    });
  });

  it("breaks equal-distance ties deterministically by anchor id even when input order changes", () => {
    const game = requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game);
    const anchors = [...calculateBoardGeometry(game.currentRound!.board).anchors].reverse();
    const result = resolveSnapTarget({ x: 0, y: 0 }, anchors, 200);

    expect(result.anchor?.id).toBe(`${getFixtureTileId(1, 6)}-right`);
    expect(result.distance).toBe(140);
    expect(result.highlightTileId).toBe(getFixtureTileId(1, 6));
  });

  it("returns no snap target when every legal anchor is outside the threshold", () => {
    const game = requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game);
    const anchors = calculateBoardGeometry(game.currentRound!.board).anchors;
    const result = resolveSnapTarget({ x: 300, y: 300 }, anchors, 40);

    expect(result).toEqual({
      anchor: null,
      distance: Infinity,
      highlightTileId: null,
    });
  });
});
