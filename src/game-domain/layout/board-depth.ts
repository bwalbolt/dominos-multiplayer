import { TileId } from "../types";
import { PlacedTileGeometry } from "./types";

export type TileStackEntry = Readonly<{
  tileId: TileId;
  zIndex: number;
}>;

export function getBoardTileBottomEdge(
  tile: Pick<PlacedTileGeometry, "center" | "height">,
): number {
  return tile.center.y + tile.height / 2;
}

export function compareBoardTileDepth(
  left: Pick<PlacedTileGeometry, "center" | "height" | "placedAtSeq">,
  right: Pick<PlacedTileGeometry, "center" | "height" | "placedAtSeq">,
): number {
  const bottomEdgeDifference =
    getBoardTileBottomEdge(left) - getBoardTileBottomEdge(right);

  if (bottomEdgeDifference !== 0) {
    return bottomEdgeDifference;
  }

  const centerXDifference = left.center.x - right.center.x;

  if (centerXDifference !== 0) {
    return centerXDifference;
  }

  return left.placedAtSeq - right.placedAtSeq;
}

export function computeBoardTileStackOrder(
  tiles: readonly PlacedTileGeometry[],
): readonly TileStackEntry[] {
  const sortedTiles = [...tiles].sort(compareBoardTileDepth);

  return sortedTiles.map((tile, index) => ({
    tileId: tile.tileId,
    zIndex: index + 1,
  }));
}
