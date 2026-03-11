import type {
  ForfeitEvent,
  GameEndedEvent,
  GameEvent,
  GameStartedEvent,
  RoundEndedEvent,
  RoundStartedEvent,
  TileDrawnEvent,
  TilePlayedEvent,
  TurnPassedEvent,
} from "./events/schema";
import type {
  BoardOpenEnd,
  BoardState,
  BoneyardState,
  GameParticipants,
  GameState,
  PlayerHandState,
  PlayerId,
  PlayerMatchState,
  PlayerProfile,
  ReconstructionState,
  RoundResult,
  RoundState,
  Tile,
  TileId,
  TileInstance,
  TurnState,
} from "./types";
import {
  calculateFivesBoardScore,
  calculateHandPipTotal,
  evaluateFivesLegalMoves,
  validateFivesRoundEndedEvent,
} from "./variants/fives";

type ReconstructionAccumulator = {
  game: GameState | null;
  tileCatalog: Record<TileId, Tile>;
  tileInstances: Record<TileId, TileInstance>;
  eventCount: number;
};

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const CHAIN_SIDE_ORDER: readonly TilePlayedEvent["side"][] = [
  "left",
  "right",
  "up",
  "down",
];

const createEmptyBoardState = (): BoardState => ({
  layoutDirection: "horizontal",
  spinnerTileId: null,
  openEnds: [],
  tiles: [],
});

const createPlayerHandState = (
  playerId: PlayerId,
  tileIds: readonly TileId[],
  tileCatalog: Record<TileId, Tile>,
): PlayerHandState => ({
  playerId,
  tileIds: [...tileIds],
  handCount: tileIds.length,
  pipTotal: calculateHandPipTotal({ tileIds } as PlayerHandState, tileCatalog),
  hasPlayableTile: false,
});

