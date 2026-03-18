import { resolveHandTileInteractionEnabled } from "../hand-interaction";
import type { TileId } from "@/src/game-domain/types";

const asTileId = (value: string): TileId => value as TileId;

describe("resolveHandTileInteractionEnabled", () => {
  it("allows interaction when no drag is active", () => {
    expect(
      resolveHandTileInteractionEnabled({
        tileId: asTileId("tile-1-2"),
        isInteractionEnabled: true,
        hasActiveDrag: false,
        activeTileId: null,
      }),
    ).toBe(true);
  });

  it("keeps the active tile enabled while other tiles are locked", () => {
    expect(
      resolveHandTileInteractionEnabled({
        tileId: asTileId("tile-1-2"),
        isInteractionEnabled: true,
        hasActiveDrag: true,
        activeTileId: asTileId("tile-1-2"),
      }),
    ).toBe(true);

    expect(
      resolveHandTileInteractionEnabled({
        tileId: asTileId("tile-2-3"),
        isInteractionEnabled: true,
        hasActiveDrag: true,
        activeTileId: asTileId("tile-1-2"),
      }),
    ).toBe(false);
  });

  it("stays disabled when board interaction is unavailable", () => {
    expect(
      resolveHandTileInteractionEnabled({
        tileId: asTileId("tile-1-2"),
        isInteractionEnabled: false,
        hasActiveDrag: false,
        activeTileId: null,
      }),
    ).toBe(false);
  });
});
