import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { DraggableHandTile } from "./DraggableHandTile";
import { spacing } from "@/theme/tokens";

import { TileId } from "@/src/game-domain/types";

interface PlayerHandProps {
  hand: { id: TileId; value1: number; value2: number }[];
  playableTileIds: Set<TileId>;
  isInteractionEnabled: boolean;
  onDragStart: (tileId: TileId) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ 
  hand,
  playableTileIds,
  isInteractionEnabled,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}) => {
  // Lock horizontal scrolling while a tile is being dragged
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  const handleDragStart = (tileId: TileId) => {
    setIsDraggingAny(true);
    onDragStart(tileId);
  };

  const handleDragEnd = () => {
    setIsDraggingAny(false);
    onDragEnd();
  };

  const isScrollable = hand.length >= 8;

  const content = (
    <>
      {hand.map((tile) => (
        <View key={tile.id} style={styles.tileWrapper}>
          <DraggableHandTile
            tileId={tile.id}
            value1={tile.value1}
            value2={tile.value2}
            isPlayable={playableTileIds.has(tile.id)}
            isInteractionEnabled={isInteractionEnabled}
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
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isDraggingAny}
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
