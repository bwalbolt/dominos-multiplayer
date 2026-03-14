import { calculateBoardGeometry, solveBoardLayout } from "../anchors";
import { BoardState, DominoPip, PlayerId, Tile, TileId } from "../../types";
import { CameraTransform, LayoutOpenSlot, PlacedTileGeometry, Rect } from "../types";

const player1 = "p1" as PlayerId;

const createTile = (id: string, sideA: DominoPip, sideB: DominoPip): Tile => ({
  id: id as TileId,
  sideA,
  sideB,
});

const rectFromTile = (tile: PlacedTileGeometry): Rect => ({
  x: tile.center.x - tile.width / 2,
  y: tile.center.y - tile.height / 2,
  width: tile.width,
  height: tile.height,
});

const rectsOverlap = (left: Rect, right: Rect): boolean => {
  const overlapX = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
  const overlapY = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);

  return overlapX > 0.01 && overlapY > 0.01;
};

const rectsTouchOnEdge = (left: Rect, right: Rect): boolean => {
  const horizontalGap = Math.min(
    Math.abs(left.x + left.width - right.x),
    Math.abs(right.x + right.width - left.x),
  );
  const verticalGap = Math.min(
    Math.abs(left.y + left.height - right.y),
    Math.abs(right.y + right.height - left.y),
  );
  const overlapX = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
  const overlapY = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);

  return (horizontalGap <= 0.01 && overlapY > 0.01) || (verticalGap <= 0.01 && overlapX > 0.01);
};

const transformRect = (rect: Rect, transform: CameraTransform): Rect => ({
  x: rect.x * transform.scale + transform.translateX,
  y: rect.y * transform.scale + transform.translateY,
  width: rect.width * transform.scale,
  height: rect.height * transform.scale,
});

const assertNoTileOrSlotOverlap = (
  tiles: readonly PlacedTileGeometry[],
  openSlots: readonly LayoutOpenSlot[],
) => {
  const tileRects = tiles.map(rectFromTile);

  for (let i = 0; i < tileRects.length; i += 1) {
    for (let j = i + 1; j < tileRects.length; j += 1) {
      expect(rectsOverlap(tileRects[i], tileRects[j])).toBe(false);
    }
  }

  for (const openSlot of openSlots) {
    for (const tileRect of tileRects) {
      expect(rectsOverlap(openSlot.rect, tileRect)).toBe(false);
    }
  }
};

