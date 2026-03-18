import { createRoundStartedEvent } from "../local-session";
import { GameId, PlayerId, TileId } from "../types";

const playerIds = ["p1" as PlayerId, "p2" as PlayerId] as const;

const handHasDouble = (tileIds: readonly TileId[]): boolean =>
  tileIds.some((tileId) => {
    const [, left, right] = tileId.split("-");
    return left === right;
  });

describe("createRoundStartedEvent", () => {
  it("silently redraws the opening deal until either player has a double", () => {
    const event = createRoundStartedEvent({
      gameId: "game-1" as GameId,
      eventSeq: 2,
      roundNumber: 1,
      seed: 137,
      playerIds,
      startingPlayerId: playerIds[0],
    });

    const player1Hand = event.handsByPlayerId[playerIds[0]];
    const player2Hand = event.handsByPlayerId[playerIds[1]];

    expect(player1Hand).toHaveLength(7);
    expect(player2Hand).toHaveLength(7);
    expect(event.boneyardTileIds).toHaveLength(14);
    expect(handHasDouble(player1Hand) || handHasDouble(player2Hand)).toBe(true);
  });

  it("gives the opening turn to the player holding the highest double in round one", () => {
    const event = createRoundStartedEvent({
      gameId: "game-1" as GameId,
      eventSeq: 2,
      roundNumber: 1,
      seed: 999,
      playerIds,
      startingPlayerId: playerIds[0],
      forcePlayer1Hand: ["tile-4-4" as TileId, "tile-1-2" as TileId],
      forcePlayer2Hand: ["tile-6-6" as TileId, "tile-0-1" as TileId],
    });

    expect(event.startingPlayerId).toBe(playerIds[1]);
  });

  it("keeps later rounds on the first deterministic shuffle without forcing a redraw", () => {
    const event = createRoundStartedEvent({
      gameId: "game-1" as GameId,
      eventSeq: 3,
      roundNumber: 2,
      seed: 136,
      playerIds,
      startingPlayerId: playerIds[0],
    });

    const player1Hand = event.handsByPlayerId[playerIds[0]];
    const player2Hand = event.handsByPlayerId[playerIds[1]];

    expect(handHasDouble(player1Hand)).toBe(false);
    expect(handHasDouble(player2Hand)).toBe(false);
  });

  it("preserves the provided starter for later rounds", () => {
    const event = createRoundStartedEvent({
      gameId: "game-1" as GameId,
      eventSeq: 4,
      roundNumber: 2,
      seed: 999,
      playerIds,
      startingPlayerId: playerIds[0],
      forcePlayer1Hand: ["tile-4-4" as TileId, "tile-1-2" as TileId],
      forcePlayer2Hand: ["tile-6-6" as TileId, "tile-0-1" as TileId],
    });

    expect(event.startingPlayerId).toBe(playerIds[0]);
  });
});
