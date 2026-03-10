export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type GameId = Brand<string, "GameId">;
export type PlayerId = Brand<string, "PlayerId">;
export type TileId = Brand<string, "TileId">;
export type RoundId = Brand<string, "RoundId">;
export type EventId = Brand<string, "EventId">;
export type MoveIntentIdempotencyKey = Brand<string, "MoveIntentIdempotencyKey">;
export type MoveIntentAnchorId = Brand<string, "MoveIntentAnchorId">;

export type DominoPip = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PlayerPosition = "player_1" | "player_2";
export type GameVariant = "fives";
export type GameStatus = "pending" | "active" | "completed" | "forfeited";
export type RoundStatus = "setup" | "active" | "blocked" | "completed";
export type ChainSide = "left" | "right" | "up" | "down";
export type TileSide = "sideA" | "sideB";

export type Tile = Readonly<{
  id: TileId;
  sideA: DominoPip;
  sideB: DominoPip;
}>;

export type TileInstance = Readonly<{
  tile: Tile;
  ownerPlayerId: PlayerId | null;
  location: TileLocation;
  isPlayable: boolean;
}>;

export type TileLocation =
  | Readonly<{ kind: "boneyard" }>
  | Readonly<{ kind: "hand"; playerId: PlayerId }>
  | Readonly<{ kind: "board"; side: ChainSide; order: number }>
  | Readonly<{ kind: "captured"; playerId: PlayerId }>;

export type PlayedTile = Readonly<{
  tile: Tile;
  playedBy: PlayerId;
  placedAtSeq: number;
  side: ChainSide;
  openPipFacingOutward: DominoPip;
}>;

export type BoardOpenEnd = Readonly<{
  side: ChainSide;
  pip: DominoPip;
  tileId: TileId | null;
}>;

export type BoardState = Readonly<{
  layoutDirection: "horizontal" | "vertical" | "wrapped";
  spinnerTileId: TileId | null;
  openEnds: readonly BoardOpenEnd[];
  tiles: readonly PlayedTile[];
}>;

export type PlayerProfile = Readonly<{
  playerId: PlayerId;
  position: PlayerPosition;
  displayName: string | null;
}>;

export type PlayerHandState = Readonly<{
  playerId: PlayerId;
  tileIds: readonly TileId[];
  handCount: number;
  pipTotal: number;
  hasPlayableTile: boolean;
}>;

export type PlayerMatchState = Readonly<{
  playerId: PlayerId;
  score: number;
  roundsWon: number;
  isConnected: boolean;
  hand: PlayerHandState;
}>;

export type TurnState = Readonly<{
  activePlayerId: PlayerId;
  turnNumber: number;
  consecutivePasses: number;
  lastActionAt: string;
}>;

export type BoneyardState = Readonly<{
  remainingTileIds: readonly TileId[];
  remainingCount: number;
}>;

export type RoundResult = Readonly<{
  winnerPlayerId: PlayerId | null;
  reason: "domino" | "blocked" | "forfeit" | null;
  scoreAwarded: number;
}>;

export type RoundState = Readonly<{
  roundId: RoundId;
  roundNumber: number;
  status: RoundStatus;
  board: BoardState;
  boneyard: BoneyardState;
  handsByPlayerId: Readonly<Record<PlayerId, PlayerHandState>>;
  result: RoundResult | null;
  startedAt: string;
  endedAt: string | null;
}>;

export type GameMetadata = Readonly<{
  createdAt: string;
  createdBy: PlayerId;
  lastEventAt: string;
  lastEventSeq: number;
  expiresAt: string | null;
  variant: GameVariant;
  targetScore: number;
}>;

export type GameParticipants = readonly [PlayerProfile, PlayerProfile];

export type GameState = Readonly<{
  gameId: GameId;
  status: GameStatus;
  metadata: GameMetadata;
  players: GameParticipants;
  playerStateById: Readonly<Record<PlayerId, PlayerMatchState>>;
  currentRound: RoundState | null;
  turn: TurnState | null;
  winnerPlayerId: PlayerId | null;
}>;

export type ReconstructionState = Readonly<{
  game: GameState | null;
  tileCatalog: Readonly<Record<TileId, Tile>>;
  tileInstances: Readonly<Record<TileId, TileInstance>>;
  eventCount: number;
}>;

export type ValidationContext = Readonly<{
  gameId: GameId;
  playerId: PlayerId;
  expectedEventSeq: number;
  reconstructed: ReconstructionState;
}>;

export type FivesSpinnerBranchState = "open" | "closed";

export type FivesSpinnerBranchStatus = Readonly<{
  left: FivesSpinnerBranchState;
  right: FivesSpinnerBranchState;
  up: FivesSpinnerBranchState;
  down: FivesSpinnerBranchState;
}>;

export type FivesLegalMove = Readonly<{
  tileId: TileId;
  side: ChainSide;
  inwardTileSide: TileSide;
  openPipFacingOutward: DominoPip;
}>;

export type FivesMoveSelection = Readonly<{
  tileId: TileId;
  side: ChainSide;
  openPipFacingOutward: DominoPip;
}>;

export type ValidationFailure<TCode extends string> = Readonly<{
  ok: false;
  code: TCode;
  message: string;
}>;

export type ValidationSuccess<TResult> = Readonly<{
  ok: true;
  value: TResult;
}>;

export type ValidationResult<TResult, TCode extends string> =
  | ValidationSuccess<TResult>
  | ValidationFailure<TCode>;

export type FivesMoveValidationErrorCode =
  | "round_not_active"
  | "tile_not_in_hand"
  | "tile_not_found"
  | "opening_double_required"
  | "no_legal_moves"
  | "illegal_side"
  | "illegal_orientation";
