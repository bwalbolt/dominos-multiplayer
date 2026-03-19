import { reconstructGameState } from "@/src/game-domain/reconstruct";
import type { GameEvent } from "@/src/game-domain/events/schema";
import {
  BLOCKED_ROUND_EVENT_LOG,
} from "@/src/game-domain/__tests__/fixtures/event-logs";
import {
  FIXTURE_IDS,
  buildFixtureEventLog,
  createGameEndedStep,
  createGameStartedStep,
  createHandsByPlayerId,
  createRoundStartedStep,
  createScoreByPlayerId,
  createTilePlayedStep,
  getFixtureTileId,
  getFixtureTileIds,
} from "@/src/game-domain/__tests__/fixtures/builders";

import { resolveVisualTurnPlayerId } from "../visual-turn.helpers";

const createResolvedGame = (events: readonly GameEvent[]) => {
  const { game } = reconstructGameState(events);

  if (!game) {
    throw new Error("Expected reconstructed game state.");
  }

  return game;
};

describe("visual turn helpers", () => {
  it("falls back to the authoritative turn during normal active play", () => {
    const events = buildFixtureEventLog([
      createGameStartedStep(),
      createRoundStartedStep({
        startingPlayerId: FIXTURE_IDS.playerTwoId,
        handsByPlayerId: createHandsByPlayerId(
          getFixtureTileIds([5, 5], [0, 0]),
          getFixtureTileIds([6, 6], [1, 1]),
        ),
        boneyardTileIds: getFixtureTileIds([2, 2]),
      }),
    ]);
    const game = createResolvedGame(events);

    expect(
      resolveVisualTurnPlayerId({
        game,
        events,
        hasPendingRoundResolution: false,
      }),
    ).toBe(FIXTURE_IDS.playerTwoId);
  });

  it("keeps the dominoing player highlighted before ROUND_ENDED is appended", () => {
    const events = buildFixtureEventLog([
      createGameStartedStep(),
      createRoundStartedStep({
        handsByPlayerId: createHandsByPlayerId(
          [getFixtureTileId(6, 6)],
          [getFixtureTileId(0, 0)],
        ),
        boneyardTileIds: [],
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerOneId,
        tileId: getFixtureTileId(6, 6),
        side: "left",
        openPipFacingOutward: 6,
      }),
    ]);
    const game = createResolvedGame(events);

    expect(game.turn?.activePlayerId).toBe(FIXTURE_IDS.playerTwoId);
    expect(
      resolveVisualTurnPlayerId({
        game,
        events,
        hasPendingRoundResolution: true,
      }),
    ).toBe(FIXTURE_IDS.playerOneId);
  });

  it("keeps the passing player highlighted for blocked rounds, not the round winner", () => {
    const events = BLOCKED_ROUND_EVENT_LOG.slice(
      0,
      BLOCKED_ROUND_EVENT_LOG.length - 1,
    );
    const game = createResolvedGame(events);

    expect(game.turn?.activePlayerId).toBe(FIXTURE_IDS.playerOneId);
    expect(
      resolveVisualTurnPlayerId({
        game,
        events,
        hasPendingRoundResolution: true,
      }),
    ).toBe(FIXTURE_IDS.playerTwoId);
  });

  it("keeps the last scoring actor highlighted before GAME_ENDED is appended", () => {
    const events = buildFixtureEventLog([
      createGameStartedStep({ targetScore: 10 }),
      createRoundStartedStep({
        handsByPlayerId: createHandsByPlayerId(
          getFixtureTileIds([5, 5], [0, 0]),
          getFixtureTileIds([6, 6], [1, 1]),
        ),
        boneyardTileIds: getFixtureTileIds([2, 2]),
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerOneId,
        tileId: getFixtureTileId(5, 5),
        side: "left",
        openPipFacingOutward: 5,
      }),
    ]);
    const game = createResolvedGame(events);

    expect(game.turn?.activePlayerId).toBe(FIXTURE_IDS.playerTwoId);
    expect(game.playerStateById[FIXTURE_IDS.playerOneId].score).toBe(10);
    expect(
      resolveVisualTurnPlayerId({
        game,
        events,
        hasPendingRoundResolution: false,
      }),
    ).toBe(FIXTURE_IDS.playerOneId);
  });

  it("keeps the last actionable actor highlighted once the game is completed", () => {
    const events = buildFixtureEventLog([
      createGameStartedStep({ targetScore: 10 }),
      createRoundStartedStep({
        handsByPlayerId: createHandsByPlayerId(
          getFixtureTileIds([5, 5], [0, 0]),
          getFixtureTileIds([6, 6], [1, 1]),
        ),
        boneyardTileIds: getFixtureTileIds([2, 2]),
      }),
      createTilePlayedStep({
        playerId: FIXTURE_IDS.playerOneId,
        tileId: getFixtureTileId(5, 5),
        side: "left",
        openPipFacingOutward: 5,
      }),
      createGameEndedStep({
        winnerPlayerId: FIXTURE_IDS.playerOneId,
        reason: "target_score_reached",
        finalScoreByPlayerId: createScoreByPlayerId(10, 0),
      }),
    ]);
    const game = createResolvedGame(events);

    expect(game.status).toBe("completed");
    expect(game.turn).toBeNull();
    expect(
      resolveVisualTurnPlayerId({
        game,
        events,
        hasPendingRoundResolution: false,
      }),
    ).toBe(FIXTURE_IDS.playerOneId);
  });
});
