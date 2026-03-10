import type {
  EventId,
  GameEvent,
  GameId,
  GameStartedEvent,
  GameVariant,
  PlayerId,
  PlayerPosition,
  RoundEndedEvent,
  RoundId,
  Tile,
  TileDrawnEvent,
  TileId,
  TilePlayedEvent,
  TurnPassedEvent,
  RoundStartedEvent,
  GameEndedEvent,
  ForfeitEvent,
} from "../../index";
import { GAME_EVENT_SCHEMA_VERSION } from "../../index";

type FixtureGameIds = Readonly<{
  gameId: GameId;
  roundId: RoundId;
  playerOneId: PlayerId;
  playerTwoId: PlayerId;
}>;

type FixtureEventStepBase = Readonly<{
  occurredAt?: string;
}>;

type FixtureGameStartedStep = FixtureEventStepBase &
  Omit<
    GameStartedEvent,
    "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version"
  >;

type FixtureRoundStartedStep = FixtureEventStepBase &
  Omit<
    RoundStartedEvent,
    "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version"
  >;

type FixtureTilePlayedStep = FixtureEventStepBase &
  Omit<
    TilePlayedEvent,
    "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version"
  >;

type FixtureTileDrawnStep = FixtureEventStepBase &
  Omit<
    TileDrawnEvent,
    "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version"
  >;

type FixtureTurnPassedStep = FixtureEventStepBase &
  Omit<
    TurnPassedEvent,
    "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version"
  >;

type FixtureRoundEndedStep = FixtureEventStepBase &
  Omit<
    RoundEndedEvent,
    "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version"
  >;

type FixtureGameEndedStep = FixtureEventStepBase &
  Omit<
    GameEndedEvent,
    "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version"
  >;

type FixtureForfeitStep = FixtureEventStepBase &
  Omit<ForfeitEvent, "eventId" | "eventSeq" | "gameId" | "occurredAt" | "version">;

export type FixtureEventStep =
  | FixtureGameStartedStep
  | FixtureRoundStartedStep
  | FixtureTilePlayedStep
  | FixtureTileDrawnStep
  | FixtureTurnPassedStep
  | FixtureRoundEndedStep
  | FixtureGameEndedStep
  | FixtureForfeitStep;

export type FixtureEventLogOptions = Readonly<{
  gameId?: GameId;
  startedAt?: string;
  stepMinutes?: number;
}>;

const DEFAULT_STARTED_AT = "2026-01-01T00:00:00.000Z";
const DEFAULT_STEP_MINUTES = 1;

const asGameId = (value: string): GameId => value as GameId;
const asRoundId = (value: string): RoundId => value as RoundId;
const asPlayerId = (value: string): PlayerId => value as PlayerId;
const asTileId = (value: string): TileId => value as TileId;
const asEventId = (value: string): EventId => value as EventId;

const toTileLabel = (sideA: number, sideB: number): string =>
  `${Math.min(sideA, sideB)}-${Math.max(sideA, sideB)}`;

const addMinutes = (timestamp: string, minutes: number): string =>
  new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();

const createFixtureEventId = (eventSeq: number, type: GameEvent["type"]): EventId =>
  asEventId(`evt-${eventSeq.toString().padStart(3, "0")}-${type.toLowerCase()}`);

export const FIXTURE_IDS: FixtureGameIds = {
  gameId: asGameId("game-fixture-001"),
  roundId: asRoundId("round-fixture-001"),
  playerOneId: asPlayerId("player-fixture-001"),
  playerTwoId: asPlayerId("player-fixture-002"),
};

export const createFixturePlayer = (
  playerId: PlayerId,
  position: PlayerPosition,
  displayName: string,
) => ({
  playerId,
  position,
  displayName,
});

export const FIXTURE_PLAYERS = [
  createFixturePlayer(FIXTURE_IDS.playerOneId, "player_1", "Avery"),
  createFixturePlayer(FIXTURE_IDS.playerTwoId, "player_2", "Blake"),
] as const;

export const createDoubleSixTileCatalog = (): readonly Tile[] => {
  const tiles: Tile[] = [];

  for (let sideA = 0; sideA <= 6; sideA += 1) {
    for (let sideB = sideA; sideB <= 6; sideB += 1) {
      tiles.push({
        id: asTileId(`tile-${toTileLabel(sideA, sideB)}`),
        sideA: sideA as Tile["sideA"],
        sideB: sideB as Tile["sideB"],
      });
    }
  }

  return tiles;
};

export const FIXTURE_TILE_CATALOG = createDoubleSixTileCatalog();

export const FIXTURE_TILE_CATALOG_BY_ID = Object.fromEntries(
  FIXTURE_TILE_CATALOG.map((tile) => [tile.id, tile]),
) as Readonly<Record<TileId, Tile>>;

export const getFixtureTileId = (
  sideA: Tile["sideA"],
  sideB: Tile["sideB"],
): TileId => asTileId(`tile-${toTileLabel(sideA, sideB)}`);

export const getFixtureTile = (
  sideA: Tile["sideA"],
  sideB: Tile["sideB"],
): Tile => FIXTURE_TILE_CATALOG_BY_ID[getFixtureTileId(sideA, sideB)];

export const getFixtureTileIds = (
  ...tiles: readonly (readonly [Tile["sideA"], Tile["sideB"]])[]
): readonly TileId[] => tiles.map(([sideA, sideB]) => getFixtureTileId(sideA, sideB));

