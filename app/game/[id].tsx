import { BoardArea } from "@/components/game/BoardArea";
import { BoardHeader } from "@/components/game/BoardHeader";
import { BoneyardIndicator } from "@/components/game/BoneyardIndicator";
import { OpponentHand } from "@/components/game/OpponentHand";
import { PlayerHand } from "@/components/game/PlayerHand";
import { useLocalSessionStore } from "@/src/game-domain/local-session-store";
import { PlayerId, TileId } from "@/src/game-domain/types";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reconstruction, initialize, seed } = useLocalSessionStore();

  // Use the ID as a seed for deterministic local play
  const numericSeed = useMemo(() => {
    if (!id) return 123;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? 123 : parsed;
  }, [id]);

  useEffect(() => {
    // Only initialize if the seed changes or if not already initialized
    if (seed !== numericSeed) {
      initialize(numericSeed);
    }
  }, [numericSeed, initialize, seed]);

  if (!reconstruction || !reconstruction.game) {
    return <View style={styles.container} />;
  }

  const { game, tileCatalog } = reconstruction;
  const player1Id = "p1" as PlayerId;
  const player2Id = "p2" as PlayerId;

  const playerState = game.playerStateById[player1Id];
  const opponentState = game.playerStateById[player2Id];
  const currentRound = game.currentRound;

  if (!currentRound) {
    return <View style={styles.container} />;
  }

  const playerHandIds = currentRound.handsByPlayerId[player1Id]?.tileIds || [];
  const playerHand = playerHandIds.map((tileId: TileId) => {
    const tile = tileCatalog[tileId];
    return { value1: tile.sideA, value2: tile.sideB };
  });

  const opponentHandCount =
    currentRound.handsByPlayerId[player2Id]?.handCount || 0;
  const boneyardCount = currentRound.boneyard.remainingCount;
  const isPlayerTurn = game.turn?.activePlayerId === player1Id;

  const opponentProfile = game.players.find((p) => p.playerId === player2Id);

  return (
    <View style={styles.container}>
      <BoardHeader
        opponentName={opponentProfile?.displayName || "Opponent"}
        opponentTitle="Novice" // Static for now as per Figma
        opponentAvatar={require("@/assets/images/avatar(9).png")} // Placeholder
        playerScore={playerState.score}
        opponentScore={opponentState.score}
      />

      <View style={styles.content}>
        <OpponentHand count={opponentHandCount} />

        <View style={styles.boneyardWrapper}>
          <BoneyardIndicator count={boneyardCount} />
        </View>

        <BoardArea />

        {/* Gradients behind player hand */}
        <View style={styles.gradientContainer} pointerEvents="none">
          {/* Player turn blue glow gradient (216px) */}
          {isPlayerTurn && (
            <View style={styles.turnGradient}>
              <Svg width="100%" height="100%" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="blue-grad" x1="0" y1="1" x2="0" y2="0">
                    <Stop offset="0" stopColor="#0EA5E9" stopOpacity="0.16" />
                    <Stop offset="1" stopColor="#0EA5E9" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#blue-grad)"
                />
              </Svg>
            </View>
          )}

          {/* Static black hand background gradient (80px) */}
          <View style={styles.handGradient}>
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="black-grad" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor="#000000" stopOpacity="0.3" />
                  <Stop offset="0.6" stopColor="#000000" stopOpacity="0.1" />
                  <Stop offset="1" stopColor="#000000" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#black-grad)"
              />
            </Svg>
          </View>
        </View>

        <PlayerHand hand={playerHand} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundColor,
  },
  content: {
    flex: 1,
  },
  boneyardWrapper: {
    position: "absolute",
    left: 0,
    top: 32,
    zIndex: 10,
  },
  gradientContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 216,
    zIndex: 0,
  },
  turnGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 216,
  },
  handGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
}));
