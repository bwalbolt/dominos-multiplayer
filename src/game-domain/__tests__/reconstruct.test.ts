import type {
  GameEvent,
  GameStartedEvent,
  RoundEndedEvent,
  RoundStartedEvent,
  TilePlayedEvent,
} from "../events/schema";
import { reconstructGameState } from "../reconstruct";
import type {
  EventId,
  GameId,
  PlayerId,
  RoundId,
  Tile,
  TileId,
} from "../types";

describe("Reconstruction Pipeline", () => {
  const p1 = "p1" as PlayerId;
  const p2 = "p2" as PlayerId;
  const gameId = "game-1" as GameId;

  const tileCatalog: Tile[] = [
    { id: "tile-5-5" as TileId, sideA: 5, sideB: 5 },
    { id: "tile-5-0" as TileId, sideA: 5, sideB: 0 },
    { id: "tile-6-6" as TileId, sideA: 6, sideB: 6 },
  ];

  const gameStarted: GameStartedEvent = {
    eventId: "ev-1" as EventId,
    gameId,
    eventSeq: 1,
    type: "GAME_STARTED",
    version: 1,
    occurredAt: new Date().toISOString(),
    createdBy: p1,
    targetScore: 100,
    variant: "fives",
    players: [
      { playerId: p1, position: "player_1", displayName: "Alice" },
      { playerId: p2, position: "player_2", displayName: "Bob" },
    ],
    tileCatalog,
  };

  const roundStarted: RoundStartedEvent = {
    eventId: "ev-2" as EventId,
    gameId,
    eventSeq: 2,
    type: "ROUND_STARTED",
    version: 1,
    occurredAt: new Date().toISOString(),
    roundId: "r1" as RoundId,
    roundNumber: 1,
    startingPlayerId: p1,
    handsByPlayerId: {
      [p1]: ["tile-5-5" as TileId, "tile-5-0" as TileId],
      [p2]: ["tile-6-6" as TileId],
    },
    boneyardTileIds: [],
  };

  it("should correctly reconstruct board and scoring for Fives", () => {
    const tilePlayed: TilePlayedEvent = {
      eventId: "ev-3" as EventId,
      gameId,
      eventSeq: 3,
      type: "TILE_PLAYED",
      version: 1,
      occurredAt: new Date().toISOString(),
      playerId: p1,
      roundId: "r1" as RoundId,
      tileId: "tile-5-5" as TileId,
      side: "left",
      openPipFacingOutward: 5,
    };

    const events: GameEvent[] = [gameStarted, roundStarted, tilePlayed];
    const state = reconstructGameState(events);

    expect(state.game?.playerStateById[p1].score).toBe(10); // 5+5=10 opening move
    expect(state.game?.currentRound?.board.tiles).toHaveLength(1);
    expect(state.tileInstances["tile-5-5" as TileId].location.kind).toBe(
      "board",
    );
  });

  it("should update playability hints for the next player", () => {
    const tilePlayed: TilePlayedEvent = {
      eventId: "ev-3" as EventId,
      gameId,
      eventSeq: 3,
      type: "TILE_PLAYED",
      version: 1,
      occurredAt: new Date().toISOString(),
      playerId: p1,
      roundId: "r1" as RoundId,
      tileId: "tile-5-5" as TileId,
      side: "left",
      openPipFacingOutward: 5,
    };

    const state = reconstructGameState([gameStarted, roundStarted, tilePlayed]);

    // It's p2's turn now. p2 has tile-6-6. Open ends are 5 and 5.
    // 6-6 is NOT playable on 5.
    expect(state.tileInstances["tile-6-6" as TileId].isPlayable).toBe(false);
  });

  it("should handle round resolution and authoritative score sync", () => {
    const tilePlayed: TilePlayedEvent = {
      eventId: "ev-3" as EventId,
      gameId,
      eventSeq: 3,
      type: "TILE_PLAYED",
      version: 1,
      occurredAt: new Date().toISOString(),
      playerId: p1,
      roundId: "r1" as RoundId,
      tileId: "tile-5-5" as TileId,
      side: "left",
      openPipFacingOutward: 5,
    };

    const roundEnded: RoundEndedEvent = {
      eventId: "ev-4" as EventId,
      gameId,
      eventSeq: 4,
      type: "ROUND_ENDED",
      version: 1,
      occurredAt: new Date().toISOString(),
      roundId: "r1" as RoundId,
      winnerPlayerId: p1,
      reason: "domino",
      scoreAwarded: 10,
      scoreByPlayerId: {
        [p1]: 20, // 10 mid-round + 10 hand points
        [p2]: 0,
      },
      nextStartingPlayerId: p2,
    };

    const state = reconstructGameState([
      gameStarted,
      roundStarted,
      tilePlayed,
      roundEnded,
    ]);

    expect(state.game?.playerStateById[p1].score).toBe(20);
    expect(state.game?.currentRound?.status).toBe("completed");
  });

  it("should calculate pipTotal and hasPlayableTile correctly", () => {
    // p1 has tile-5-5 (10 pips) and tile-5-0 (5 pips)
    // p1 starts first
    const state = reconstructGameState([gameStarted, roundStarted]);
    const hand1 = state.game?.currentRound?.handsByPlayerId[p1];

    expect(hand1?.pipTotal).toBe(15);
    expect(hand1?.hasPlayableTile).toBe(true); // Can play 5-5 (double)

    // Alice plays 5-5
    const tilePlayed: TilePlayedEvent = {
      eventId: "ev-3" as EventId,
      gameId,
      eventSeq: 3,
      type: "TILE_PLAYED",
      version: 1,
      occurredAt: new Date().toISOString(),
      playerId: p1,
      roundId: "r1" as RoundId,
      tileId: "tile-5-5" as TileId,
      side: "left",
      openPipFacingOutward: 5,
    };

    const state2 = reconstructGameState([
      gameStarted,
      roundStarted,
      tilePlayed,
    ]);
    const hand1After = state2.game?.currentRound?.handsByPlayerId[p1];
    const hand2After = state2.game?.currentRound?.handsByPlayerId[p2];

    expect(hand1After?.pipTotal).toBe(5);
    expect(hand1After?.hasPlayableTile).toBe(false); // No longer p1's turn

    expect(hand2After?.pipTotal).toBe(12); // tile-6-6
    expect(hand2After?.hasPlayableTile).toBe(false); // Can't play 6-6 on 5
  });
});
