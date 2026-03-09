import type {
  BoneyardState,
  BoardState,
  GameParticipants,
  GameState,
  PlayerHandState,
  PlayerMatchState,
  PlayerProfile,
  PlayerId,
  ReconstructionState,
  RoundResult,
  RoundState,
  Tile,
  TileId,
  TileInstance,
  TurnState,
} from "./types";
import type {
  ForfeitEvent,
  GameEndedEvent,
  GameEvent,
  GameStartedEvent,
  RoundEndedEvent,
  TileDrawnEvent,
  TilePlayedEvent,
  TurnPassedEvent,
} from "./events/schema";

type ReconstructionAccumulator = {
  game: GameState | null;
  tileCatalog: Record<TileId, Tile>;
  tileInstances: Record<TileId, TileInstance>;
  eventCount: number;
};

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const createEmptyBoardState = (): BoardState => ({
  layoutDirection: "horizontal",
  leftOpenPip: null,
  rightOpenPip: null,
  spinnerTileId: null,
  tiles: [],
});

const createPlayerHandState = (
  playerId: PlayerId,
  tileIds: readonly TileId[],
): PlayerHandState => ({
  playerId,
  tileIds: [...tileIds],
  handCount: tileIds.length,
  pipTotal: 0,
  hasPlayableTile: false,
});

const createPlayerMatchState = (
  playerId: PlayerId,
  hand: PlayerHandState,
): PlayerMatchState => ({
  playerId,
  score: 0,
  roundsWon: 0,
  isConnected: false,
  hand,
});

const createBoneyardState = (tileIds: readonly TileId[]): BoneyardState => ({
  remainingTileIds: [...tileIds],
  remainingCount: tileIds.length,
});

const clonePlayerProfile = (player: PlayerProfile): PlayerProfile => ({
  playerId: player.playerId,
  position: player.position,
  displayName: player.displayName,
});

const switchActivePlayer = (
  players: GameParticipants,
  activePlayerId: PlayerId,
): PlayerId =>
  players[0].playerId === activePlayerId ? players[1].playerId : players[0].playerId;

const updateHandState = (
  hand: PlayerHandState,
  tileIds: readonly TileId[],
): PlayerHandState => ({
  ...hand,
  tileIds: [...tileIds],
  handCount: tileIds.length,
  pipTotal: 0,
  hasPlayableTile: false,
});

const createInitialRoundState = (
  event: GameStartedEvent,
  players: GameParticipants,
): RoundState => {
  const handsByPlayerId = Object.fromEntries(
    players.map((player) => [
      player.playerId,
      createPlayerHandState(player.playerId, event.handsByPlayerId[player.playerId] ?? []),
    ]),
  ) as Record<PlayerId, PlayerHandState>;

  return {
    roundId: event.roundId,
    roundNumber: event.roundNumber,
    status: "active",
    board: createEmptyBoardState(),
    boneyard: createBoneyardState(event.boneyardTileIds),
    handsByPlayerId,
    result: null,
    startedAt: event.occurredAt,
    endedAt: null,
  };
};

const createInitialGameState = (event: GameStartedEvent): GameState => {
  const players: GameParticipants = [
    clonePlayerProfile(event.players[0]),
    clonePlayerProfile(event.players[1]),
  ];
  const currentRound = createInitialRoundState(event, players);
  const playerStateById = Object.fromEntries(
    players.map((player) => [
      player.playerId,
      createPlayerMatchState(player.playerId, currentRound.handsByPlayerId[player.playerId]),
    ]),
  ) as Record<PlayerId, PlayerMatchState>;

  return {
    gameId: event.gameId,
    status: "active",
    metadata: {
      createdAt: event.occurredAt,
      createdBy: event.createdBy,
      lastEventAt: event.occurredAt,
      lastEventSeq: event.eventSeq,
      expiresAt: null,
      variant: event.variant,
      targetScore: event.targetScore,
    },
    players,
    playerStateById,
    currentRound,
    turn: {
      activePlayerId: event.startingPlayerId,
      turnNumber: 1,
      consecutivePasses: 0,
      lastActionAt: event.occurredAt,
    },
    winnerPlayerId: null,
  };
};