describe("exact layout planner", () => {
  it("chooses a portrait-friendly root orientation for long two-arm boards", () => {
    const root = createTile("root", 6, 5);
    const left1 = createTile("l1", 5, 4);
    const left2 = createTile("l2", 4, 3);
    const left3 = createTile("l3", 3, 2);
    const right1 = createTile("r1", 6, 1);
    const right2 = createTile("r2", 1, 2);
    const right3 = createTile("r3", 2, 3);

    const board: BoardState = {
      layoutDirection: "wrapped",
      spinnerTileId: null,
      openEnds: [
        { side: "left", pip: 2, tileId: left3.id },
        { side: "right", pip: 3, tileId: right3.id },
      ],
      tiles: [
        { tile: root, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 5 },
        { tile: right1, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 1 },
        { tile: left1, playedBy: player1, placedAtSeq: 3, side: "left", openPipFacingOutward: 4 },
        { tile: right2, playedBy: player1, placedAtSeq: 4, side: "right", openPipFacingOutward: 2 },
        { tile: left2, playedBy: player1, placedAtSeq: 5, side: "left", openPipFacingOutward: 3 },
        { tile: right3, playedBy: player1, placedAtSeq: 6, side: "right", openPipFacingOutward: 3 },
        { tile: left3, playedBy: player1, placedAtSeq: 7, side: "left", openPipFacingOutward: 2 },
      ],
    };

    const solution = solveBoardLayout(board, {
      viewport: { width: 402, height: 560 },
      padding: 56,
    });
    const firstLeft = solution.geometry.placedTiles.find((tile) => tile.tileId === left1.id);
    const firstRight = solution.geometry.placedTiles.find((tile) => tile.tileId === right1.id);

    expect(firstLeft?.center.x).toBe(0);
    expect(firstRight?.center.x).toBe(0);
    expect(Math.sign(firstLeft?.center.y ?? 0)).not.toBe(Math.sign(firstRight?.center.y ?? 0));
  });

  it("returns a fit, non-overlapping four-arm late-game layout", () => {
    const root = createTile("root", 6, 6);
    const left1 = createTile("l1", 6, 5);
    const left2 = createTile("l2", 5, 4);
    const left3 = createTile("l3", 4, 3);
    const left4 = createTile("l4", 3, 2);
    const right1 = createTile("r1", 6, 1);
    const right2 = createTile("r2", 1, 2);
    const right3 = createTile("r3", 2, 3);
    const right4 = createTile("r4", 3, 4);
    const up1 = createTile("u1", 6, 0);
    const up2 = createTile("u2", 0, 1);
    const down1 = createTile("d1", 6, 2);
    const down2 = createTile("d2", 2, 3);
    const down3 = createTile("d3", 3, 4);

    const board: BoardState = {
      layoutDirection: "wrapped",
      spinnerTileId: root.id,
      openEnds: [
        { side: "left", pip: 2, tileId: left4.id },
        { side: "right", pip: 4, tileId: right4.id },
        { side: "up", pip: 1, tileId: up2.id },
        { side: "down", pip: 4, tileId: down3.id },
      ],
      tiles: [
        { tile: root, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 6 },
        { tile: left1, playedBy: player1, placedAtSeq: 2, side: "left", openPipFacingOutward: 5 },
        { tile: right1, playedBy: player1, placedAtSeq: 3, side: "right", openPipFacingOutward: 1 },
        { tile: left2, playedBy: player1, placedAtSeq: 4, side: "left", openPipFacingOutward: 4 },
        { tile: right2, playedBy: player1, placedAtSeq: 5, side: "right", openPipFacingOutward: 2 },
        { tile: up1, playedBy: player1, placedAtSeq: 6, side: "up", openPipFacingOutward: 0 },
        { tile: down1, playedBy: player1, placedAtSeq: 7, side: "down", openPipFacingOutward: 2 },
        { tile: left3, playedBy: player1, placedAtSeq: 8, side: "left", openPipFacingOutward: 3 },
        { tile: right3, playedBy: player1, placedAtSeq: 9, side: "right", openPipFacingOutward: 3 },
        { tile: up2, playedBy: player1, placedAtSeq: 10, side: "up", openPipFacingOutward: 1 },
        { tile: down2, playedBy: player1, placedAtSeq: 11, side: "down", openPipFacingOutward: 3 },
        { tile: left4, playedBy: player1, placedAtSeq: 12, side: "left", openPipFacingOutward: 2 },
        { tile: right4, playedBy: player1, placedAtSeq: 13, side: "right", openPipFacingOutward: 4 },
        { tile: down3, playedBy: player1, placedAtSeq: 14, side: "down", openPipFacingOutward: 4 },
      ],
    };

    const solution = solveBoardLayout(board, {
      viewport: { width: 402, height: 560 },
      padding: 56,
    });

    assertNoTileOrSlotOverlap(solution.geometry.placedTiles, solution.openSlots);
    expect(solution.fitScale).toBeLessThanOrEqual(1);
    const scaledPadding = 56 * solution.camera.scale;

    for (const rect of [
      ...solution.geometry.placedTiles.map(rectFromTile),
      ...solution.openSlots.map((slot) => slot.rect),
    ]) {
      const screenRect = transformRect(rect, solution.camera);
      expect(screenRect.x).toBeGreaterThanOrEqual(scaledPadding - 0.5);
      expect(screenRect.y).toBeGreaterThanOrEqual(scaledPadding - 0.5);
      expect(screenRect.x + screenRect.width).toBeLessThanOrEqual(402 - scaledPadding + 0.5);
      expect(screenRect.y + screenRect.height).toBeLessThanOrEqual(560 - scaledPadding + 0.5);
    }
  });

  it("bends a long spinner arm in portrait instead of keeping a single horizontal strip", () => {
    const root = createTile("root", 6, 6);
    const right1 = createTile("r1", 6, 5);
    const right2 = createTile("r2", 5, 4);
    const right3 = createTile("r3", 4, 3);
    const right4 = createTile("r4", 3, 2);
    const right5 = createTile("r5", 2, 1);
    const right6 = createTile("r6", 1, 0);

    const board: BoardState = {
      layoutDirection: "wrapped",
      spinnerTileId: root.id,
      openEnds: [
        { side: "left", pip: 6, tileId: root.id },
        { side: "right", pip: 0, tileId: right6.id },
      ],
      tiles: [
        { tile: root, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 6 },
        { tile: right1, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 5 },
        { tile: right2, playedBy: player1, placedAtSeq: 3, side: "right", openPipFacingOutward: 4 },
        { tile: right3, playedBy: player1, placedAtSeq: 4, side: "right", openPipFacingOutward: 3 },
        { tile: right4, playedBy: player1, placedAtSeq: 5, side: "right", openPipFacingOutward: 2 },
        { tile: right5, playedBy: player1, placedAtSeq: 6, side: "right", openPipFacingOutward: 1 },
        { tile: right6, playedBy: player1, placedAtSeq: 7, side: "right", openPipFacingOutward: 0 },
      ],
    };

    const solution = solveBoardLayout(board, {
      viewport: { width: 402, height: 560 },
      padding: 56,
    });

    const rightArmTiles = solution.geometry.placedTiles
      .filter((tile) => tile.tileId !== root.id)
      .sort((left, right) => left.center.x - right.center.x);
    const uniqueRows = new Set(rightArmTiles.map((tile) => tile.center.y));

    expect(solution.bendPlan.right.length).toBeGreaterThan(1);
    expect(uniqueRows.size).toBeGreaterThan(1);
  });

  it("keeps the next tile flush against a continuing double arm", () => {
    const root = createTile("root", 6, 6);
    const right1 = createTile("r1", 6, 5);
    const right2 = createTile("r2", 5, 5);
    const right3 = createTile("r3", 5, 4);

    const board: BoardState = {
      layoutDirection: "wrapped",
      spinnerTileId: root.id,
      openEnds: [
        { side: "left", pip: 6, tileId: root.id },
        { side: "right", pip: 4, tileId: right3.id },
      ],
      tiles: [
        { tile: root, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 6 },
        { tile: right1, playedBy: player1, placedAtSeq: 2, side: "right", openPipFacingOutward: 5 },
        { tile: right2, playedBy: player1, placedAtSeq: 3, side: "right", openPipFacingOutward: 5 },
        { tile: right3, playedBy: player1, placedAtSeq: 4, side: "right", openPipFacingOutward: 4 },
      ],
    };

    const solution = solveBoardLayout(board, {
      viewport: { width: 402, height: 560 },
      padding: 56,
    });
    const doubleRect = rectFromTile(
      solution.geometry.placedTiles.find((tile) => tile.tileId === right2.id)!,
    );
    const nextRect = rectFromTile(
      solution.geometry.placedTiles.find((tile) => tile.tileId === right3.id)!,
    );

    expect(rectsTouchOnEdge(doubleRect, nextRect)).toBe(true);
  });

  it("is deterministic for repeated solves on the same board", () => {
    const root = createTile("root", 6, 6);
    const left1 = createTile("l1", 6, 5);
    const right1 = createTile("r1", 6, 4);

    const board: BoardState = {
      layoutDirection: "wrapped",
      spinnerTileId: root.id,
      openEnds: [
        { side: "left", pip: 5, tileId: left1.id },
        { side: "right", pip: 4, tileId: right1.id },
      ],
      tiles: [
        { tile: root, playedBy: player1, placedAtSeq: 1, side: "left", openPipFacingOutward: 6 },
        { tile: left1, playedBy: player1, placedAtSeq: 2, side: "left", openPipFacingOutward: 5 },
        { tile: right1, playedBy: player1, placedAtSeq: 3, side: "right", openPipFacingOutward: 4 },
      ],
    };

    const first = solveBoardLayout(board, {
      viewport: { width: 402, height: 560 },
      padding: 56,
    });
    const second = solveBoardLayout(board, {
      viewport: { width: 402, height: 560 },
      padding: 56,
    });

    expect(second).toEqual(first);
    expect(calculateBoardGeometry(board, { viewport: { width: 402, height: 560 }, padding: 56 })).toEqual(first.geometry);
  });
});
