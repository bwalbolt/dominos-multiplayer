import type { GameState } from "../index";
import { reconstructGameState } from "../index";
import { calculateBoardGeometry } from "../layout/anchors";
import { deriveViewportState } from "../layout/viewport-policy";
import { computeBoardBounds, computeFitTransform } from "../layout/viewport";
import { getFixtureTileId } from "./fixtures/builders";
import { OPENING_EVENT_LOG, SPINNER_EXPANSION_EVENT_LOG } from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

describe("Viewport fit from fixture layouts", () => {
  it("centers the opening spinner using the capped natural scale", () => {
    const game = requireGame(reconstructGameState(OPENING_EVENT_LOG).game);
    const placedTiles = calculateBoardGeometry(game.currentRound!.board).placedTiles;
    const bounds = computeBoardBounds(placedTiles);
    const transform = computeFitTransform(bounds, { width: 320, height: 480 }, 24);

    expect(bounds).toEqual({
      x: -28,
      y: -56,
      width: 56,
      height: 112,
    });
    expect(transform).toEqual({
      scale: 1,
      translateX: 160,
      translateY: 240,
    });
  });

  it("fits the fully expanded spinner symmetrically within the viewport", () => {
    const game = requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game);
    const placedTiles = calculateBoardGeometry(game.currentRound!.board).placedTiles;
    const bounds = computeBoardBounds(placedTiles);
    const transform = computeFitTransform(bounds, { width: 320, height: 480 }, 24);

    expect(bounds).toEqual({
      x: -140,
      y: -168,
      width: 280,
      height: 336,
    });
    expect(transform).toEqual({
      scale: 0.9756,
      translateX: 160,
      translateY: 240,
    });
  });

  it("derives a stable focus target for the last move without disturbing the fit transform", () => {
    const game = requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game);
    const placedTiles = calculateBoardGeometry(game.currentRound!.board).placedTiles;
    const viewportState = deriveViewportState(placedTiles, { width: 320, height: 480 }, 24, {
      lastMoveTileId: getFixtureTileId(4, 6),
      isTurnChange: true,
    });

    expect(viewportState).toEqual({
      transform: {
        scale: 0.9756,
        translateX: 160,
        translateY: 240,
      },
      focusTarget: {
        center: { x: 0, y: 112 },
        tileId: getFixtureTileId(4, 6),
        type: "turn-change",
      },
    });
  });
});