const createTileCatalog = (tileCatalog: readonly Tile[]): Record<TileId, Tile> =>
  Object.fromEntries(tileCatalog.map((tile) => [tile.id, tile])) as Record<TileId, Tile>;

const createInitialTileInstances = (
  event: GameStartedEvent,
): Record<TileId, TileInstance> => {
  const byTileId: Record<TileId, TileInstance> = {} as Record<TileId, TileInstance>;

  for (const tile of event.tileCatalog) {
    byTileId[tile.id] = {
      tile,
      ownerPlayerId: null,
      location: { kind: "boneyard" },
      isPlayable: false,
    };
  }

  for (const [playerId, tileIds] of Object.entries(event.handsByPlayerId) as [
    PlayerId,
    readonly TileId[],
  ][]) {
    for (const tileId of tileIds) {
      const existing = byTileId[tileId];

      if (!existing) {
        continue;
      }

      byTileId[tileId] = {
        ...existing,
        ownerPlayerId: playerId,
        location: { kind: "hand", playerId },
      };
    }
  }

  return byTileId;
};

const updateMetadata = (game: GameState, event: GameEvent): GameState => ({
  ...game,
  metadata: {
    ...game.metadata,
    lastEventAt: event.occurredAt,
    lastEventSeq: event.eventSeq,
  },
});

const assertGameInitialized = (
  game: GameState | null,
  event: GameEvent,
): GameState => {
  if (game === null) {
    throw new Error(`Cannot apply ${event.type} before GAME_STARTED.`);
  }

  return game;
};

const assertRoundActive = (
  game: GameState,
  event: GameEvent,
): RoundState => {
  if (game.currentRound === null) {
    throw new Error(`Cannot apply ${event.type} without an active round.`);
  }

  return game.currentRound;
};

const applyTilePlayedEvent = (
  game: GameState,
  tileInstances: Record<TileId, TileInstance>,
  event: TilePlayedEvent,
): { game: GameState; tileInstances: Record<TileId, TileInstance> } => {
  const currentRound = assertRoundActive(game, event);
  const tileInstance = tileInstances[event.tileId];

  if (!tileInstance) {
    throw new Error(`Unknown tile ${event.tileId} in TILE_PLAYED.`);
  }

  const activeHand = currentRound.handsByPlayerId[event.playerId];

  if (!activeHand) {
    throw new Error(`Unknown player ${event.playerId} in TILE_PLAYED.`);
  }

  const nextHandTileIds = activeHand.tileIds.filter((tileId) => tileId !== event.tileId);
  const playedTile = {
    tile: tileInstance.tile,
    playedBy: event.playerId,
    placedAtSeq: event.eventSeq,
    side: event.side,
    openPipFacingOutward: event.openPipFacingOutward,
  } as const;
  const boardTiles =
    event.side === "left"
      ? [playedTile, ...currentRound.board.tiles]
      : [...currentRound.board.tiles, playedTile];
  const board =
    boardTiles.length === 1
      ? {
          ...currentRound.board,
          leftOpenPip: event.openPipFacingOutward,
          rightOpenPip: event.openPipFacingOutward,
          spinnerTileId:
            tileInstance.tile.sideA === tileInstance.tile.sideB ? tileInstance.tile.id : null,
          tiles: boardTiles,
        }
      : {
          ...currentRound.board,
          leftOpenPip:
            event.side === "left"
              ? event.openPipFacingOutward
              : currentRound.board.leftOpenPip,
          rightOpenPip:
            event.side === "right"
              ? event.openPipFacingOutward
              : currentRound.board.rightOpenPip,
          tiles: boardTiles,
        };
  const handsByPlayerId: Record<PlayerId, PlayerHandState> = {
    ...currentRound.handsByPlayerId,
    [event.playerId]: updateHandState(activeHand, nextHandTileIds),
  };
  const nextTurn: TurnState | null = game.turn
    ? {
        activePlayerId: switchActivePlayer(game.players, event.playerId),
        turnNumber: game.turn.turnNumber + 1,
        consecutivePasses: 0,
        lastActionAt: event.occurredAt,
      }
    : null;

  return {
    game: {
      ...game,
      currentRound: {
        ...currentRound,
        board,
        handsByPlayerId,
      },
      playerStateById: {
        ...game.playerStateById,
        [event.playerId]: {
          ...game.playerStateById[event.playerId],
          hand: handsByPlayerId[event.playerId],
        },
      },
      turn: nextTurn,
    },
    tileInstances: {
      ...tileInstances,
      [event.tileId]: {
        ...tileInstance,
        ownerPlayerId: null,
        location: {
          kind: "board",
          side: event.side,
          order: boardTiles.length - 1,
        },
      },
    },
  };
};

