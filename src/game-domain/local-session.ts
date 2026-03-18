import {
  GAME_EVENT_SCHEMA_VERSION,
  GameEvent,
  GameStartedEvent,
  RoundStartedEvent,
} from "./events/schema";
import { EventId, GameId, PlayerId, RoundId, Tile, TileId } from "./types";
import { createPRNG, shuffle } from "./util/random";
import { createDoubleSixTileCatalog } from "./util/tiles";

const HAND_SIZE = 7;
const MAX_OPENING_DEAL_ATTEMPTS = 256;

const byDescendingDoubleValue = (left: Tile, right: Tile): number => {
  if (left.sideA !== right.sideA) {
    return right.sideA - left.sideA;
  }

  return left.id.localeCompare(right.id);
};

const buildTileCatalogById = (
  tileCatalog: readonly Tile[],
): Readonly<Record<TileId, Tile>> =>
  Object.fromEntries(tileCatalog.map((tile) => [tile.id, tile])) as Readonly<
    Record<TileId, Tile>
  >;

const hasDouble = (
  handTileIds: readonly TileId[],
  tileCatalogById: Readonly<Record<TileId, Tile>>,
): boolean =>
  handTileIds.some((tileId) => {
    const tile = tileCatalogById[tileId];
    return tile?.sideA === tile?.sideB;
  });

const getHighestDouble = (
  handTileIds: readonly TileId[],
  tileCatalogById: Readonly<Record<TileId, Tile>>,
): Tile | null =>
  handTileIds
    .map((tileId) => tileCatalogById[tileId])
    .filter((tile): tile is Tile => Boolean(tile) && tile.sideA === tile.sideB)
    .sort(byDescendingDoubleValue)[0] ?? null;

const resolveStartingPlayerId = ({
  roundNumber,
  playerIds,
  startingPlayerId,
  player1Hand,
  player2Hand,
  tileCatalogById,
}: {
  roundNumber: number;
  playerIds: readonly [PlayerId, PlayerId];
  startingPlayerId: PlayerId;
  player1Hand: readonly TileId[];
  player2Hand: readonly TileId[];
  tileCatalogById: Readonly<Record<TileId, Tile>>;
}): PlayerId => {
  if (roundNumber !== 1) {
    return startingPlayerId;
  }

  const player1HighestDouble = getHighestDouble(player1Hand, tileCatalogById);
  const player2HighestDouble = getHighestDouble(player2Hand, tileCatalogById);

  if (!player1HighestDouble && !player2HighestDouble) {
    return startingPlayerId;
  }

  if (!player2HighestDouble) {
    return playerIds[0];
  }

  if (!player1HighestDouble) {
    return playerIds[1];
  }

  return player1HighestDouble.sideA >= player2HighestDouble.sideA
    ? playerIds[0]
    : playerIds[1];
};

const dealHands = ({
  allTileIds,
  prng,
  tileCatalogById,
  requiresOpeningDouble,
}: {
  allTileIds: readonly TileId[];
  prng: () => number;
  tileCatalogById: Readonly<Record<TileId, Tile>>;
  requiresOpeningDouble: boolean;
}): Readonly<{
  player1Hand: readonly TileId[];
  player2Hand: readonly TileId[];
  boneyard: readonly TileId[];
}> => {
  for (let attempt = 0; attempt < MAX_OPENING_DEAL_ATTEMPTS; attempt += 1) {
    const shuffledTileIds = shuffle([...allTileIds], prng);
    const player1Hand = shuffledTileIds.slice(0, HAND_SIZE) as readonly TileId[];
    const player2Hand = shuffledTileIds.slice(
      HAND_SIZE,
      HAND_SIZE * 2,
    ) as readonly TileId[];

    if (
      !requiresOpeningDouble ||
      hasDouble(player1Hand, tileCatalogById) ||
      hasDouble(player2Hand, tileCatalogById)
    ) {
      return {
        player1Hand,
        player2Hand,
        boneyard: shuffledTileIds.slice(HAND_SIZE * 2) as readonly TileId[],
      };
    }
  }

  throw new Error("Unable to create a valid opening deal with a double.");
};

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
  const tileCatalogById = buildTileCatalogById(tileCatalog);
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
    const deal = dealHands({
      allTileIds,
      prng,
      tileCatalogById,
      requiresOpeningDouble: roundNumber === 1,
    });
    player1Hand = deal.player1Hand;
    player2Hand = deal.player2Hand;
    boneyard = deal.boneyard;
  }

  const resolvedStartingPlayerId = resolveStartingPlayerId({
    roundNumber,
    playerIds,
    startingPlayerId,
    player1Hand,
    player2Hand,
    tileCatalogById,
  });

  return {
    eventId:
      `evt-${eventSeq.toString().padStart(3, "0")}-round-started` as EventId,
    gameId,
    eventSeq,
    type: "ROUND_STARTED",
    version: GAME_EVENT_SCHEMA_VERSION,
    occurredAt: new Date().toISOString(),
    roundId: `${gameId}-round-${roundNumber}` as RoundId,
    roundNumber,
    startingPlayerId: resolvedStartingPlayerId,
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
  player2DisplayName: string | null = "Opponent",
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
