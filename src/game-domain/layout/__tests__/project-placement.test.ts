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

    expect(placement).toMatchObject({
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

    expect(placement).toMatchObject({
      tileId: tile.id,
      value1: 4,
      value2: 4,
      center: { x: 140, y: 28 },
      rotationDeg: 90,
      width: 112,
      height: 56,
    });
  });

  it("centers the opening double on the board instead of offsetting from the initial anchor", () => {
    const tile = createTile("opening-double", 6, 6);
    const openingAnchor: LayoutAnchor = {
      id: "initial",
      ownerTileId: null,
      attachmentPoint: { x: 0, y: 0 },
      direction: "left",
      openPip: 6,
    };

    const placement = projectPlacement(tile, openingAnchor, "sideA");

    expect(placement).toMatchObject({
      tileId: tile.id,
      center: { x: 0, y: 0 },
      rotationDeg: 0,
      width: 56,
      height: 112,
      heading: "up",
    });
  });

  it("centers the opening line tile using the resolved opening orientation", () => {
    const tile = createTile("opening-line", 1, 4);
    const openingAnchor: LayoutAnchor = {
      id: "initial",
      ownerTileId: null,
      attachmentPoint: { x: 0, y: 0 },
      direction: "left",
      openPip: 1,
    };

    const placement = projectPlacement(tile, openingAnchor, "sideB");

    expect(placement).toMatchObject({
      tileId: tile.id,
      center: { x: 0, y: 0 },
      rotationDeg: 0,
      width: 56,
      height: 112,
      heading: "up",
    });
  });
});