const applyTileDrawnEvent = (
  game: GameState,
  tileInstances: Record<TileId, TileInstance>,
  event: TileDrawnEvent,
): { game: GameState; tileInstances: Record<TileId, TileInstance> } => {
  const currentRound = assertRoundActive(game, event);
  const tileInstance = tileInstances[event.tileId];

  if (!tileInstance) {
    throw new Error(`Unknown tile ${event.tileId} in TILE_DRAWN.`);
  }

  const activeHand = currentRound.handsByPlayerId[event.playerId];

  if (!activeHand) {
    throw new Error(`Unknown player ${event.playerId} in TILE_DRAWN.`);
  }

  const nextHandTileIds = [...activeHand.tileIds, event.tileId];
  const nextHand = updateHandState(activeHand, nextHandTileIds);

  const handsByPlayerId: Record<PlayerId, PlayerHandState> = {
    ...currentRound.handsByPlayerId,
    [event.playerId]: nextHand,
  };

  return {
    game: {
      ...game,
      currentRound: {
        ...currentRound,
        boneyard: createBoneyardState(
          currentRound.boneyard.remainingTileIds.filter((tileId) => tileId !== event.tileId),
        ),
        handsByPlayerId,
      },
      playerStateById: {
        ...game.playerStateById,
        [event.playerId]: {
          ...game.playerStateById[event.playerId],
          hand: nextHand,
        },
      },
      turn: game.turn
        ? {
            ...game.turn,
            lastActionAt: event.occurredAt,
          }
        : null,
    },
    tileInstances: {
      ...tileInstances,
      [event.tileId]: {
        ...tileInstance,
        ownerPlayerId: event.playerId,
        location: { kind: "hand", playerId: event.playerId },
      },
    },
  };
};

const applyTurnPassedEvent = (
  game: GameState,
  event: TurnPassedEvent,
): GameState => ({
  ...game,
  turn: game.turn
    ? {
        activePlayerId: switchActivePlayer(game.players, event.playerId),
        turnNumber: game.turn.turnNumber + 1,
        consecutivePasses: game.turn.consecutivePasses + 1,
        lastActionAt: event.occurredAt,
      }
    : null,
});

const applyRoundEndedEvent = (
  game: GameState,
  event: RoundEndedEvent,
): GameState => {
  const currentRound = assertRoundActive(game, event);
  const nextPlayerStateById: Record<PlayerId, PlayerMatchState> = {
    ...game.playerStateById,
  };

  for (const player of game.players) {
    const score = event.scoreByPlayerId[player.playerId];

    if (typeof score !== "number") {
      continue;
    }

    nextPlayerStateById[player.playerId] = {
      ...nextPlayerStateById[player.playerId],
      score,
      roundsWon:
        event.winnerPlayerId === player.playerId
          ? nextPlayerStateById[player.playerId].roundsWon + 1
          : nextPlayerStateById[player.playerId].roundsWon,
    };
  }

  const result: RoundResult = {
    winnerPlayerId: event.winnerPlayerId,
    reason: event.reason,
    scoreAwarded: event.scoreAwarded,
  };

  return {
    ...game,
    playerStateById: nextPlayerStateById,
    currentRound: {
      ...currentRound,
      status: event.reason === "blocked" ? "blocked" : "completed",
      result,
      endedAt: event.occurredAt,
    },
    turn: null,
  };
};

