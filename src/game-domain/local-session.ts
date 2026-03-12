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
 * Creates a ROUND_STARTED event for a given round number and seed.
 */
export function createRoundStartedEvent({
  gameId,
  eventSeq,
  roundNumber,
  seed,
  playerIds,
  startingPlayerId,
  forcePlayer1Hand,
  forcePlayer2Hand,
}: {
  gameId: GameId;
  eventSeq: number;
  roundNumber: number;
  seed: number;
  playerIds: readonly [PlayerId, PlayerId];
  startingPlayerId: PlayerId;
  forcePlayer1Hand?: readonly TileId[];
  forcePlayer2Hand?: readonly TileId[];
}): RoundStartedEvent {
  const prng = createPRNG(seed + roundNumber); // Use round number to vary the shuffle
  const tileCatalog = createDoubleSixTileCatalog();
  const allTileIds = tileCatalog.map((t) => t.id);

  let player1Hand: readonly TileId[];
  let player2Hand: readonly TileId[];
  let boneyard: readonly TileId[];

  if (forcePlayer1Hand || forcePlayer2Hand) {
    player1Hand = forcePlayer1Hand || [];
    player2Hand = forcePlayer2Hand || [];
    const usedIds = new Set([...player1Hand, ...player2Hand]);
    boneyard = allTileIds.filter((id) => !usedIds.has(id));
  } else {
    const shuffledTileIds = shuffle(allTileIds, prng);
    player1Hand = shuffledTileIds.slice(0, 7) as readonly TileId[];
    player2Hand = shuffledTileIds.slice(7, 14) as readonly TileId[];
    boneyard = shuffledTileIds.slice(14) as readonly TileId[];
  }

  return {
    eventId: `evt-${eventSeq.toString().padStart(3, "0")}-round-started` as EventId,
    gameId,
    eventSeq,
    type: "ROUND_STARTED",
    version: GAME_EVENT_SCHEMA_VERSION,
    occurredAt: new Date().toISOString(),
    roundId: `${gameId}-round-${roundNumber}` as RoundId,
    roundNumber,
    startingPlayerId,
    handsByPlayerId: {
      [playerIds[0]]: player1Hand,
      [playerIds[1]]: player2Hand,
    },
    boneyardTileIds: boneyard,
  };
}

/**
 * Creates an initial set of events for a local game session based on a seed.
 * This ensures that the same seed always results in the same initial deal.
 */
export function createLocalGameSession(
  seed: number,
  player1DisplayName: string = "Avery",
  player2DisplayName: string = "Blake",
): readonly GameEvent[] {
  const gameId = `local-game-${seed}` as GameId;
  const player1Id = "p1" as PlayerId;
  const player2Id = "p2" as PlayerId;

  const tileCatalog = createDoubleSixTileCatalog();
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

  const roundStarted = createRoundStartedEvent({
    gameId,
    eventSeq: 2,
    roundNumber: 1,
    seed,
    playerIds: [player1Id, player2Id],
    startingPlayerId: player1Id,
  });

  return [gameStarted, roundStarted];
}
