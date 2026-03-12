import type { BoardOpenEnd, Tile, TileId, ChainSide } from "../types";

export const CHAIN_SIDE_ORDER: readonly ChainSide[] = [
  "left",
  "right",
  "up",
  "down",
];

export const sortOpenEnds = (
  openEnds: readonly BoardOpenEnd[],
): readonly BoardOpenEnd[] =>
  [...openEnds].sort(
    (left, right) =>
      CHAIN_SIDE_ORDER.indexOf(left.side) -
      CHAIN_SIDE_ORDER.indexOf(right.side),
  );

export const createSpinnerOpenEnds = (
  tileId: TileId,
  pip: number, // Using number for pip flexibility if needed
): readonly BoardOpenEnd[] =>
  sortOpenEnds(
    CHAIN_SIDE_ORDER.map((side) => ({
      side,
      pip: pip as any, // Cast to DominoPip is handled by caller or types
      tileId,
    })),
  );

export const getInitialOpenEndsForTile = (
  tile: Tile,
  side: ChainSide,
  openPipFacingOutward: number,
): readonly BoardOpenEnd[] => {
  if (tile.sideA === tile.sideB) {
    return createSpinnerOpenEnds(tile.id, openPipFacingOutward);
  }

  const inwardFacingPip =
    tile.sideA === openPipFacingOutward ? tile.sideB : tile.sideA;

  return sortOpenEnds([
    {
      side,
      pip: openPipFacingOutward as any,
      tileId: tile.id,
    },
    {
      side: side === "left" ? "right" : "left",
      pip: inwardFacingPip as any,
      tileId: tile.id,
    },
  ]);
};

export const upsertOpenEnd = (
  openEnds: readonly BoardOpenEnd[],
  nextOpenEnd: BoardOpenEnd,
): readonly BoardOpenEnd[] => {
  const existingIndex = openEnds.findIndex(
    (openEnd) => openEnd.side === nextOpenEnd.side,
  );

  if (existingIndex === -1) {
    return sortOpenEnds([...openEnds, nextOpenEnd]);
  }

  return sortOpenEnds(
    openEnds.map((openEnd, index) =>
      index === existingIndex ? nextOpenEnd : openEnd,
    ),
  );
};
