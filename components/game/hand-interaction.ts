import { TileId } from "@/src/game-domain/types";

type ResolveHandTileInteractionInput = Readonly<{
  tileId: TileId;
  isInteractionEnabled: boolean;
  hasActiveDrag: boolean;
  activeTileId: TileId | null;
}>;

export function resolveHandTileInteractionEnabled(
  input: ResolveHandTileInteractionInput,
): boolean {
  if (!input.isInteractionEnabled) {
    return false;
  }

  if (!input.hasActiveDrag) {
    return true;
  }

  return input.activeTileId === input.tileId;
}
