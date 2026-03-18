import type { BoardState, GameState } from "../index";
import { reconstructGameState } from "../index";
import { calculateBoardGeometry } from "../layout/anchors";
import { FIXTURE_IDS, getFixtureTileId } from "./fixtures/builders";
import { OPENING_EVENT_LOG, SPINNER_EXPANSION_EVENT_LOG } from "./fixtures/event-logs";

const requireGame = (game: GameState | null): GameState => {
  if (game === null) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

const requireBoard = (game: GameState): BoardState => {
  if (game.currentRound === null) {
    throw new Error("Expected an active round.");
  }

  return game.currentRound.board;
};

const toAnchorFingerprint = (board: BoardState) =>
  calculateBoardGeometry(board).anchors.map((anchor) => ({
    id: anchor.id,
    ownerTileId: anchor.ownerTileId,
    direction: anchor.direction,
    openPip: anchor.openPip,
    attachmentPoint: anchor.attachmentPoint,
  }));

describe("Layout anchors from fixture replays", () => {
  it("keeps unopened spinner branches out of the anchor set", () => {
    const game = requireGame(reconstructGameState(OPENING_EVENT_LOG).game);
    const geometry = calculateBoardGeometry(requireBoard(game));

    expect(geometry.placedTiles).toMatchObject([
      {
        tileId: getFixtureTileId(6, 6),
        value1: 6,
        value2: 6,
        center: { x: 0, y: 0 },
        rotationDeg: 0,
        width: 56,
        height: 112,
      },
    ]);
    expect(geometry.anchors).toEqual([
      {
        id: `${getFixtureTileId(6, 6)}-left`,
        ownerTileId: getFixtureTileId(6, 6),
        attachmentPoint: { x: -28, y: 0 },
        direction: "left",
        openPip: 6,
      },
      {
        id: `${getFixtureTileId(6, 6)}-right`,
        ownerTileId: getFixtureTileId(6, 6),
        attachmentPoint: { x: 28, y: 0 },
        direction: "right",
        openPip: 6,
      },
    ]);
  });

  it("produces stable branch endpoints once the spinner is fully expanded", () => {
    const game = requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game);
    const geometry = calculateBoardGeometry(requireBoard(game));

    expect(geometry.placedTiles).toMatchObject([
      {
        tileId: getFixtureTileId(6, 6),
        value1: 6,
        value2: 6,
        center: { x: 0, y: 0 },
        rotationDeg: 0,
        width: 56,
        height: 112,
      },
      {
        tileId: getFixtureTileId(1, 6),
        value1: 1,
        value2: 6,
        center: { x: 84, y: 0 },
        rotationDeg: 90,
        width: 112,
        height: 56,
      },
      {
        tileId: getFixtureTileId(2, 6),
        value1: 2,
        value2: 6,
        center: { x: -84, y: 0 },
        rotationDeg: 270,
        width: 112,
        height: 56,
      },
      {
        tileId: getFixtureTileId(3, 6),
        value1: 3,
        value2: 6,
        center: { x: 0, y: -112 },
        rotationDeg: 0,
        width: 56,
        height: 112,
      },
      {
        tileId: getFixtureTileId(4, 6),
        value1: 4,
        value2: 6,
        center: { x: 0, y: 112 },
        rotationDeg: 180,
        width: 56,
        height: 112,
      },
    ]);
    expect(geometry.anchors).toEqual([
      {
        id: `${getFixtureTileId(2, 6)}-left`,
        ownerTileId: getFixtureTileId(2, 6),
        attachmentPoint: { x: -140, y: 0 },
        direction: "left",
        openPip: 2,
      },
      {
        id: `${getFixtureTileId(1, 6)}-right`,
        ownerTileId: getFixtureTileId(1, 6),
        attachmentPoint: { x: 140, y: 0 },
        direction: "right",
        openPip: 1,
      },
      {
        id: `${getFixtureTileId(3, 6)}-up`,
        ownerTileId: getFixtureTileId(3, 6),
        attachmentPoint: { x: 0, y: -168 },
        direction: "up",
        openPip: 3,
      },
      {
        id: `${getFixtureTileId(4, 6)}-down`,
        ownerTileId: getFixtureTileId(4, 6),
        attachmentPoint: { x: 0, y: 168 },
        direction: "down",
        openPip: 4,
      },
    ]);
  });

  it("replays the same spinner layout into the same anchor fingerprint every time", () => {
    const fingerprints = Array.from({ length: 5 }, () =>
      toAnchorFingerprint(
        requireBoard(requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game)),
      ),
    );

    expect(fingerprints).toEqual(
      Array.from({ length: 5 }, () => [
        {
          id: `${getFixtureTileId(2, 6)}-left`,
          ownerTileId: getFixtureTileId(2, 6),
          direction: "left",
          openPip: 2,
          attachmentPoint: { x: -140, y: 0 },
        },
        {
          id: `${getFixtureTileId(1, 6)}-right`,
          ownerTileId: getFixtureTileId(1, 6),
          direction: "right",
          openPip: 1,
          attachmentPoint: { x: 140, y: 0 },
        },
        {
          id: `${getFixtureTileId(3, 6)}-up`,
          ownerTileId: getFixtureTileId(3, 6),
          direction: "up",
          openPip: 3,
          attachmentPoint: { x: 0, y: -168 },
        },
        {
          id: `${getFixtureTileId(4, 6)}-down`,
          ownerTileId: getFixtureTileId(4, 6),
          direction: "down",
          openPip: 4,
          attachmentPoint: { x: 0, y: 168 },
        },
      ]),
    );
    expect(requireGame(reconstructGameState(SPINNER_EXPANSION_EVENT_LOG).game).turn?.activePlayerId).toBe(
      FIXTURE_IDS.playerTwoId,
    );
  });
});
