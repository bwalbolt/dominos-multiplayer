import type { GameEvent } from "@/src/game-domain/events/schema";
import type { PlayerId } from "@/src/game-domain/types";

import type { ScreenRect } from "./hand-drag.types";

export type ScoreBurstSide = "player" | "opponent";

export type PendingScoreBurst = Readonly<{
  id: string;
  playerId: PlayerId;
  side: ScoreBurstSide;
  delta: number;
  fromScore: number;
  toScore: number;
  label: string;
}>;

export type ActiveScoreBurst = PendingScoreBurst &
  Readonly<{
    targetRect: ScreenRect;
  }>;

export type Point = Readonly<{
  x: number;
  y: number;
}>;

type DetectScoreBurstInput = Readonly<{
  latestEvent: GameEvent | undefined;
  previousPlayerScore: number;
  previousOpponentScore: number;
  nextPlayerScore: number;
  nextOpponentScore: number;
  player1Id: PlayerId;
  player2Id: PlayerId;
}>;

export function detectScoreBurstFromTilePlayed(
  input: DetectScoreBurstInput,
): PendingScoreBurst | null {
  if (!input.latestEvent || input.latestEvent.type !== "TILE_PLAYED") {
    return null;
  }

  const playerDelta = input.nextPlayerScore - input.previousPlayerScore;
  const opponentDelta = input.nextOpponentScore - input.previousOpponentScore;

  if (playerDelta > 0 && opponentDelta === 0) {
    return {
      id: input.latestEvent.eventId,
      playerId: input.player1Id,
      side: "player",
      delta: playerDelta,
      fromScore: input.previousPlayerScore,
      toScore: input.nextPlayerScore,
      label: `+${playerDelta}`,
    };
  }

  if (opponentDelta > 0 && playerDelta === 0) {
    return {
      id: input.latestEvent.eventId,
      playerId: input.player2Id,
      side: "opponent",
      delta: opponentDelta,
      fromScore: input.previousOpponentScore,
      toScore: input.nextOpponentScore,
      label: `+${opponentDelta}`,
    };
  }

  return null;
}

export function getScoreBurstTargetRect(
  side: ScoreBurstSide,
  playerRect: ScreenRect | null,
  opponentRect: ScreenRect | null,
): ScreenRect | null {
  return side === "player" ? playerRect : opponentRect;
}

export function getScoreBurstOrigin(size: Readonly<{
  width: number;
  height: number;
}>): Point {
  return {
    x: size.width * 0.5,
    y: size.height * 0.3,
  };
}

export function getQuadraticBezierPoint(
  start: Point,
  control: Point,
  end: Point,
  t: number,
): Point {
  const normalizedT = clamp(t, 0, 1);
  const inverseT = 1 - normalizedT;

  return {
    x:
      inverseT * inverseT * start.x +
      2 * inverseT * normalizedT * control.x +
      normalizedT * normalizedT * end.x,
    y:
      inverseT * inverseT * start.y +
      2 * inverseT * normalizedT * control.y +
      normalizedT * normalizedT * end.y,
  };
}

export function getScoreBurstRingInnerRadius(
  progress: number,
  outerRadius: number,
  donutStartProgress: number,
  ringStrokeWidth: number,
): number {
  if (progress <= donutStartProgress) {
    return 0;
  }

  const ringInnerRadius = Math.max(0, outerRadius - ringStrokeWidth);
  const donutProgress = (clamp(progress, donutStartProgress, 1) - donutStartProgress) /
    (1 - donutStartProgress);

  return ringInnerRadius * donutProgress;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
