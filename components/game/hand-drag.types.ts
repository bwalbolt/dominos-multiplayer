import { DominoOrientation } from "@/components/domino/domino-tile.types";
import { DominoPip, TileId } from "@/src/game-domain/types";

export type ScreenRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type HandTileDragStart = Readonly<{
  tileId: TileId;
  sourceRect: ScreenRect;
}>;

export type DragTileVisual = Readonly<{
  left: number;
  top: number;
  scale: number;
  orientation: DominoOrientation;
}>;

export type ActiveHandDrag = Readonly<{
  tileId: TileId;
  value1: DominoPip;
  value2: DominoPip;
  sourceRect: ScreenRect;
  phase: "dragging" | "returning";
  returnFrom: DragTileVisual | null;
}>;
