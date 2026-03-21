import { TileDrawnEvent } from "@/src/game-domain/events/schema";
import { EventId, GameId, PlayerId, RoundId, TileId } from "@/src/game-domain/types";

import {
  PendingDrawState,
  createBoneyardDrawSourceVisual,
  resolveCompletedDrawEvent,
  resolveDrawPresentation,
} from "../draw-tile-animation";

describe("draw tile animation helpers", () => {
  const createPendingDraw = (
    actor: PendingDrawState["actor"],
  ): PendingDrawState => ({
    actor,
    event: {
      eventId: "event-1" as EventId,
      gameId: "game-1" as GameId,
      eventSeq: 4,
      type: "TILE_DRAWN",
      version: 1,
      occurredAt: "2026-03-18T12:00:00.000Z",
      playerId: (actor === "player" ? "p1" : "p2") as PlayerId,
      roundId: "round-1" as RoundId,
      tileId: "tile-6-6" as TileId,
      source: "boneyard",
    } satisfies TileDrawnEvent,
    tile: {
      id: "tile-6-6" as TileId,
      value1: 6,
      value2: 6,
    },
  });

  it("creates an off-canvas boneyard source visual at half scale", () => {
    const visual = createBoneyardDrawSourceVisual({
      x: 0,
      y: 120,
      width: 72,
      height: 32,
    });

    expect(visual.orientation).toBe("up");
    expect(visual.scale).toBe(0.5);
    expect(visual.left).toBeLessThan(0);
    expect(visual.left + 28).toBeLessThanOrEqual(0);
    expect(visual.top).toBeCloseTo(106.75);
  });

  it("reserves the player's destination slot immediately and hides that tile", () => {
    const baseHand = Array.from({ length: 7 }, (_, index) => ({
      id: `tile-${index}` as TileId,
      value1: index as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      value2: index as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    }));

    const presentation = resolveDrawPresentation({
      playerHand: baseHand,
      opponentHandCount: 6,
      boneyardCount: 12,
      pendingDraw: createPendingDraw("player"),
    });

    expect(presentation.displayedPlayerHand).toHaveLength(8);
    expect(presentation.displayedBoneyardCount).toBe(11);
    expect(presentation.hiddenPlayerTileId).toBe("tile-6-6");
    expect(presentation.trackedPlayerTileId).toBe("tile-6-6");
    expect(presentation.displayedOpponentHandCount).toBe(6);
  });

  it("reserves the opponent's destination slot immediately and tracks that index", () => {
    const presentation = resolveDrawPresentation({
      playerHand: [],
      opponentHandCount: 6,
      boneyardCount: 9,
      pendingDraw: createPendingDraw("opponent"),
    });

    expect(presentation.displayedOpponentHandCount).toBe(7);
    expect(presentation.hiddenOpponentTileIndex).toBe(6);
    expect(presentation.trackedOpponentTileIndex).toBe(6);
    expect(presentation.displayedBoneyardCount).toBe(8);
  });

  it("only releases the queued TILE_DRAWN event when the matching animation completes", () => {
    const pendingDraw = createPendingDraw("player");

    expect(
      resolveCompletedDrawEvent({
        pendingDraw,
        drawAnimation: {
          animationId: "draw-1",
          tileId: pendingDraw.tile.id,
          value1: pendingDraw.tile.value1,
          value2: pendingDraw.tile.value2,
          from: { left: -28, top: 10, scale: 0.5, orientation: "up" },
          to: { left: 200, top: 300, scale: 0.85, orientation: "up" },
          faceMode: "front",
          durationMs: 450,
        },
        completedAnimationId: "draw-2",
      }),
    ).toBeNull();

    expect(
      resolveCompletedDrawEvent({
        pendingDraw,
        drawAnimation: {
          animationId: "draw-1",
          tileId: pendingDraw.tile.id,
          value1: pendingDraw.tile.value1,
          value2: pendingDraw.tile.value2,
          from: { left: -28, top: 10, scale: 0.5, orientation: "up" },
          to: { left: 200, top: 300, scale: 0.85, orientation: "up" },
          faceMode: "front",
          durationMs: 450,
        },
        completedAnimationId: "draw-1",
      }),
    ).toEqual(pendingDraw.event);
  });
});
