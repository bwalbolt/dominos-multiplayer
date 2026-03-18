import { DominoOrientation } from "@/components/domino/domino-tile.types";
import { LayoutAnchor } from "@/src/game-domain/layout/types";
import { TileId } from "@/src/game-domain/types";

export function resolveOpenSlotZIndex(
  highlightedAnchor: LayoutAnchor | null | undefined,
  visualDirection: DominoOrientation | undefined,
  tileZIndexById: ReadonlyMap<TileId, number>,
  fallbackZIndex: number,
): number {
  if (
    visualDirection !== "up" ||
    highlightedAnchor?.ownerTileId === null ||
    highlightedAnchor?.ownerTileId === undefined
  ) {
    return fallbackZIndex;
  }

  const ownerTileZIndex = tileZIndexById.get(highlightedAnchor.ownerTileId);

  if (ownerTileZIndex === undefined) {
    return fallbackZIndex;
  }

  return Math.max(0, ownerTileZIndex - 1);
}
