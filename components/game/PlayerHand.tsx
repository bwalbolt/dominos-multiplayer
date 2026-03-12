import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { DraggableHandTile } from "./DraggableHandTile";
import { spacing } from "@/theme/tokens";

import { TileId } from "@/src/game-domain/types";

interface PlayerHandProps {
  hand: { id: TileId; value1: number; value2: number }[];
  playableTileIds: Set<TileId>;
  onDragStart: (tileId: TileId) => void;
  onDragUpdate: (x: number, y: number) => void;
  onDragEnd: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ 
  hand,
  playableTileIds,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}) => {
  return (
    <View style={styles.container}>
      {hand.map((tile) => (
        <View key={tile.id} style={styles.tileWrapper}>
          <DraggableHandTile
            tileId={tile.id}
            value1={tile.value1}
            value2={tile.value2}
            isPlayable={playableTileIds.has(tile.id)}
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={onDragEnd}
          />
        </View>
      ))}
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
  tileWrapper: {
    marginHorizontal: 1, // Tight spacing like Figma
  },
}));
