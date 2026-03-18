import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import {
  DominoTile,
  DominoTileHighlightShell,
} from "@/components/domino/domino-tile";
import { DominoOrientation } from "@/components/domino/domino-tile.types";
import { resolveOpenSlotZIndex } from "@/components/game/board-area-layering";
import {
  BoardLayoutTransitionPlan,
  buildBoardLayoutTransitionPlan,
  createStaticTileTransitionPlan,
  TileTransitionPlan,
} from "@/src/game-domain/layout/animation-plan";
import { computeBoardTileStackOrder } from "@/src/game-domain/layout/board-depth";
import { createOpenSlotFromAnchor } from "@/src/game-domain/layout/open-slot";
import {
  BoardLayoutSolution,
  LayoutAnchor,
  PlacedTileGeometry,
  Point,
} from "@/src/game-domain/layout/types";
import { BoardState, TileId } from "@/src/game-domain/types";
import { domino, spacing } from "@/theme/tokens";

const BOARD_LAYOUT_TRANSITION_DURATION_MS = 320;
const ANCHOR_SIZE = spacing[8];
const ANCHOR_RADIUS = ANCHOR_SIZE / 2;
const SNAP_HIGHLIGHT_Z_INDEX = 220;
const ANCHOR_Z_INDEX = 160;
const PREVIEW_TILE_Z_INDEX = 200;
const BOARD_TILE_POSE = { elevation: domino.idleElevation } as const;
const PREVIEW_TILE_POSE = { elevation: domino.previewElevation } as const;
const SNAP_HIGHLIGHT_POSE = { elevation: domino.previewElevation } as const;

type BoardSnapshot = Readonly<{
  board: BoardState;
  layout: BoardLayoutSolution;
}>;

interface BoardAreaProps {
  board: BoardState;
  layout: BoardLayoutSolution;
  highlightedAnchor?: LayoutAnchor | null;
  highlightedTileIsDouble?: boolean;
  previewAnchor?: LayoutAnchor | null;
  previewTile?: PlacedTileGeometry | null;
  onTransitionActiveChange?: (isActive: boolean) => void;
}

