import { DominoPip, TileId } from "@/src/game-domain/types";

import {
  ActiveHandDrag,
  DragTileVisual,
  ReturningHandDrag,
  ScreenRect,
} from "./hand-drag.types";

type CreateActiveHandDragInput = Readonly<{
  tileId: TileId;
  value1: DominoPip;
  value2: DominoPip;
  sourceRect: ScreenRect;
  initialVisual: DragTileVisual | null;
}>;

type CreateReturningHandDragInput = Readonly<{
  returnId: string;
  activeDrag: ActiveHandDrag;
  returnFrom: DragTileVisual;
}>;

export function createActiveHandDrag(
  input: CreateActiveHandDragInput,
): ActiveHandDrag {
  return {
    tileId: input.tileId,
    value1: input.value1,
    value2: input.value2,
    sourceRect: input.sourceRect,
    initialVisual: input.initialVisual,
  };
}

export function createReturningHandDrag(
  input: CreateReturningHandDragInput,
): ReturningHandDrag {
  return {
    returnId: input.returnId,
    tileId: input.activeDrag.tileId,
    value1: input.activeDrag.value1,
    value2: input.activeDrag.value2,
    sourceRect: input.activeDrag.sourceRect,
    returnFrom: input.returnFrom,
    isPromotedToActive: false,
  };
}

export function createPromotedActiveHandDrag(
  returningDrag: ReturningHandDrag,
  currentVisual: DragTileVisual,
): ActiveHandDrag {
  return createActiveHandDrag({
    tileId: returningDrag.tileId,
    value1: returningDrag.value1,
    value2: returningDrag.value2,
    sourceRect: returningDrag.sourceRect,
    initialVisual: currentVisual,
  });
}

export function getHiddenHandTileIds(
  activeDrag: ActiveHandDrag | null,
  returningDrags: readonly ReturningHandDrag[],
): ReadonlySet<TileId> {
  return new Set([
    ...(activeDrag ? [activeDrag.tileId] : []),
    ...returningDrags.map((returningDrag) => returningDrag.tileId),
  ]);
}