const createPlayerMatchState = (
  playerId: PlayerId,
  hand: PlayerHandState,
): PlayerMatchState => ({
  playerId,
  score: 0,
  roundsWon: 0,
  isConnected: true, // Default to connected if they are in the match
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

const sortOpenEnds = (
  openEnds: readonly BoardOpenEnd[],
): readonly BoardOpenEnd[] =>
  [...openEnds].sort(
    (left, right) =>
      CHAIN_SIDE_ORDER.indexOf(left.side) -
      CHAIN_SIDE_ORDER.indexOf(right.side),
  );

const createSpinnerOpenEnds = (
  tileId: TileId,
  pip: Tile["sideA"],
): readonly BoardOpenEnd[] =>
  sortOpenEnds(
    CHAIN_SIDE_ORDER.map((side) => ({
      side,
      pip,
      tileId,
    })),
  );

const getInitialOpenEndsForTile = (
  tile: Tile,
  side: TilePlayedEvent["side"],
  openPipFacingOutward: TilePlayedEvent["openPipFacingOutward"],
): readonly BoardOpenEnd[] => {
  if (tile.sideA === tile.sideB) {
    return createSpinnerOpenEnds(tile.id, openPipFacingOutward);
  }

  const inwardFacingPip =
    tile.sideA === openPipFacingOutward ? tile.sideB : tile.sideA;

  return sortOpenEnds([
    {
      side,
      pip: openPipFacingOutward,
      tileId: tile.id,
    },
    {
      side: side === "left" ? "right" : "left",
      pip: inwardFacingPip,
      tileId: tile.id,
    },
  ]);
};

const upsertOpenEnd = (
  openEnds: readonly BoardOpenEnd[],
  nextOpenEnd: BoardOpenEnd,
): readonly BoardOpenEnd[] => {
  const existingIndex = openEnds.findIndex(
    (openEnd) => openEnd.side === nextOpenEnd.side,
  );

  if (existingIndex === -1) {
    return sortOpenEnds([...openEnds, nextOpenEnd]);
  }

  return sortOpenEnds(
    openEnds.map((openEnd, index) =>
      index === existingIndex ? nextOpenEnd : openEnd,
    ),
  );
};

const getBoardOrder = (
  board: BoardState,
  side: TilePlayedEvent["side"],
): number => board.tiles.filter((tile) => tile.side === side).length;

const switchActivePlayer = (
  players: GameParticipants,
  activePlayerId: PlayerId,
): PlayerId =>
  players[0].playerId === activePlayerId
    ? players[1].playerId
    : players[0].playerId;

const updateHandState = (
  hand: PlayerHandState,
  tileIds: readonly TileId[],
  tileCatalog: Record<TileId, Tile>,
): PlayerHandState => ({
  ...hand,
  tileIds: [...tileIds],
  handCount: tileIds.length,
  pipTotal: calculateHandPipTotal({ tileIds } as PlayerHandState, tileCatalog),
  hasPlayableTile: false, // will be updated in enrichDerivedState
});

const createInitialRoundState = (
  event: RoundStartedEvent,
  players: GameParticipants,
  tileCatalog: Record<TileId, Tile>,
): RoundState => {
  const handsByPlayerId = Object.fromEntries(
    players.map((player) => [
      player.playerId,
      createPlayerHandState(
        player.playerId,
        event.handsByPlayerId[player.playerId] ?? [],
        tileCatalog,
      ),
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
  const tileCatalog = createTileCatalog(event.tileCatalog);
  const playerStateById = Object.fromEntries(
    players.map((player) => [
      player.playerId,
      createPlayerMatchState(
        player.playerId,
        createPlayerHandState(player.playerId, [], tileCatalog),
      ),
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
    currentRound: null,
    turn: null,
    winnerPlayerId: null,
  };
};

const createTileCatalog = (
  tileCatalog: readonly Tile[],
): Record<TileId, Tile> =>
  Object.fromEntries(tileCatalog.map((tile) => [tile.id, tile])) as Record<
    TileId,
    Tile
  >;

const createInitialTileInstances = (
  event: GameStartedEvent,
): Record<TileId, TileInstance> => {
  const byTileId: Record<TileId, TileInstance> = {} as Record<
    TileId,
    TileInstance
  >;

  for (const tile of event.tileCatalog) {
    byTileId[tile.id] = {
      tile,
      ownerPlayerId: null,
      location: { kind: "boneyard" },
      isPlayable: false,
    };
  }
  return byTileId;
};

const createTileInstancesForRound = (
  tileCatalog: Record<TileId, Tile>,
  event: RoundStartedEvent,
): Record<TileId, TileInstance> => {
  const byTileId: Record<TileId, TileInstance> = {} as Record<
    TileId,
    TileInstance
  >;

  for (const tile of Object.values(tileCatalog)) {
    byTileId[tile.id] = {
      tile,
      ownerPlayerId: null,
      location: { kind: "boneyard" },
      isPlayable: false,
    };
  }

  for (const tileId of event.boneyardTileIds) {
    const existing = byTileId[tileId];

    if (!existing) {
      continue;
    }

    byTileId[tileId] = {
      ...existing,
      location: { kind: "boneyard" },
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

const assertRoundActive = (game: GameState, event: GameEvent): RoundState => {
  if (game.currentRound === null) {
    throw new Error(`Cannot apply ${event.type} without an active round.`);
  }

  return game.currentRound;
};

const applyRoundStartedEvent = (
  game: GameState,
  event: RoundStartedEvent,
  tileCatalog: Record<TileId, Tile>,
): GameState => {
  if (game.status !== "active") {
    throw new Error("Cannot apply ROUND_STARTED after the game has ended.");
  }

  if (game.currentRound !== null && game.currentRound.endedAt === null) {
    throw new Error(
      "Cannot apply ROUND_STARTED while another round is still active.",
    );
  }

  const currentRound = createInitialRoundState(
    event,
    game.players,
    tileCatalog,
  );
  const playerStateById = Object.fromEntries(
    game.players.map((player) => [
      player.playerId,
      {
        ...game.playerStateById[player.playerId],
        hand: currentRound.handsByPlayerId[player.playerId],
      },
    ]),
  ) as Record<PlayerId, PlayerMatchState>;

  return {
    ...game,
    currentRound,
    playerStateById,
    turn: {
      activePlayerId: event.startingPlayerId,
      turnNumber: 1,
      consecutivePasses: 0,
      lastActionAt: event.occurredAt,
    },
    winnerPlayerId: null,
  };
};

const applyTilePlayedEvent = (
  game: GameState,
  tileInstances: Record<TileId, TileInstance>,
  tileCatalog: Record<TileId, Tile>,
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

  const nextHandTileIds = activeHand.tileIds.filter(
    (tileId) => tileId !== event.tileId,
  );
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
          spinnerTileId:
            tileInstance.tile.sideA === tileInstance.tile.sideB
              ? tileInstance.tile.id
              : null,
          openEnds: getInitialOpenEndsForTile(
            tileInstance.tile,
            event.side,
            event.openPipFacingOutward,
          ),
          tiles: boardTiles,
        }
      : {
          ...currentRound.board,
          openEnds: upsertOpenEnd(currentRound.board.openEnds, {
            side: event.side,
            pip: event.openPipFacingOutward,
            tileId: tileInstance.tile.id,
          }),
          tiles: boardTiles,
        };
  const boardOrder = getBoardOrder(currentRound.board, event.side);
  // Calculate scoring if variant is Fives
  let nextScore = game.playerStateById[event.playerId].score;
  if (game.metadata.variant === "fives") {
    const boardScore = calculateFivesBoardScore(board);
    nextScore += boardScore;
  }

  const handsByPlayerId: Record<PlayerId, PlayerHandState> = {
    ...currentRound.handsByPlayerId,
    [event.playerId]: updateHandState(activeHand, nextHandTileIds, tileCatalog),
  };
  const nextTurn: TurnState | null = game.turn
    ? {
        activePlayerId: switchActivePlayer(game.players, event.playerId),
        turnNumber: game.turn.turnNumber + 1,
        consecutivePasses: 0,
        lastActionAt: event.occurredAt,
      }
    : null;

  const nextGame: GameState = {
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
        score: nextScore,
      },
    },
    turn: nextTurn,
  };

  return {
    game: nextGame,
    tileInstances: {
      ...tileInstances,
      [event.tileId]: {
        ...tileInstance,
        ownerPlayerId: null,
        location: {
          kind: "board",
          side: event.side,
          order: boardOrder,
        },
      },
    },
  };
};

const applyTileDrawnEvent = (
  game: GameState,
  tileInstances: Record<TileId, TileInstance>,
  tileCatalog: Record<TileId, Tile>,
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
  const nextHand = updateHandState(activeHand, nextHandTileIds, tileCatalog);

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
          currentRound.boneyard.remainingTileIds.filter(
            (tileId) => tileId !== event.tileId,
          ),
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
  tileCatalog: Record<TileId, Tile>,
  event: RoundEndedEvent,
): GameState => {
  const currentRound = assertRoundActive(game, event);
  if (game.metadata.variant === "fives") {
    const validation = validateFivesRoundEndedEvent({
      game,
      event,
      tileCatalog,
    });

    if (!validation.ok) {
      throw new Error(validation.message);
    }
  }

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
  const result = applyGameEventInternal(accumulator, event);

  // Update playability hints and other derived state (like hasPlayableTile)
  if (result.game) {
    const enriched = enrichDerivedState(
      result.game,
      result.tileInstances,
      result.tileCatalog,
    );
    result.game = enriched.game;
    result.tileInstances = enriched.tileInstances;
  }

  return {
    ...result,
    game: result.game ? updateMetadata(result.game, event) : null,
    eventCount: accumulator.eventCount + 1,
  };
};

const enrichDerivedState = (
  game: GameState,
  tileInstances: Record<TileId, TileInstance>,
  tileCatalog: Record<TileId, Tile>,
): { game: GameState; tileInstances: Record<TileId, TileInstance> } => {
  // 1. Reset all tiles to not playable initially
  const nextInstances = { ...tileInstances };
  for (const tileId of Object.keys(nextInstances) as TileId[]) {
    nextInstances[tileId] = {
      ...nextInstances[tileId],
      isPlayable: false,
    };
  }

  // Helper to update hasPlayableTile field on all players' hands in the game/round state
  const resetHasPlayableTile = (gameState: GameState): GameState => {
    const nextPlayerStateById = { ...gameState.playerStateById };
    for (const pid of Object.keys(nextPlayerStateById) as PlayerId[]) {
      nextPlayerStateById[pid] = {
        ...nextPlayerStateById[pid],
        hand: { ...nextPlayerStateById[pid].hand, hasPlayableTile: false },
      };
    }

    let nextRound = gameState.currentRound;
    if (nextRound) {
      const nextHandsByPlayerId = { ...nextRound.handsByPlayerId };
      for (const pid of Object.keys(nextHandsByPlayerId) as PlayerId[]) {
        nextHandsByPlayerId[pid] = {
          ...nextHandsByPlayerId[pid],
          hasPlayableTile: false,
        };
      }
      nextRound = { ...nextRound, handsByPlayerId: nextHandsByPlayerId };
    }

    return {
      ...gameState,
      playerStateById: nextPlayerStateById,
      currentRound: nextRound,
    };
  };

  let nextGame = resetHasPlayableTile(game);

  if (!game.turn || !game.currentRound || game.status !== "active") {
    return { game: nextGame, tileInstances: nextInstances };
  }

  const activePlayerId = game.turn.activePlayerId;
  const activeHand = game.currentRound.handsByPlayerId[activePlayerId];

  if (!activeHand) return { game: nextGame, tileInstances: nextInstances };

  const legalMoves = evaluateFivesLegalMoves({
    board: game.currentRound.board,
    handTileIds: activeHand.tileIds,
    tileCatalog,
    isOpeningMove: game.currentRound.board.tiles.length === 0,
  });

  const playableTileIds = new Set(legalMoves.moves.map((m) => m.tileId));

  // Update tile instances isPlayable
  for (const tileId of Object.keys(nextInstances) as TileId[]) {
    nextInstances[tileId] = {
      ...nextInstances[tileId],
      isPlayable: playableTileIds.has(tileId),
    };
  }

  // Update hand hasPlayableTile if there are moves
  if (playableTileIds.size > 0) {
    const nextPlayerStateById = { ...nextGame.playerStateById };
    nextPlayerStateById[activePlayerId] = {
      ...nextPlayerStateById[activePlayerId],
      hand: {
        ...nextPlayerStateById[activePlayerId].hand,
        hasPlayableTile: true,
      },
    };

    if (nextGame.currentRound) {
      const nextHandsByPlayerId = { ...nextGame.currentRound.handsByPlayerId };
      nextHandsByPlayerId[activePlayerId] = {
        ...nextHandsByPlayerId[activePlayerId],
        hasPlayableTile: true,
      };
      nextGame = {
        ...nextGame,
        playerStateById: nextPlayerStateById,
        currentRound: {
          ...nextGame.currentRound,
          handsByPlayerId: nextHandsByPlayerId,
        },
      };
    } else {
      nextGame = { ...nextGame, playerStateById: nextPlayerStateById };
    }
  }

  return { game: nextGame, tileInstances: nextInstances };
};

const applyGameEventInternal = (
  accumulator: ReconstructionAccumulator,
  event: GameEvent,
): {
  game: GameState | null;
  tileCatalog: Record<TileId, Tile>;
  tileInstances: Record<TileId, TileInstance>;
} => {
  if (accumulator.game !== null && accumulator.game.gameId !== event.gameId) {
    throw new Error("All events must belong to the same game.");
  }

  if (
    accumulator.game !== null &&
    event.eventSeq <= accumulator.game.metadata.lastEventSeq
  ) {
    throw new Error(
      "Events must be applied in strictly increasing event_seq order.",
    );
  }

  if (event.type === "GAME_STARTED") {
    if (accumulator.game !== null) {
      throw new Error(
        "Cannot apply multiple GAME_STARTED events to the same game.",
      );
    }

    const game = createInitialGameState(event);

    return {
      game,
      tileCatalog: createTileCatalog(event.tileCatalog),
      tileInstances: createInitialTileInstances(event),
    };
  }

  const initializedGame = assertGameInitialized(accumulator.game, event);
  let nextGame = initializedGame;
  let nextTileInstances = accumulator.tileInstances;

  switch (event.type) {
    case "ROUND_STARTED":
      nextGame = applyRoundStartedEvent(
        initializedGame,
        event,
        accumulator.tileCatalog,
      );
      nextTileInstances = createTileInstancesForRound(
        accumulator.tileCatalog,
        event,
      );
      break;
    case "TILE_PLAYED": {
      const result = applyTilePlayedEvent(
        initializedGame,
        accumulator.tileInstances,
        accumulator.tileCatalog,
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
        accumulator.tileCatalog,
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
      nextGame = applyRoundEndedEvent(
        initializedGame,
        accumulator.tileCatalog,
        event,
      );
      break;
    case "GAME_ENDED":
      nextGame = applyGameEndedEvent(initializedGame, event);
      break;
    case "FORFEIT":
      nextGame = applyForfeitEvent(initializedGame, event);
      break;
  }

  return {
    game: nextGame,
    tileCatalog: accumulator.tileCatalog,
    tileInstances: nextTileInstances,
  };
};

const toStableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => toStableValue(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
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