export const BoardArea: React.FC<BoardAreaProps> = ({
  board,
  layout,
  highlightedAnchor,
  highlightedTileIsDouble = false,
  previewAnchor,
  previewTile,
  onTransitionActiveChange,
}) => {
  const progress = useSharedValue(1);
  const previousSnapshotRef = useRef<BoardSnapshot | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [activeTransition, setActiveTransition] = useState<Readonly<{
    key: string;
    plan: BoardLayoutTransitionPlan;
  }> | null>(null);
  const isTransitionActive = activeTransition !== null;
  const tilePlans = useMemo(
    () =>
      activeTransition?.plan.tilePlans ??
      layout.geometry.placedTiles.map(createStaticTileTransitionPlan),
    [activeTransition, layout.geometry.placedTiles],
  );
  const stackedTilePlans = useMemo(() => {
    const stackOrder = computeBoardTileStackOrder(
      tilePlans.map((tilePlan) => tilePlan.to),
    );
    const tilePlanById = new Map(
      tilePlans.map((tilePlan) => [tilePlan.tileId, tilePlan] as const),
    );

    return stackOrder.map((stackEntry) => ({
      plan: tilePlanById.get(stackEntry.tileId)!,
      zIndex: stackEntry.zIndex,
    }));
  }, [tilePlans]);
  const tileZIndexById = useMemo(
    () =>
      new Map<TileId, number>(
        stackedTilePlans.map(({ plan, zIndex }) => [plan.tileId, zIndex] as const),
      ),
    [stackedTilePlans],
  );
  const cameraFrom = activeTransition?.plan.cameraFrom ?? layout.camera;
  const cameraTo = activeTransition?.plan.cameraTo ?? layout.camera;
  const visibleAnchors = useMemo(
    () =>
      isTransitionActive
        ? []
        : layout.geometry.anchors.filter((anchor) => anchor.ownerTileId !== null),
    [isTransitionActive, layout.geometry.anchors],
  );
  const highlightedOpenSlot = useMemo(
    () =>
      !isTransitionActive && highlightedAnchor
        ? createOpenSlotFromAnchor(highlightedAnchor, {
            isDouble: highlightedTileIsDouble,
          })
        : null,
    [highlightedAnchor, highlightedTileIsDouble, isTransitionActive],
  );
  const highlightedShellOrientation = useMemo(
    () =>
      highlightedOpenSlot
        ? resolvePreviewShellOrientation(
            highlightedOpenSlot.visualDirection,
            highlightedTileIsDouble,
            highlightedAnchor,
          )
        : null,
    [highlightedAnchor, highlightedOpenSlot, highlightedTileIsDouble],
  );
  const highlightedOpenSlotZIndex = useMemo(
    () =>
      resolveOpenSlotZIndex(
        highlightedAnchor,
        highlightedOpenSlot?.visualDirection,
        tileZIndexById,
        SNAP_HIGHLIGHT_Z_INDEX,
      ),
    [highlightedAnchor, highlightedOpenSlot?.visualDirection, tileZIndexById],
  );
  const previewTileZIndex = useMemo(
    () =>
      resolveOpenSlotZIndex(
        previewAnchor,
        previewAnchor?.visualDirection ?? previewAnchor?.direction,
        tileZIndexById,
        PREVIEW_TILE_Z_INDEX,
      ),
    [previewAnchor, tileZIndexById],
  );
  const worldStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolateNumber(
          progress.value,
          cameraFrom.scale,
          cameraTo.scale,
        ),
      },
      {
        translateX: interpolateNumber(
          progress.value,
          cameraFrom.translateX,
          cameraTo.translateX,
        ),
      },
      {
        translateY: interpolateNumber(
          progress.value,
          cameraFrom.translateY,
          cameraTo.translateY,
        ),
      },
    ],
  }));

  useEffect(() => {
    const previousSnapshot = previousSnapshotRef.current;

    if (previousSnapshot) {
      const nextPlan = buildBoardLayoutTransitionPlan({
        previousBoard: previousSnapshot.board,
        previousLayout: previousSnapshot.layout,
        nextBoard: board,
        nextLayout: layout,
      });

      if (nextPlan) {
        setActiveTransition({
          key: board.tiles.map((tile) => tile.tile.id).join("|"),
          plan: nextPlan,
        });
      }
    }

    previousSnapshotRef.current = { board, layout };
  }, [board, layout]);

  useEffect(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    if (!activeTransition) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: BOARD_LAYOUT_TRANSITION_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
    });

    transitionTimeoutRef.current = setTimeout(() => {
      setActiveTransition((current) =>
        current?.key === activeTransition.key ? null : current,
      );
      transitionTimeoutRef.current = null;
    }, BOARD_LAYOUT_TRANSITION_DURATION_MS);

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [activeTransition, progress]);

  useEffect(() => {
    onTransitionActiveChange?.(isTransitionActive);

    return () => {
      onTransitionActiveChange?.(false);
    };
  }, [isTransitionActive, onTransitionActiveChange]);

  return (
    <View style={styles.container}>
      <View style={styles.viewport}>
        <Animated.View style={[styles.world, worldStyle]}>
          {stackedTilePlans.map(({ plan, zIndex }) => (
            <AnimatedBoardTile
              key={plan.tileId}
              plan={plan}
              progress={progress}
              zIndex={zIndex}
            />
          ))}

          {previewTile && (
            <View
              pointerEvents="none"
              style={[
                styles.previewTileWrapper,
                {
                  left: previewTile.center.x - previewTile.width / 2,
                  top: previewTile.center.y - previewTile.height / 2,
                  zIndex: previewTileZIndex,
                },
              ]}
            >
              <DominoTile
                value1={previewTile.value1}
                value2={previewTile.value2}
                orientation={rotationDegToOrientation(previewTile.rotationDeg)}
                state="ghost"
                pose={PREVIEW_TILE_POSE}
              />
            </View>
          )}

          {highlightedOpenSlot && (
            <View
              pointerEvents="none"
              style={[
                styles.snapHighlightWrapper,
                {
                  left: highlightedOpenSlot.rect.x,
                  top: highlightedOpenSlot.rect.y,
                  zIndex: highlightedOpenSlotZIndex,
                },
              ]}
            >
              <DominoTileHighlightShell
                key={`${highlightedOpenSlot.rect.x}:${highlightedOpenSlot.rect.y}:${highlightedOpenSlot.rect.width}:${highlightedOpenSlot.rect.height}:${highlightedShellOrientation}`}
                orientation={highlightedShellOrientation ?? "up"}
                appearance={{ showSelectionOutline: false }}
                pose={SNAP_HIGHLIGHT_POSE}
              />
            </View>
          )}
          {visibleAnchors.map((anchor) => (
            <View
              key={anchor.id}
              style={[
                styles.anchor,
                {
                  left: anchor.attachmentPoint.x - ANCHOR_RADIUS,
                  top: anchor.attachmentPoint.y - ANCHOR_RADIUS,
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const AnimatedBoardTile = React.memo(function AnimatedBoardTile({
  plan,
  progress,
  zIndex,
}: Readonly<{
  plan: TileTransitionPlan;
  progress: SharedValue<number>;
  zIndex: number;
}>) {
  const baseOrientation = rotationDegToOrientation(plan.from.rotationDeg);
  const animatedStyle = useAnimatedStyle(() => {
    const currentCenter = getAnimatedTileCenter(plan, progress.value);
    const currentRotationDeg = getAnimatedTileRotation(plan, progress.value);

    return {
      left: currentCenter.x - plan.from.width / 2,
      top: currentCenter.y - plan.from.height / 2,
      opacity: interpolateNumber(progress.value, plan.opacityFrom, 1),
      zIndex,
      transform: [
        {
          rotate: `${currentRotationDeg - plan.from.rotationDeg}deg`,
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.tileWrapper, animatedStyle]}>
      <DominoTile
        value1={plan.from.value1}
        value2={plan.from.value2}
        orientation={baseOrientation}
        pose={BOARD_TILE_POSE}
      />
    </Animated.View>
  );
});

function rotationDegToOrientation(rotationDeg: number): DominoOrientation {
  const normalizedRotation = normalizeDegrees(rotationDeg);

  if (normalizedRotation === 90) {
    return "right";
  }

  if (normalizedRotation === 180) {
    return "down";
  }

  if (normalizedRotation === 270) {
    return "left";
  }

  return "up";
}

function resolvePreviewShellOrientation(
  visualDirection: DominoOrientation,
  isDouble: boolean,
  highlightedAnchor?: LayoutAnchor | null,
): DominoOrientation {
  if (!isDouble) {
    return visualDirection;
  }

  if (highlightedAnchor?.ownerTileId === null && highlightedAnchor.id === "initial") {
    return "up";
  }

  if (visualDirection === "left" || visualDirection === "right") {
    return "up";
  }

  return "right";
}

function getAnimatedTileCenter(
  plan: TileTransitionPlan,
  progress: number,
): Point {
  "worklet";

  const rotatePointInPlace = (
    point: Point,
    pivot: Point,
    angleDeg: number,
  ): Point => {
    "worklet";

    if (angleDeg === 0) {
      return point;
    }

    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const offsetX = point.x - pivot.x;
    const offsetY = point.y - pivot.y;

    return {
      x: pivot.x + offsetX * cos - offsetY * sin,
      y: pivot.y + offsetX * sin + offsetY * cos,
    };
  };

  let center = plan.from.center;

  if (plan.boardRotation) {
    center = rotatePointInPlace(
      center,
      plan.boardRotation.pivot,
      plan.boardRotation.angleDeg * progress,
    );
  }

  if (plan.bendRotation) {
    const bendPivot = plan.boardRotation
      ? rotatePointInPlace(
          plan.bendRotation.pivot,
          plan.boardRotation.pivot,
          plan.boardRotation.angleDeg * progress,
        )
      : plan.bendRotation.pivot;

    center = rotatePointInPlace(
      center,
      bendPivot,
      plan.bendRotation.angleDeg * progress,
    );
  }

  return {
    x: center.x + plan.residualTranslation.x * progress,
    y: center.y + plan.residualTranslation.y * progress,
  };
}

function getAnimatedTileRotation(
  plan: TileTransitionPlan,
  progress: number,
): number {
  "worklet";

  let rotationDeg = plan.from.rotationDeg;

  if (plan.boardRotation) {
    rotationDeg += plan.boardRotation.angleDeg * progress;
  }

  if (plan.bendRotation) {
    rotationDeg += plan.bendRotation.angleDeg * progress;
  }

  rotationDeg += plan.residualRotationDeg * progress;

  return rotationDeg;
}

function interpolateNumber(progress: number, from: number, to: number): number {
  "worklet";

  return from + (to - from) * progress;
}

function normalizeDegrees(angleDeg: number): number {
  const normalized = angleDeg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  viewport: {
    ...StyleSheet.absoluteFillObject,
  },
  world: {
    ...StyleSheet.absoluteFillObject,
    transformOrigin: [0, 0, 0],
  },
  tileWrapper: {
    position: "absolute",
  },
  previewTileWrapper: {
    position: "absolute",
  },
  anchor: {
    position: "absolute",
    width: ANCHOR_SIZE,
    height: ANCHOR_SIZE,
    borderRadius: ANCHOR_RADIUS,
    backgroundColor: theme.colors.blue,
    opacity: 0.3,
    zIndex: ANCHOR_Z_INDEX,
  },
  snapHighlightWrapper: {
    position: "absolute",
  },
}));
