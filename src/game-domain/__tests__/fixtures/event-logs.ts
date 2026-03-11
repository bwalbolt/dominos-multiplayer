import type { GameEvent } from "../../index";
import {
  buildFixtureEventLog,
  createForfeitStep,
  createGameStartedStep,
  createHandsByPlayerId,
  createRoundEndedStep,
  createRoundStartedStep,
  createScoreByPlayerId,
  createTilePlayedStep,
  createTurnPassedStep,
  FIXTURE_IDS,
  getFixtureTileId,
  getFixtureTileIds,
} from "./builders";

export const OPENING_EVENT_LOG = buildFixtureEventLog([
  createGameStartedStep(),
  createRoundStartedStep({
    handsByPlayerId: createHandsByPlayerId(
      getFixtureTileIds([6, 6], [0, 1], [2, 5], [3, 4], [0, 0], [1, 2], [4, 4]),
      getFixtureTileIds([5, 6], [1, 6], [2, 2], [0, 3], [1, 4], [3, 5], [0, 5]),
    ),
    boneyardTileIds: getFixtureTileIds(
      [0, 2],
      [0, 4],
      [0, 6],
      [1, 1],
      [1, 3],
      [1, 5],
      [2, 3],
      [2, 4],
      [2, 6],
      [3, 3],
      [3, 6],
      [4, 5],
      [4, 6],
      [5, 5],
    ),
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerOneId,
    tileId: getFixtureTileId(6, 6),
    side: "left",
    openPipFacingOutward: 6,
  }),
]);

export const SPINNER_EXPANSION_EVENT_LOG = buildFixtureEventLog([
  createGameStartedStep(),
  createRoundStartedStep({
    handsByPlayerId: createHandsByPlayerId(
      getFixtureTileIds([6, 6], [2, 6], [4, 6], [0, 0], [1, 1], [2, 2], [3, 3]),
      getFixtureTileIds([1, 6], [3, 6], [5, 6], [0, 5], [1, 4], [2, 5], [4, 5]),
    ),
    boneyardTileIds: getFixtureTileIds(
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 6],
      [1, 2],
      [1, 3],
      [1, 5],
      [2, 3],
      [2, 4],
      [3, 4],
      [3, 5],
      [4, 4],
      [5, 5],
    ),
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerOneId,
    tileId: getFixtureTileId(6, 6),
    side: "left",
    openPipFacingOutward: 6,
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerTwoId,
    tileId: getFixtureTileId(1, 6),
    side: "right",
    openPipFacingOutward: 1,
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerOneId,
    tileId: getFixtureTileId(2, 6),
    side: "left",
    openPipFacingOutward: 2,
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerTwoId,
    tileId: getFixtureTileId(3, 6),
    side: "up",
    openPipFacingOutward: 3,
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerOneId,
    tileId: getFixtureTileId(4, 6),
    side: "down",
    openPipFacingOutward: 4,
  }),
]);

export const BLOCKED_ROUND_EVENT_LOG = buildFixtureEventLog([
  createGameStartedStep(),
  createRoundStartedStep({
    handsByPlayerId: createHandsByPlayerId(
      getFixtureTileIds([1, 1], [4, 4]),
      getFixtureTileIds([1, 3], [5, 5]),
    ),
    boneyardTileIds: [],
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerOneId,
    tileId: getFixtureTileId(1, 1),
    side: "left",
    openPipFacingOutward: 1,
  }),
  createTilePlayedStep({
    playerId: FIXTURE_IDS.playerTwoId,
    tileId: getFixtureTileId(1, 3),
    side: "right",
    openPipFacingOutward: 3,
  }),
  createTurnPassedStep({
    playerId: FIXTURE_IDS.playerOneId,
    reason: "boneyard_empty",
  }),
  createTurnPassedStep({
    playerId: FIXTURE_IDS.playerTwoId,
    reason: "boneyard_empty",
  }),
  createRoundEndedStep({
    winnerPlayerId: FIXTURE_IDS.playerOneId,
    reason: "blocked",
    scoreAwarded: 0,
    scoreByPlayerId: createScoreByPlayerId(0, 0),
    nextStartingPlayerId: FIXTURE_IDS.playerOneId,
  }),
]);

export const EXPIRATION_FORFEIT_EVENT_LOG = buildFixtureEventLog(
  [
    createGameStartedStep(),
    createRoundStartedStep({
      handsByPlayerId: createHandsByPlayerId(
        getFixtureTileIds([6, 6], [2, 5], [0, 1], [0, 2], [1, 2], [1, 3], [4, 4]),
        getFixtureTileIds([5, 6], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4], [5, 5]),
      ),
      boneyardTileIds: getFixtureTileIds(
        [0, 0],
        [0, 5],
        [0, 6],
        [1, 1],
        [1, 5],
        [1, 6],
        [2, 2],
        [2, 3],
        [2, 6],
        [3, 3],
        [3, 5],
        [3, 6],
        [4, 5],
        [4, 6],
      ),
    }),
    createTilePlayedStep({
      playerId: FIXTURE_IDS.playerOneId,
      tileId: getFixtureTileId(6, 6),
      side: "left",
      openPipFacingOutward: 6,
    }),
    createForfeitStep({
      forfeitingPlayerId: FIXTURE_IDS.playerTwoId,
      awardedToPlayerId: FIXTURE_IDS.playerOneId,
      reason: "expired",
      roundId: FIXTURE_IDS.roundId,
      occurredAt: "2026-01-04T00:03:00.000Z",
    }),
  ],
  {
    startedAt: "2026-01-01T00:00:00.000Z",
  },
);

export const FIXTURE_EVENT_LOGS = {
  opening: OPENING_EVENT_LOG,
  spinnerExpansion: SPINNER_EXPANSION_EVENT_LOG,
  blockedRound: BLOCKED_ROUND_EVENT_LOG,
  expirationForfeit: EXPIRATION_FORFEIT_EVENT_LOG,
} satisfies Readonly<Record<string, readonly GameEvent[]>>;