const applyGameEndedEvent = (
  game: GameState,
  event: GameEndedEvent,
): GameState => {
  const nextPlayerStateById: Record<PlayerId, PlayerMatchState> = {
    ...game.playerStateById,
  };

  for (const player of game.players) {
    const score = event.finalScoreByPlayerId[player.playerId];

    if (typeof score !== "number") {
      continue;
    }

    nextPlayerStateById[player.playerId] = {
      ...nextPlayerStateById[player.playerId],
      score,
    };
  }

  return {
    ...game,
    status: "completed",
    playerStateById: nextPlayerStateById,
    winnerPlayerId: event.winnerPlayerId,
    turn: null,
  };
};

const applyForfeitEvent = (
  game: GameState,
  event: ForfeitEvent,
): GameState => ({
  ...game,
  status: "forfeited",
  winnerPlayerId: event.awardedToPlayerId,
  currentRound:
    game.currentRound === null
      ? null
      : {
          ...game.currentRound,
          status: "completed",
          result: {
            winnerPlayerId: event.awardedToPlayerId,
            reason: "forfeit",
            scoreAwarded: 0,
          },
          endedAt: event.occurredAt,
        },
  turn: null,
});

const applyGameEvent = (
  accumulator: ReconstructionAccumulator,
  event: GameEvent,
): ReconstructionAccumulator => {
  if (accumulator.game !== null && accumulator.game.gameId !== event.gameId) {
    throw new Error("All events must belong to the same game.");
  }

  if (
    accumulator.game !== null &&
    event.eventSeq <= accumulator.game.metadata.lastEventSeq
  ) {
    throw new Error("Events must be applied in strictly increasing event_seq order.");
  }

  if (event.type === "GAME_STARTED") {
    const game = createInitialGameState(event);

    return {
      game,
      tileCatalog: createTileCatalog(event.tileCatalog),
      tileInstances: createInitialTileInstances(event),
      eventCount: accumulator.eventCount + 1,
    };
  }

  const initializedGame = assertGameInitialized(accumulator.game, event);
  let nextGame = initializedGame;
  let nextTileInstances = accumulator.tileInstances;

  switch (event.type) {
    case "TILE_PLAYED": {
      const result = applyTilePlayedEvent(
        initializedGame,
        accumulator.tileInstances,
        event,
      );
      nextGame = result.game;
      nextTileInstances = result.tileInstances;
      break;
    }
    case "TILE_DRAWN": {
      const result = applyTileDrawnEvent(
        initializedGame,
        accumulator.tileInstances,
        event,
      );
      nextGame = result.game;
      nextTileInstances = result.tileInstances;
      break;
    }
    case "TURN_PASSED":
      nextGame = applyTurnPassedEvent(initializedGame, event);
      break;
    case "ROUND_ENDED":
      nextGame = applyRoundEndedEvent(initializedGame, event);
      break;
    case "GAME_ENDED":
      nextGame = applyGameEndedEvent(initializedGame, event);
      break;
    case "FORFEIT":
      nextGame = applyForfeitEvent(initializedGame, event);
      break;
  }

  return {
    game: updateMetadata(nextGame, event),
    tileCatalog: accumulator.tileCatalog,
    tileInstances: nextTileInstances,
    eventCount: accumulator.eventCount + 1,
  };
};

const toStableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => toStableValue(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    );

    return Object.fromEntries(
      entries.map(([key, nestedValue]) => [key, toStableValue(nestedValue)]),
    );
  }

  return value;
};

const stableStringify = (value: unknown): string =>
  JSON.stringify(toStableValue(value));

const fnv1a = (value: string): string => {
  let hash = FNV_OFFSET_BASIS;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const reconstructGameState = (
  events: readonly GameEvent[],
): ReconstructionState =>
  events.reduce<ReconstructionAccumulator>(
    (accumulator, event) => applyGameEvent(accumulator, event),
    {
      game: null,
      tileCatalog: {},
      tileInstances: {},
      eventCount: 0,
    },
  );

export const getReconstructionStateHash = (
  state: ReconstructionState,
): string => fnv1a(stableStringify(state));

export const getReconstructionHashFromEvents = (
  events: readonly GameEvent[],
): string => getReconstructionStateHash(reconstructGameState(events));
