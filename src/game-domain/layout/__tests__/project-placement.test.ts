import { projectPlacement } from "../project-placement";
import { LayoutAnchor } from "../types";
import { DominoPip, Tile, TileId } from "../../types";

const createTile = (id: string, sideA: DominoPip, sideB: DominoPip): Tile => ({
  id: id as TileId,
  sideA,
  sideB,
});

describe("projectPlacement bend anchors", () => {
  it("bends non-doubles off the exposed end instead of the tile center", () => {
    const tile = createTile("t1", 2, 3);
    const bentAnchor: LayoutAnchor = {
      id: "prev-right",
      ownerTileId: "prev" as TileId,
      attachmentPoint: { x: 140, y: 0 },
      direction: "right",
      visualDirection: "down",
      openPip: 2,
    };

    const placement = projectPlacement(tile, bentAnchor, "sideA");

    expect(placement).toEqual({
      tileId: tile.id,
      value1: 2,
      value2: 3,
      center: { x: 140, y: 56 },
      rotationDeg: 0,
      width: 56,
      height: 112,
    });
  });

  it("keeps doubles centered on the branch axis after a bend", () => {
    const tile = createTile("t2", 4, 4);
    const bentAnchor: LayoutAnchor = {
      id: "prev-right",
      ownerTileId: "prev" as TileId,
      attachmentPoint: { x: 140, y: 0 },
      direction: "right",
      visualDirection: "down",
      openPip: 4,
    };

    const placement = projectPlacement(tile, bentAnchor, "sideA");

    expect(placement).toEqual({
      tileId: tile.id,
      value1: 4,
      value2: 4,
      center: { x: 140, y: 28 },
      rotationDeg: 90,
      width: 112,
      height: 56,
    });
  });
});
