import { resolveOpenSlotZIndex } from "../board-area-layering";

import { LayoutAnchor } from "@/src/game-domain/layout/types";
import { TileId } from "@/src/game-domain/types";

const asTileId = (value: string): TileId => value as TileId;

describe("BoardArea layering", () => {
  it("renders an upward open slot below its owner tile", () => {
    const ownerTileId = asTileId("tile-6-6");
    const anchor: LayoutAnchor = {
      id: "tile-6-6-up",
      ownerTileId,
      attachmentPoint: { x: 0, y: 0 },
      direction: "up",
      openPip: 6,
    };

    expect(
      resolveOpenSlotZIndex(anchor, "up", new Map([[ownerTileId, 5]]), 200),
    ).toBe(4);
  });

  it("keeps the default layering for non-upward open slots", () => {
    const ownerTileId = asTileId("tile-6-6");
    const anchor: LayoutAnchor = {
      id: "tile-6-6-right",
      ownerTileId,
      attachmentPoint: { x: 0, y: 0 },
      direction: "right",
      openPip: 6,
    };

    expect(
      resolveOpenSlotZIndex(anchor, "right", new Map([[ownerTileId, 5]]), 200),
    ).toBe(200);
  });
});
