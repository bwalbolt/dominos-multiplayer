import React, { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native-unistyles";

import { DraggableHandTile } from "./DraggableHandTile";
import { resolveHandTileInteractionEnabled } from "./hand-interaction";
import { HandTileDragStart } from "./hand-drag.types";
import { spacing } from "@/theme/tokens";

import { DominoPip, TileId } from "@/src/game-domain/types";

interface PlayerHandProps {
  hand: { id: TileId; value1: DominoPip; value2: DominoPip }[];
  playableTileIds: Set<TileId>;
  isInteractionEnabled: boolean;
  hiddenTileIds: ReadonlySet<TileId>;
  hasActiveDrag: boolean;
  activeTileId: TileId | null;
  onDragStart: (dragStart: HandTileDragStart) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ 
  hand,
  playableTileIds,
  isInteractionEnabled,
  hiddenTileIds,
  hasActiveDrag,
  activeTileId,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}) => {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const tileWrapperRefs = useRef<Record<TileId, View | null>>({} as Record<
    TileId,
    View | null
  >);
  const isScrollable = hand.length >= 8;

  const setTileWrapperRef = useCallback(
    (tileId: TileId) => (view: View | null) => {
      tileWrapperRefs.current[tileId] = view;
    },
    [],
  );

  const handleDragStart = useCallback(
    (tileId: TileId) => {
      const tileWrapper = tileWrapperRefs.current[tileId];

      if (!tileWrapper) {
        return;
      }

      tileWrapper.measureInWindow((x, y, width, height) => {
        setIsDraggingAny(true);
        onDragStart({
          tileId,
          sourceRect: { x, y, width, height },
        });
      });
    },
    [onDragStart],
  );

  const handleDragEnd = () => {
    setIsDraggingAny(false);
    onDragEnd();
  };

  const content = (
    <>
      {hand.map((tile) => (
        <View
          key={tile.id}
          ref={setTileWrapperRef(tile.id)}
          collapsable={false}
          style={styles.tileWrapper}
        >
          <DraggableHandTile
            tileId={tile.id}
            value1={tile.value1}
            value2={tile.value2}
            isPlayable={playableTileIds.has(tile.id)}
            isHidden={hiddenTileIds.has(tile.id)}
            isInteractionEnabled={resolveHandTileInteractionEnabled({
              tileId: tile.id,
              isInteractionEnabled,
              hasActiveDrag,
              activeTileId,
            })}
            usesVerticalDragActivation={isScrollable}
            onDragStart={handleDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={handleDragEnd}
          />
        </View>
      ))}
    </>
  );

  if (isScrollable) {
    return (
      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isDraggingAny && !hasActiveDrag}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: spacing[24],
    paddingHorizontal: spacing[8],
  },
  scrollWrapper: {
    width: "100%",
  },
  scrollContent: {
    flexDirection: "row",
    paddingBottom: spacing[24],
    paddingHorizontal: spacing[16],
    // Ensure small hands in scroll-mode are still centered if they somehow trigger this
    justifyContent: "center",
    minWidth: "100%",
  },
  tileWrapper: {
    marginHorizontal: 1, // Tight spacing like Figma
  },
}));
