import type {
  ChainSide,
  DominoPip,
  EventId,
  GameId,
  GameVariant,
  PlayerId,
  PlayerPosition,
  RoundId,
  Tile,
  TileId,
} from "../types";
import {
  GAME_EVENT_SCHEMA_VERSION,
  GAME_EVENT_TYPES,
  type ForfeitEvent,
  type GameEndedEvent,
  type GameEvent,
  type GameStartedEvent,
  type PlayerSnapshot,
  type RoundEndedEvent,
  type TileDrawnEvent,
  type TilePlayedEvent,
  type TurnPassedEvent,
} from "./schema";

const DOMINO_PIPS: readonly DominoPip[] = [0, 1, 2, 3, 4, 5, 6];
const PLAYER_POSITIONS: readonly PlayerPosition[] = ["player_1", "player_2"];
const CHAIN_SIDES: readonly ChainSide[] = ["left", "right"];
const GAME_VARIANTS: readonly GameVariant[] = ["fives"];

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNullableString = (value: unknown): value is string | null =>
  value === null || isString(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isInteger(value) && value >= 0;

const isOneOf = <TValue extends string | number>(
  value: unknown,
  allowedValues: readonly TValue[],
): value is TValue => allowedValues.includes(value as TValue);

const isBrandedString = <TBrand extends string>(
  value: unknown,
): value is string & { readonly __brand: TBrand } => isString(value);

const isPlayerId = (value: unknown): value is PlayerId =>
  isBrandedString<"PlayerId">(value);

const isGameId = (value: unknown): value is GameId =>
  isBrandedString<"GameId">(value);

const isEventId = (value: unknown): value is EventId =>
  isBrandedString<"EventId">(value);

const isRoundId = (value: unknown): value is RoundId =>
  isBrandedString<"RoundId">(value);

const isTileId = (value: unknown): value is TileId =>
  isBrandedString<"TileId">(value);

const isDominoPip = (value: unknown): value is DominoPip =>
  isOneOf(value, DOMINO_PIPS);

const isTile = (value: unknown): value is Tile => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isTileId(value.id) &&
    isDominoPip(value.sideA) &&
    isDominoPip(value.sideB)
  );
};

const isPlayerSnapshot = (value: unknown): value is PlayerSnapshot => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isPlayerId(value.playerId) &&
    isOneOf(value.position, PLAYER_POSITIONS) &&
    isNullableString(value.displayName)
  );
};

const isReadonlyTupleOfTwo = <TValue>(
  value: unknown,
  itemGuard: (candidate: unknown) => candidate is TValue,
): value is readonly [TValue, TValue] =>
  Array.isArray(value) &&
  value.length === 2 &&
  itemGuard(value[0]) &&
  itemGuard(value[1]);

const isReadonlyArrayOf = <TValue>(
  value: unknown,
  itemGuard: (candidate: unknown) => candidate is TValue,
): value is readonly TValue[] => Array.isArray(value) && value.every(itemGuard);

const isRecordOfReadonlyTileIds = (
  value: unknown,
): value is Readonly<Record<PlayerId, readonly TileId[]>> => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([playerId, tileIds]) =>
      isPlayerId(playerId) && isReadonlyArrayOf(tileIds, isTileId),
  );
};

const isRecordOfPlayerScores = (
  value: unknown,
): value is Readonly<Record<PlayerId, number>> => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([playerId, score]) => isPlayerId(playerId) && isNonNegativeInteger(score),
  );
};

const hasBaseEventShape = (value: unknown): value is UnknownRecord => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isEventId(value.eventId) &&
    isGameId(value.gameId) &&
    isNonNegativeInteger(value.eventSeq) &&
    isOneOf(value.type, GAME_EVENT_TYPES) &&
    value.version === GAME_EVENT_SCHEMA_VERSION &&
    isString(value.occurredAt)
  );
};