export const createHandsByPlayerId = (
  playerOneTileIds: readonly TileId[],
  playerTwoTileIds: readonly TileId[],
): Readonly<Record<PlayerId, readonly TileId[]>> =>
  ({
    [FIXTURE_IDS.playerOneId]: [...playerOneTileIds],
    [FIXTURE_IDS.playerTwoId]: [...playerTwoTileIds],
  }) as Readonly<Record<PlayerId, readonly TileId[]>>;

export const createScoreByPlayerId = (
  playerOneScore: number,
  playerTwoScore: number,
): Readonly<Record<PlayerId, number>> =>
  ({
    [FIXTURE_IDS.playerOneId]: playerOneScore,
    [FIXTURE_IDS.playerTwoId]: playerTwoScore,
  }) as Readonly<Record<PlayerId, number>>;

export const createGameStartedStep = (
  overrides: Partial<FixtureGameStartedStep> = {},
): FixtureGameStartedStep => ({
  type: "GAME_STARTED",
  createdBy: FIXTURE_IDS.playerOneId,
  targetScore: 100,
  variant: "fives" as GameVariant,
  players: FIXTURE_PLAYERS,
  tileCatalog: FIXTURE_TILE_CATALOG,
  ...overrides,
});

export const createRoundStartedStep = (
  overrides: Partial<FixtureRoundStartedStep> = {},
): FixtureRoundStartedStep => ({
  type: "ROUND_STARTED",
  roundId: FIXTURE_IDS.roundId,
  roundNumber: 1,
  startingPlayerId: FIXTURE_IDS.playerOneId,
  handsByPlayerId: createHandsByPlayerId([], []),
  boneyardTileIds: [],
  ...overrides,
});

export const createTilePlayedStep = (
  overrides: Partial<FixtureTilePlayedStep> &
    Pick<FixtureTilePlayedStep, "playerId" | "tileId" | "side" | "openPipFacingOutward">,
): FixtureTilePlayedStep => {
  const { playerId, tileId, side, openPipFacingOutward, ...rest } = overrides;

  return {
    type: "TILE_PLAYED",
    playerId,
    roundId: FIXTURE_IDS.roundId,
    tileId,
    side,
    openPipFacingOutward,
    ...rest,
  };
};

export const createTileDrawnStep = (
  overrides: Partial<FixtureTileDrawnStep> &
    Pick<FixtureTileDrawnStep, "playerId" | "tileId">,
): FixtureTileDrawnStep => {
  const { playerId, tileId, ...rest } = overrides;

  return {
    type: "TILE_DRAWN",
    playerId,
    roundId: FIXTURE_IDS.roundId,
    tileId,
    source: "boneyard",
    ...rest,
  };
};

export const createTurnPassedStep = (
  overrides: Partial<FixtureTurnPassedStep> &
    Pick<FixtureTurnPassedStep, "playerId" | "reason">,
): FixtureTurnPassedStep => {
  const { playerId, reason, ...rest } = overrides;

  return {
    type: "TURN_PASSED",
    playerId,
    roundId: FIXTURE_IDS.roundId,
    reason,
    ...rest,
  };
};

export const createRoundEndedStep = (
  overrides: Partial<FixtureRoundEndedStep> &
    Pick<
      FixtureRoundEndedStep,
      "winnerPlayerId" | "reason" | "scoreAwarded" | "scoreByPlayerId" | "nextStartingPlayerId"
    >,
): FixtureRoundEndedStep => {
  const {
    winnerPlayerId,
    reason,
    scoreAwarded,
    scoreByPlayerId,
    nextStartingPlayerId,
    ...rest
  } = overrides;

  return {
    type: "ROUND_ENDED",
    roundId: FIXTURE_IDS.roundId,
    winnerPlayerId,
    reason,
    scoreAwarded,
    scoreByPlayerId,
    nextStartingPlayerId,
    ...rest,
  };
};

export const createGameEndedStep = (
  overrides: Partial<FixtureGameEndedStep> &
    Pick<FixtureGameEndedStep, "winnerPlayerId" | "reason" | "finalScoreByPlayerId">,
): FixtureGameEndedStep => {
  const { winnerPlayerId, reason, finalScoreByPlayerId, ...rest } = overrides;

  return {
    type: "GAME_ENDED",
    roundId: FIXTURE_IDS.roundId,
    winnerPlayerId,
    reason,
    finalScoreByPlayerId,
    ...rest,
  };
};

export const createForfeitStep = (
  overrides: Partial<FixtureForfeitStep> &
    Pick<
      FixtureForfeitStep,
      "forfeitingPlayerId" | "awardedToPlayerId" | "reason" | "roundId"
    >,
): FixtureForfeitStep => {
  const { forfeitingPlayerId, awardedToPlayerId, reason, roundId, ...rest } =
    overrides;

  return {
    type: "FORFEIT",
    forfeitingPlayerId,
    awardedToPlayerId,
    reason,
    roundId,
    ...rest,
  };
};

export const buildFixtureEventLog = (
  steps: readonly FixtureEventStep[],
  options: FixtureEventLogOptions = {},
): readonly GameEvent[] => {
  const gameId = options.gameId ?? FIXTURE_IDS.gameId;
  const startedAt = options.startedAt ?? DEFAULT_STARTED_AT;
  const stepMinutes = options.stepMinutes ?? DEFAULT_STEP_MINUTES;

  return steps.map((step, index) => {
    const eventSeq = index + 1;
    const occurredAt =
      step.occurredAt ?? addMinutes(startedAt, index * stepMinutes);

    return {
      ...step,
      eventId: createFixtureEventId(eventSeq, step.type),
      gameId,
      eventSeq,
      occurredAt,
      version: GAME_EVENT_SCHEMA_VERSION,
    } as GameEvent;
  });
};
