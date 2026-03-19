import { getDominoTileFrameSize } from "@/components/domino/domino-tile.utils";
import { TileDrawnEvent } from "@/src/game-domain/events/schema";
import { DominoPip, TileId } from "@/src/game-domain/types";

import { createSourceDragTileVisual } from "./hand-drag-visual";
import { DrawTileAnimation, DragTileVisual, ScreenRect } from "./hand-drag.types";
import { resolveOpponentPendingDrawTileIndex } from "./opponent-hand.utils";

export const DRAW_TILE_SOURCE_SCALE = 0.5;
export const PLAYER_DRAW_TILE_SCALE = 0.85;
export const OPPONENT_DRAW_TILE_SCALE = 0.57;
export const DRAW_TILE_DURATION_MS = 450;

export type HandTileData = Readonly<{
  id: TileId;
  value1: DominoPip;
  value2: DominoPip;
}>;

export type PendingDrawState = Readonly<{
  actor: "player" | "opponent";
  event: TileDrawnEvent;
  tile: HandTileData;
}>;

export type DrawPresentation = Readonly<{
  displayedPlayerHand: readonly HandTileData[];
  displayedOpponentHandCount: number;
  displayedBoneyardCount: number;
  hiddenPlayerTileId: TileId | null;
  hiddenOpponentTileIndex: number | null;
  trackedPlayerTileId: TileId | null;
  trackedOpponentTileIndex: number | null;
}>;

export function createBoneyardDrawSourceVisual(
  boneyardRect: ScreenRect,
): DragTileVisual {
  const frameSize = getDominoTileFrameSize("up", DRAW_TILE_SOURCE_SCALE);

  return {
    left: -frameSize.width,
    top: boneyardRect.y + boneyardRect.height / 2 - frameSize.height / 2,
    scale: DRAW_TILE_SOURCE_SCALE,
    orientation: "up",
  };
}

export function createDrawTileAnimation(input: Readonly<{
  animationId: string;
  tile: HandTileData;
  destinationRect: ScreenRect;
  boneyardRect: ScreenRect;
  faceMode: "front" | "back";
}>): DrawTileAnimation {
  return {
    animationId: input.animationId,
    tileId: input.tile.id,
    value1: input.tile.value1,
    value2: input.tile.value2,
    from: createBoneyardDrawSourceVisual(input.boneyardRect),
    to: createSourceDragTileVisual(input.destinationRect),
    faceMode: input.faceMode,
    durationMs: DRAW_TILE_DURATION_MS,
  };
}

export function resolveDrawPresentation(input: Readonly<{
  playerHand: readonly HandTileData[];
  opponentHandCount: number;
  boneyardCount: number;
  pendingDraw: PendingDrawState | null;
}>): DrawPresentation {
  if (!input.pendingDraw) {
    return {
      displayedPlayerHand: input.playerHand,
      displayedOpponentHandCount: input.opponentHandCount,
      displayedBoneyardCount: input.boneyardCount,
      hiddenPlayerTileId: null,
      hiddenOpponentTileIndex: null,
      trackedPlayerTileId: null,
      trackedOpponentTileIndex: null,
    };
  }

  if (input.pendingDraw.actor === "player") {
    return {
      displayedPlayerHand: [...input.playerHand, input.pendingDraw.tile],
      displayedOpponentHandCount: input.opponentHandCount,
      displayedBoneyardCount: Math.max(0, input.boneyardCount - 1),
      hiddenPlayerTileId: input.pendingDraw.tile.id,
      hiddenOpponentTileIndex: null,
      trackedPlayerTileId: input.pendingDraw.tile.id,
      trackedOpponentTileIndex: null,
    };
  }

  const displayedOpponentHandCount = input.opponentHandCount + 1;
  const pendingTileIndex =
    resolveOpponentPendingDrawTileIndex(displayedOpponentHandCount);

  return {
    displayedPlayerHand: input.playerHand,
    displayedOpponentHandCount,
    displayedBoneyardCount: Math.max(0, input.boneyardCount - 1),
    hiddenPlayerTileId: null,
    hiddenOpponentTileIndex: pendingTileIndex,
    trackedPlayerTileId: null,
    trackedOpponentTileIndex: pendingTileIndex,
  };
}

export function resolveCompletedDrawEvent(input: Readonly<{
  pendingDraw: PendingDrawState | null;
  drawAnimation: DrawTileAnimation | null;
  completedAnimationId: string;
}>): TileDrawnEvent | null {
  if (!input.pendingDraw || !input.drawAnimation) {
    return null;
  }

  return input.drawAnimation.animationId === input.completedAnimationId
    ? input.pendingDraw.event
    : null;
}
