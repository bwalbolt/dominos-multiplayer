import { TileId } from "@/src/game-domain/types";

import {
  createActiveHandDrag,
  createPromotedActiveHandDrag,
  createReturningHandDrag,
  getHiddenHandTileIds,
} from "../hand-drag-state";

describe("hand drag state helpers", () => {
  it("promotes a returning overlay back to an active drag without changing its visual position", () => {
    const activeDrag = createActiveHandDrag({
      tileId: "tile-6-5" as TileId,
      value1: 6,
      value2: 5,
      sourceRect: { x: 100, y: 200, width: 47.6, height: 99.45 },
      initialVisual: {
        left: 100,
        top: 200,
        scale: 0.85,
        orientation: "up",
      },
    });
    const returningDrag = createReturningHandDrag({
      returnId: "return-1",
      activeDrag,
      returnFrom: {
        left: 180,
        top: 120,
        scale: 0.85,
        orientation: "up",
      },
    });

    expect(
      createPromotedActiveHandDrag(returningDrag, {
        left: 160,
        top: 140,
        scale: 0.85,
        orientation: "up",
      }),
    ).toEqual({
      ...activeDrag,
      initialVisual: {
        left: 160,
        top: 140,
        scale: 0.85,
        orientation: "up",
      },
    });
  });

  it("keeps tiles hidden while one is active and another is still returning", () => {
    const activeDrag = createActiveHandDrag({
      tileId: "tile-6-5" as TileId,
      value1: 6,
      value2: 5,
      sourceRect: { x: 100, y: 200, width: 47.6, height: 99.45 },
      initialVisual: null,
    });
    const returningDrag = createReturningHandDrag({
      returnId: "return-1",
      activeDrag: createActiveHandDrag({
        tileId: "tile-4-4" as TileId,
        value1: 4,
        value2: 4,
        sourceRect: { x: 150, y: 200, width: 47.6, height: 99.45 },
        initialVisual: null,
      }),
      returnFrom: {
        left: 180,
        top: 120,
        scale: 0.85,
        orientation: "up",
      },
    });

    expect(getHiddenHandTileIds(activeDrag, [returningDrag])).toEqual(
      new Set(["tile-6-5" as TileId, "tile-4-4" as TileId]),
    );
  });
});
