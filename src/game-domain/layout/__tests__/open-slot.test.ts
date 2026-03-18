import { domino } from "../../../../theme/tokens";

import { TileId } from "../../types";
import { createOpenSlotFromAnchor } from "../open-slot";
import { LayoutAnchor } from "../types";

describe("open-slot", () => {
  it.each([
    [
      "left",
      {
        id: "left",
        ownerTileId: "tile-6-6" as TileId,
        attachmentPoint: { x: 0, y: 0 },
        direction: "left",
        openPip: 6,
      } satisfies LayoutAnchor,
      { x: -domino.height, y: -domino.width / 2, width: domino.height, height: domino.width },
    ],
    [
      "right",
      {
        id: "right",
        ownerTileId: "tile-6-6" as TileId,
        attachmentPoint: { x: 0, y: 0 },
        direction: "right",
        openPip: 6,
      } satisfies LayoutAnchor,
      { x: 0, y: -domino.width / 2, width: domino.height, height: domino.width },
    ],
    [
      "up",
      {
        id: "up",
        ownerTileId: "tile-6-6" as TileId,
        attachmentPoint: { x: 0, y: 0 },
        direction: "up",
        openPip: 6,
      } satisfies LayoutAnchor,
      { x: -domino.width / 2, y: -domino.height, width: domino.width, height: domino.height },
    ],
    [
      "down",
      {
        id: "down",
        ownerTileId: "tile-6-6" as TileId,
        attachmentPoint: { x: 0, y: 0 },
        direction: "down",
        openPip: 6,
      } satisfies LayoutAnchor,
      { x: -domino.width / 2, y: 0, width: domino.width, height: domino.height },
    ],
  ])("projects the %s anchor to the correct slot rect", (_label, anchor, rect) => {
    expect(createOpenSlotFromAnchor(anchor)).toEqual({
      side: anchor.direction,
      attachmentPoint: anchor.attachmentPoint,
      visualDirection: anchor.direction,
      rect,
    });
  });

  it("centers the opening anchor on the board instead of offsetting from a side", () => {
    expect(
      createOpenSlotFromAnchor({
        id: "initial",
        ownerTileId: null,
        attachmentPoint: { x: 0, y: 0 },
        direction: "left",
        openPip: 0,
      }),
    ).toEqual({
      side: "left",
      attachmentPoint: { x: 0, y: 0 },
      visualDirection: "up",
      rect: {
        x: -domino.width / 2,
        y: -domino.height / 2,
        width: domino.width,
        height: domino.height,
      },
    });
  });
});
