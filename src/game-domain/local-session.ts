import {
  GAME_EVENT_SCHEMA_VERSION,
  GameEvent,
  GameStartedEvent,
  RoundStartedEvent,
} from "./events/schema";
import {
  EventId,
  GameId,
  PlayerId,
  RoundId,
  TileId,
} from "./types";
import { createPRNG, shuffle } from "./util/random";
import { createDoubleSixTileCatalog } from "./util/tiles";

/**
 * Creates an initial set of events for a local game session based on a seed.
 * This ensures that the same seed always results in the same initial deal.
 */
export function createLocalGameSession(
  seed: number,
  player1DisplayName: string = "Avery",
  player2DisplayName: string = "Blake",
): readonly GameEvent[] {
  const prng = createPRNG(seed);

  const gameId = `local-game-${seed}` as GameId;
  const player1Id = "p1" as PlayerId;
  const player2Id = "p2" as PlayerId;
  const round1Id = `local-round-${seed}-1` as RoundId;

  const tileCatalog = createDoubleSixTileCatalog();
  const shuffledTileIds = shuffle(
    tileCatalog.map((t) => t.id),
    prng,
  );

  const player1Hand = shuffledTileIds.slice(0, 7) as readonly TileId[];
  const player2Hand = shuffledTileIds.slice(7, 14) as readonly TileId[];
  const boneyard = shuffledTileIds.slice(14) as readonly TileId[];

  // Determine who starts. For Fives, often the person with the highest double.
  // For T2 simplicity, we'll just alternate or pick p1.
  const startingPlayerId = player1Id;

  const now = new Date().toISOString();

  const gameStarted: GameStartedEvent = {
    eventId: "evt-001-game-started" as EventId,
    gameId,
    eventSeq: 1,
    type: "GAME_STARTED",
    version: GAME_EVENT_SCHEMA_VERSION,
    occurredAt: now,
    createdBy: player1Id,
    targetScore: 100,
    variant: "fives",
    players: [
      {
        playerId: player1Id,
        position: "player_1",
        displayName: player1DisplayName,
      },
      {
        playerId: player2Id,
        position: "player_2",
        displayName: player2DisplayName,
      },
    ],
    tileCatalog: [...tileCatalog],
  };

  const roundStarted: RoundStartedEvent = {
    eventId: "evt-002-round-started" as EventId,
    gameId,
    eventSeq: 2,
    type: "ROUND_STARTED",
    version: GAME_EVENT_SCHEMA_VERSION,
    occurredAt: now,
    roundId: round1Id,
    roundNumber: 1,
    startingPlayerId,
    handsByPlayerId: {
      [player1Id]: player1Hand,
      [player2Id]: player2Hand,
    },
    boneyardTileIds: boneyard,
  };

  return [gameStarted, roundStarted];
}
