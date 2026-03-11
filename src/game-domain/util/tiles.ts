import { Tile, TileId } from "../types";

const asTileId = (value: string): TileId => value as TileId;

const toTileLabel = (sideA: number, sideB: number): string =>
  `${Math.min(sideA, sideB)}-${Math.max(sideA, sideB)}`;

/**
 * Creates a standard Double-Six domino set (28 tiles).
 */
export const createDoubleSixTileCatalog = (): readonly Tile[] => {
  const tiles: Tile[] = [];

  for (let sideA = 0; sideA <= 6; sideA += 1) {
    for (let sideB = sideA; sideB <= 6; sideB += 1) {
      tiles.push({
        id: asTileId(`tile-${toTileLabel(sideA, sideB)}`),
        sideA: sideA as Tile["sideA"],
        sideB: sideB as Tile["sideB"],
      });
    }
  }

  return tiles;
};
