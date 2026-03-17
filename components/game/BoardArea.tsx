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

import { DominoTile } from "@/components/domino/domino-tile";
import { DominoOrientation } from "@/components/domino/domino-tile.types";
import {
  buildBoardLayoutTransitionPlan,
  createStaticTileTransitionPlan,
  TileTransitionPlan,
} from "@/src/game-domain/layout/animation-plan";
import { computeBoardTileStackOrder } from "@/src/game-domain/layout/board-depth";
import {
  BoardLayoutSolution,
  LayoutAnchor,
  Point,
} from "@/src/game-domain/layout/types";
import { BoardState } from "@/src/game-domain/types";
import { domino, spacing } from "@/theme/tokens";

const BOARD_LAYOUT_TRANSITION_DURATION_MS = 320;
const SNAP_HIGHLIGHT_SIZE = domino.width;
const SNAP_HIGHLIGHT_RADIUS = SNAP_HIGHLIGHT_SIZE / 2;
const ANCHOR_SIZE = spacing[8];
const ANCHOR_RADIUS = ANCHOR_SIZE / 2;

type BoardSnapshot = Readonly<{
  board: BoardState;
  layout: BoardLayoutSolution;
}>;

interface BoardAreaProps {
  board: BoardState;
  layout: BoardLayoutSolution;
  activeSnap?: LayoutAnchor | null;
}

export const BoardArea: React.FC<BoardAreaProps> = ({
  board,
  layout,
  activeSnap,
}) => {
  const progress = useSharedValue(1);
  const previousSnapshotRef = useRef<BoardSnapshot | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [completedTransitionKey, setCompletedTransitionKey] = useState<string | null>(
    null,
  );
  const previousSnapshot = previousSnapshotRef.current;
  const transitionPlan = useMemo(() => {
    if (!previousSnapshot) {
      return null;
    }

    return buildBoardLayoutTransitionPlan({
      previousBoard: previousSnapshot.board,
      previousLayout: previousSnapshot.layout,
      nextBoard: board,
      nextLayout: layout,
    });
  }, [board, layout, previousSnapshot]);
  const transitionKey = useMemo(() => {
    if (!transitionPlan) {
      return null;
    }

    return board.tiles.map((tile) => tile.tile.id).join("|");
  }, [board.tiles, transitionPlan]);
  const isTransitionActive =
    transitionPlan !== null &&
    transitionKey !== null &&
    completedTransitionKey !== transitionKey;
  const tilePlans = useMemo(
    () =>
      (isTransitionActive ? transitionPlan?.tilePlans : null) ??
      layout.geometry.placedTiles.map(createStaticTileTransitionPlan),
    [isTransitionActive, layout.geometry.placedTiles, transitionPlan],
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
  const cameraFrom =
    isTransitionActive ? transitionPlan?.cameraFrom ?? layout.camera : layout.camera;
  const cameraTo =
    isTransitionActive ? transitionPlan?.cameraTo ?? layout.camera : layout.camera;
  const worldStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolateNumber(progress.value, cameraFrom.scale, cameraTo.scale),
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
    previousSnapshotRef.current = { board, layout };
  }, [board, layout]);

  useEffect(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    if (!transitionPlan) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: BOARD_LAYOUT_TRANSITION_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
    });

    const finishingTransitionKey = transitionKey;
    transitionTimeoutRef.current = setTimeout(() => {
      if (finishingTransitionKey !== null) {
        setCompletedTransitionKey(finishingTransitionKey);
      }
      transitionTimeoutRef.current = null;
    }, BOARD_LAYOUT_TRANSITION_DURATION_MS);

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [progress, transitionKey, transitionPlan]);

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

          {activeSnap && (
            <View
              style={[
                styles.snapHighlight,
                {
                  left: activeSnap.attachmentPoint.x - SNAP_HIGHLIGHT_RADIUS,
                  top: activeSnap.attachmentPoint.y - SNAP_HIGHLIGHT_RADIUS,
                },
              ]}
            />
          )}
          {layout.geometry.anchors.map((anchor) => (
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

function AnimatedBoardTile({
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
      />
    </Animated.View>
  );
}

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

function interpolateNumber(
  progress: number,
  from: number,
  to: number,
): number {
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
  anchor: {
    position: "absolute",
    width: ANCHOR_SIZE,
    height: ANCHOR_SIZE,
    borderRadius: ANCHOR_RADIUS,
    backgroundColor: theme.colors.blue,
    opacity: 0.3,
  },
  snapHighlight: {
    position: "absolute",
    width: SNAP_HIGHLIGHT_SIZE,
    height: SNAP_HIGHLIGHT_SIZE,
    borderRadius: SNAP_HIGHLIGHT_RADIUS,
    backgroundColor: theme.colors.blue,
    opacity: 0.2,
  },
}));
