import type {
  ChainSide,
  EventId,
  GameId,
  GameVariant,
  PlayerId,
  PlayerPosition,
  RoundId,
  Tile,
  TileId,
} from "../types";

export const GAME_EVENT_SCHEMA_VERSION = 1 as const;

export const GAME_EVENT_TYPES = [
  "GAME_STARTED",
  "ROUND_STARTED",
  "TILE_PLAYED",
  "TILE_DRAWN",
  "TURN_PASSED",
  "ROUND_ENDED",
  "GAME_ENDED",
  "FORFEIT",
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];
export type GameEventSchemaVersion = typeof GAME_EVENT_SCHEMA_VERSION;

export type PlayerSnapshot = Readonly<{
  playerId: PlayerId;
  position: PlayerPosition;
  displayName: string | null;
}>;

export type ScoreByPlayerId = Readonly<Record<PlayerId, number>>;
export type TileIdsByPlayerId = Readonly<Record<PlayerId, readonly TileId[]>>;

export type BaseGameEvent<
  TType extends GameEventType,
  TPayload extends Record<string, unknown> = Record<string, never>,
> = Readonly<{
  eventId: EventId;
  gameId: GameId;
  eventSeq: number;
  type: TType;
  version: GameEventSchemaVersion;
  occurredAt: string;
}> &
  TPayload;

export type GameStartedEvent = BaseGameEvent<
  "GAME_STARTED",
  Readonly<{
    createdBy: PlayerId;
    targetScore: number;
    variant: GameVariant;
    players: readonly [PlayerSnapshot, PlayerSnapshot];
    tileCatalog: readonly Tile[];
  }>
>;

export type RoundStartedEvent = BaseGameEvent<
  "ROUND_STARTED",
  Readonly<{
    roundId: RoundId;
    roundNumber: number;
    startingPlayerId: PlayerId;
    handsByPlayerId: TileIdsByPlayerId;
    boneyardTileIds: readonly TileId[];
  }>
>;

export type TilePlayedEvent = BaseGameEvent<
  "TILE_PLAYED",
  Readonly<{
    playerId: PlayerId;
    roundId: RoundId;
    tileId: TileId;
    side: ChainSide;
    openPipFacingOutward: Tile["sideA"] | Tile["sideB"];
  }>
>;

export type TileDrawnEvent = BaseGameEvent<
  "TILE_DRAWN",
  Readonly<{
    playerId: PlayerId;
    roundId: RoundId;
    tileId: TileId;
    source: "boneyard";
  }>
>;

export type TurnPassedEvent = BaseGameEvent<
  "TURN_PASSED",
  Readonly<{
    playerId: PlayerId;
    roundId: RoundId;
    reason: "no_playable_tile" | "boneyard_empty";
  }>
>;

export type RoundEndedEvent = BaseGameEvent<
  "ROUND_ENDED",
  Readonly<{
    roundId: RoundId;
    winnerPlayerId: PlayerId | null;
    reason: "domino" | "blocked" | "forfeit";
    scoreAwarded: number;
    scoreByPlayerId: ScoreByPlayerId;
    nextStartingPlayerId: PlayerId | null;
  }>
>;

export type GameEndedEvent = BaseGameEvent<
  "GAME_ENDED",
  Readonly<{
    roundId: RoundId;
    winnerPlayerId: PlayerId;
    reason: "target_score_reached" | "forfeit";
    finalScoreByPlayerId: ScoreByPlayerId;
  }>
>;

export type ForfeitEvent = BaseGameEvent<
  "FORFEIT",
  Readonly<{
    forfeitingPlayerId: PlayerId;
    awardedToPlayerId: PlayerId;
    reason: "expired" | "resigned";
    roundId: RoundId | null;
  }>
>;

export type GameEvent =
  | GameStartedEvent
  | RoundStartedEvent
  | TilePlayedEvent
  | TileDrawnEvent
  | TurnPassedEvent
  | RoundEndedEvent
  | GameEndedEvent
  | ForfeitEvent;