const isGameStartedEvent = (value: unknown): value is GameStartedEvent => {
  if (!hasBaseEventShape(value) || value.type !== "GAME_STARTED") {
    return false;
  }

  return (
    isPlayerId(value.createdBy) &&
    isNonNegativeInteger(value.targetScore) &&
    isOneOf(value.variant, GAME_VARIANTS) &&
    isReadonlyTupleOfTwo(value.players, isPlayerSnapshot) &&
    isRoundId(value.roundId) &&
    isNonNegativeInteger(value.roundNumber) &&
    isPlayerId(value.startingPlayerId) &&
    isReadonlyArrayOf(value.tileCatalog, isTile) &&
    isRecordOfReadonlyTileIds(value.handsByPlayerId) &&
    isReadonlyArrayOf(value.boneyardTileIds, isTileId)
  );
};

const isTilePlayedEvent = (value: unknown): value is TilePlayedEvent => {
  if (!hasBaseEventShape(value) || value.type !== "TILE_PLAYED") {
    return false;
  }

  return (
    isPlayerId(value.playerId) &&
    isRoundId(value.roundId) &&
    isTileId(value.tileId) &&
    isOneOf(value.side, CHAIN_SIDES) &&
    isDominoPip(value.openPipFacingOutward)
  );
};

const isTileDrawnEvent = (value: unknown): value is TileDrawnEvent => {
  if (!hasBaseEventShape(value) || value.type !== "TILE_DRAWN") {
    return false;
  }

  return (
    isPlayerId(value.playerId) &&
    isRoundId(value.roundId) &&
    isTileId(value.tileId) &&
    value.source === "boneyard"
  );
};

const isTurnPassedEvent = (value: unknown): value is TurnPassedEvent => {
  if (!hasBaseEventShape(value) || value.type !== "TURN_PASSED") {
    return false;
  }

  return (
    isPlayerId(value.playerId) &&
    isRoundId(value.roundId) &&
    isOneOf(value.reason, ["no_playable_tile", "boneyard_empty"] as const)
  );
};

const isRoundEndedEvent = (value: unknown): value is RoundEndedEvent => {
  if (!hasBaseEventShape(value) || value.type !== "ROUND_ENDED") {
    return false;
  }

  return (
    isRoundId(value.roundId) &&
    (value.winnerPlayerId === null || isPlayerId(value.winnerPlayerId)) &&
    isOneOf(value.reason, ["domino", "blocked", "forfeit"] as const) &&
    isNonNegativeInteger(value.scoreAwarded) &&
    isRecordOfPlayerScores(value.scoreByPlayerId) &&
    (value.nextStartingPlayerId === null ||
      isPlayerId(value.nextStartingPlayerId))
  );
};

const isGameEndedEvent = (value: unknown): value is GameEndedEvent => {
  if (!hasBaseEventShape(value) || value.type !== "GAME_ENDED") {
    return false;
  }

  return (
    isRoundId(value.roundId) &&
    isPlayerId(value.winnerPlayerId) &&
    isOneOf(value.reason, ["target_score_reached", "forfeit"] as const) &&
    isRecordOfPlayerScores(value.finalScoreByPlayerId)
  );
};

const isForfeitEvent = (value: unknown): value is ForfeitEvent => {
  if (!hasBaseEventShape(value) || value.type !== "FORFEIT") {
    return false;
  }

  return (
    isPlayerId(value.forfeitingPlayerId) &&
    isPlayerId(value.awardedToPlayerId) &&
    isOneOf(value.reason, ["expired", "resigned"] as const) &&
    (value.roundId === null || isRoundId(value.roundId))
  );
};

export const isGameEvent = (value: unknown): value is GameEvent =>
  isGameStartedEvent(value) ||
  isTilePlayedEvent(value) ||
  isTileDrawnEvent(value) ||
  isTurnPassedEvent(value) ||
  isRoundEndedEvent(value) ||
  isGameEndedEvent(value) ||
  isForfeitEvent(value);

export const assertGameEvent = (value: unknown): asserts value is GameEvent => {
  if (!isGameEvent(value)) {
    throw new Error("Invalid game event payload.");
  }
};

export const parseGameEvent = (value: unknown): GameEvent => {
  assertGameEvent(value);
  return value;
};

export const parseGameEvents = (value: unknown): readonly GameEvent[] => {
  if (!Array.isArray(value)) {
    throw new Error("Expected an array of game events.");
  }

  return value.map(parseGameEvent);
};
