import { TilePlayedEvent } from "@/src/game-domain/events/schema";
import {
  EventId,
  GameId,
  PlayerId,
  RoundId,
  TileId,
} from "@/src/game-domain/types";

import {
  detectScoreBurstFromTilePlayed,
  getQuadraticBezierPoint,
  getScoreBurstOrigin,
  getScoreBurstRingInnerRadius,
  getScoreBurstTargetRect,
} from "../score-burst.helpers";

const PLAYER_ID = "p1" as PlayerId;
const OPPONENT_ID = "p2" as PlayerId;

function createTilePlayedEvent(): TilePlayedEvent {
  return {
    eventId: "event-1" as EventId,
    gameId: "game-1" as GameId,
    eventSeq: 4,
    type: "TILE_PLAYED",
    version: 1,
    occurredAt: "2026-03-19T12:00:00.000Z",
    playerId: PLAYER_ID,
    roundId: "round-1" as RoundId,
    tileId: "tile-5-0" as TileId,
    side: "left",
    openPipFacingOutward: 5,
  } as TilePlayedEvent;
}

describe("score burst helpers", () => {
  it("detects a player score burst for positive TILE_PLAYED deltas", () => {
    expect(
      detectScoreBurstFromTilePlayed({
        latestEvent: createTilePlayedEvent(),
        previousPlayerScore: 15,
        previousOpponentScore: 10,
        nextPlayerScore: 25,
        nextOpponentScore: 10,
        player1Id: PLAYER_ID,
        player2Id: OPPONENT_ID,
      }),
    ).toEqual({
      id: "event-1",
      playerId: PLAYER_ID,
      side: "player",
      delta: 10,
      fromScore: 15,
      toScore: 25,
      label: "+10",
    });
  });

  it("ignores non-scoring TILE_PLAYED events", () => {
    expect(
      detectScoreBurstFromTilePlayed({
        latestEvent: createTilePlayedEvent(),
        previousPlayerScore: 15,
        previousOpponentScore: 10,
        nextPlayerScore: 15,
        nextOpponentScore: 10,
        player1Id: PLAYER_ID,
        player2Id: OPPONENT_ID,
      }),
    ).toBeNull();
  });

  it("ignores score changes from non-TILE_PLAYED events", () => {
    expect(
      detectScoreBurstFromTilePlayed({
        latestEvent: {
          eventId: "event-2" as EventId,
          gameId: "game-1" as GameId,
          eventSeq: 5,
          type: "ROUND_ENDED",
          version: 1,
          occurredAt: "2026-03-19T12:00:05.000Z",
          roundId: "round-1" as RoundId,
          winnerPlayerId: PLAYER_ID,
          reason: "domino",
          scoreAwarded: 15,
          scoreByPlayerId: {
            [PLAYER_ID]: 40,
            [OPPONENT_ID]: 10,
          },
          nextStartingPlayerId: PLAYER_ID,
        } as const,
        previousPlayerScore: 25,
        previousOpponentScore: 10,
        nextPlayerScore: 40,
        nextOpponentScore: 10,
        player1Id: PLAYER_ID,
        player2Id: OPPONENT_ID,
      }),
    ).toBeNull();
  });

  it("chooses the correct header target rect for the scoring side", () => {
    const playerRect = { x: 10, y: 20, width: 40, height: 24 };
    const opponentRect = { x: 100, y: 20, width: 44, height: 24 };

    expect(getScoreBurstTargetRect("player", playerRect, opponentRect)).toBe(
      playerRect,
    );
    expect(getScoreBurstTargetRect("opponent", playerRect, opponentRect)).toBe(
      opponentRect,
    );
  });

  it("computes deterministic burst origin and arc interpolation", () => {
    expect(getScoreBurstOrigin({ width: 400, height: 800 })).toEqual({
      x: 200,
      y: 240,
    });

    expect(
      getQuadraticBezierPoint(
        { x: 200, y: 240 },
        { x: 160, y: 80 },
        { x: 120, y: 40 },
        0.5,
      ),
    ).toEqual({
      x: 160,
      y: 110,
    });
  });

  it("keeps the ring filled until donut progress begins, then hollows it out", () => {
    expect(getScoreBurstRingInnerRadius(0.59, 100, 0.6, 3)).toBe(0);
    expect(getScoreBurstRingInnerRadius(0.6, 100, 0.6, 3)).toBe(0);
    expect(getScoreBurstRingInnerRadius(1, 100, 0.6, 3)).toBe(97);
  });
});
