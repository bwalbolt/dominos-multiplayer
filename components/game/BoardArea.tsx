import React, { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { DominoTile } from "@/components/domino/domino-tile";
import { calculateBoardGeometry } from "@/src/game-domain/layout/anchors";
import {
  CameraTransform,
  LayoutAnchor,
  PlacedTileGeometry,
} from "@/src/game-domain/layout/types";
import { BoardState } from "@/src/game-domain/types";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

interface BoardAreaProps {
  board: BoardState;
  transform: CameraTransform;
  previewGeometry?: PlacedTileGeometry | null;
  activeSnap?: LayoutAnchor | null;
}

export const BoardArea: React.FC<BoardAreaProps> = ({
  board,
  transform,
  previewGeometry,
  activeSnap,
}) => {
  const geometry = useMemo(() => calculateBoardGeometry(board), [board]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: transform.translateX },
        { translateY: transform.translateY },
        { scale: transform.scale },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.viewport, animatedStyle]}>
        {/* Existing tiles */}
        {geometry.placedTiles.map((tile) => {
          const orientation =
            tile.rotationDeg === 0
              ? "up"
              : tile.rotationDeg === 90
                ? "right"
                : tile.rotationDeg === 180
                  ? "down"
                  : "left";

          return (
            <View
              key={tile.tileId}
              style={[
                styles.tileWrapper,
                {
                  left: tile.center.x - tile.width / 2,
                  top: tile.center.y - tile.height / 2,
                },
              ]}
            >
              <DominoTile
                value1={tile.value1 as any}
                value2={tile.value2 as any}
                orientation={orientation as any}
              />
            </View>
          );
        })}

        {/* Snap target highlight */}
        {activeSnap && (
          <View
            style={[
              styles.snapHighlight,
              {
                left: activeSnap.attachmentPoint.x - 28,
                top: activeSnap.attachmentPoint.y - 28,
              },
            ]}
          />
        )}

        {/* Preview tile while dragging */}
        {previewGeometry && (
          <View
            style={[
              styles.tileWrapper,
              {
                left: previewGeometry.center.x - previewGeometry.width / 2,
                top: previewGeometry.center.y - previewGeometry.height / 2,
                zIndex: 100,
              },
            ]}
          >
            <DominoTile
              value1={previewGeometry.value1 as any}
              value2={previewGeometry.value2 as any}
              orientation={
                previewGeometry.rotationDeg === 0
                  ? "up"
                  : previewGeometry.rotationDeg === 90
                    ? "right"
                    : previewGeometry.rotationDeg === 180
                      ? "down"
                      : "left"
              }
              state="idle"
            />
          </View>
        )}

        {/* Legal move anchors (debug/hint) */}
        {geometry.anchors.map((anchor) => (
          <View
            key={anchor.id}
            style={[
              styles.anchor,
              {
                left: anchor.attachmentPoint.x - 4,
                top: anchor.attachmentPoint.y - 4,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },

  viewport: {
    width: "100%",
    height: "100%",
  },
  tileWrapper: {
    position: "absolute",
  },
  anchor: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.blue,
    opacity: 0.3,
  },
  snapHighlight: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.blue,
    opacity: 0.2,
  },
}));
