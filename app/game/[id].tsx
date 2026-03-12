import { BoardArea } from "@/components/game/BoardArea";
import { BoardHeader } from "@/components/game/BoardHeader";
import { BoneyardIndicator } from "@/components/game/BoneyardIndicator";
import { OpponentHand } from "@/components/game/OpponentHand";
import { PlayerHand } from "@/components/game/PlayerHand";
import {
  TileDrawnEvent,
  TilePlayedEvent,
  TurnPassedEvent,
} from "@/src/game-domain/events/schema";
import { useBoardCamera } from "@/src/game-domain/layout/useBoardCamera";
import { useBoardInteraction } from "@/src/game-domain/layout/useBoardInteraction";
import { useLocalSessionStore } from "@/src/game-domain/local-session-store";
import { EventId, PlayerId, TileId } from "@/src/game-domain/types";
import { evaluateFivesLegalMoves } from "@/src/game-domain/variants/fives";
import { colors, spacing, typography } from "@/theme/tokens";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";
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

  if (
    !reconstruction ||
    !reconstruction.game ||
    !reconstruction.game.currentRound
  ) {
    return <View style={styles.container} />;
  }

  return (
    <GameView
      game={reconstruction.game}
      tileCatalog={reconstruction.tileCatalog}
    />
  );
}

interface GameViewProps {
  game: any; // GameState
  tileCatalog: any; // Record<TileId, Tile>
}

function GameView({ game, tileCatalog }: GameViewProps) {
  const player1Id = "p1" as PlayerId;
  const player2Id = "p2" as PlayerId;

  const playerState = game.playerStateById[player1Id];
  const opponentState = game.playerStateById[player2Id];
  const currentRound = game.currentRound!;

  const { playerHandIds, playerHand } = useMemo(() => {
    const ids = currentRound.handsByPlayerId[player1Id]?.tileIds || [];
    const hand = ids.map((tileId: TileId) => {
      const tile = tileCatalog[tileId];
      return { id: tileId, value1: tile.sideA, value2: tile.sideB };
    });
    return { playerHandIds: ids, playerHand: hand };
  }, [currentRound.handsByPlayerId, player1Id, tileCatalog]);

  const opponentHandCount =
    currentRound.handsByPlayerId[player2Id]?.handCount || 0;
  const boneyardCount = currentRound.boneyard.remainingCount;
  const isPlayerTurn = game.turn?.activePlayerId === player1Id;

  const opponentProfile = game.players.find(
    (p: any) => p.playerId === player2Id,
  );

  const { transform, onLayout, geometry, viewRef, containerOffset } =
    useBoardCamera(currentRound.board);

  const legalMoves = useMemo(() => {
    return evaluateFivesLegalMoves({
      board: currentRound.board,
      handTileIds: playerHandIds,
      tileCatalog,
      isOpeningMove: currentRound.board.tiles.length === 0,
    }).moves;
  }, [currentRound, playerHandIds, tileCatalog]);

  const {
    draggedTileId,
    activeSnap,
    previewGeometry,
    onDragStart,
    onDragUpdate,
    onDragEnd,
  } = useBoardInteraction(
    geometry.anchors,
    legalMoves,
    tileCatalog,
    transform,
    containerOffset,
  );

  const {
    appendEvent,
    events,
    initialize,
    seed: storedSeed,
  } = useLocalSessionStore();

  const playableTileIds = useMemo(
    () => new Set(legalMoves.map((m) => m.tileId)),
    [legalMoves],
  );

  const handleDraw = useCallback(() => {
    if (!currentRound) return;
    const tileId = currentRound.boneyard.tileIds[0];

    if (tileId) {
      const event: TileDrawnEvent = {
        eventId: Math.random().toString(36).substring(7) as EventId,
        gameId: game.gameId,
        eventSeq: events.length + 1,
        type: "TILE_DRAWN",
        version: 1,
        occurredAt: new Date().toISOString(),
        playerId: player1Id,
        roundId: currentRound.roundId,
        tileId,
        source: "boneyard",
      };
      appendEvent(event);
    } else {
      // Boneyard empty, pass turn
      const event: TurnPassedEvent = {
        eventId: Math.random().toString(36).substring(7) as EventId,
        gameId: game.gameId,
        eventSeq: events.length + 1,
        type: "TURN_PASSED",
        version: 1,
        occurredAt: new Date().toISOString(),
        playerId: player1Id,
        roundId: currentRound.roundId,
        reason: "boneyard_empty",
      };
      appendEvent(event);
    }
  }, [currentRound, game.gameId, events.length, player1Id, appendEvent]);

  const handleDragEnd = useCallback(() => {
    const move = onDragEnd();
    if (move && currentRound) {
      const event: TilePlayedEvent = {
        eventId: Math.random().toString(36).substring(7) as EventId,
        gameId: game.gameId,
        eventSeq: events.length + 1,
        type: "TILE_PLAYED",
        version: 1,
        occurredAt: new Date().toISOString(),
        playerId: player1Id,
        roundId: currentRound.roundId,
        tileId: move.tileId,
        side: move.side,
        openPipFacingOutward: move.openPipFacingOutward,
      };
      appendEvent(event);
    }
  }, [
    onDragEnd,
    currentRound,
    game.gameId,
    events.length,
    player1Id,
    appendEvent,
  ]);

  const [showDevTools, setShowDevTools] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.moreOptionsTrigger}
        onPress={() => setShowDevTools(!showDevTools)}
      >
        <View style={styles.moreOptions}>
          <Image
            source={require("@/assets/images/icons/nav-more.svg")}
            style={styles.moreIcon}
            contentFit="contain"
          />
        </View>
      </Pressable>

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

        <View ref={viewRef} style={styles.boardContainer} onLayout={onLayout}>
          <BoardArea
            board={currentRound.board}
            transform={transform}
            previewGeometry={previewGeometry}
            activeSnap={activeSnap}
          />
        </View>

        {/* Draw button when stuck */}
        {isPlayerTurn && playableTileIds.size === 0 && !draggedTileId && (
          <View style={styles.drawButtonContainer}>
            <Pressable style={styles.drawButton} onPress={handleDraw}>
              <Text style={styles.drawButtonText}>
                {boneyardCount > 0 ? "Draw Tile" : "Pass Turn"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Gradients behind player hand */}
        <View style={styles.gradientContainer} pointerEvents="none">
          {/* Player turn blue glow gradient (216px) */}
          {isPlayerTurn && (
            <View style={styles.turnGradient}>
              <Svg
                style={styles.svgFill}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <Defs>
                  <LinearGradient id="blue-grad" x1="0" y1="1" x2="0" y2="0">
                    <Stop offset="0" stopColor="#0EA5E9" stopOpacity="0.16" />
                    <Stop offset="1" stopColor="#0EA5E9" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  fill="url(#blue-grad)"
                />
              </Svg>
            </View>
          )}

          {/* Static black hand background gradient (80px) */}
          <View style={styles.handGradient}>
            <Svg
              style={styles.svgFill}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
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
                width="100"
                height="100"
                fill="url(#black-grad)"
              />
            </Svg>
          </View>
        </View>

        <View style={styles.handWrapper}>
          <PlayerHand
            hand={playerHand}
            playableTileIds={playableTileIds}
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={handleDragEnd}
          />
        </View>
      </View>

      {showDevTools && (
        <View style={styles.devTools}>
          <Text style={styles.devTitle}>Developer Tools</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              style={styles.devButton}
              onPress={() => initialize(storedSeed || 123)}
            >
              <Text style={styles.devButtonText}>Reset Session</Text>
            </Pressable>

            <Pressable
              style={styles.devButton}
              onPress={() => {
                // Force a seed that we know has a double five for example
                initialize(55);
              }}
            >
              <Text style={styles.devButtonText}>Seed 55</Text>
            </Pressable>

            <Pressable
              style={styles.devButton}
              onPress={() => setShowDevTools(false)}
            >
              <Text style={styles.devButtonText}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}
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
  boardContainer: {
    flex: 1,
    zIndex: 1,
  },
  handWrapper: {
    zIndex: 5,
  },

  boneyardWrapper: {
    position: "absolute",
    left: 0,
    top: 40, // Below header
    zIndex: 10,
  },
  drawButtonContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  drawButton: {
    backgroundColor: colors.blue,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[24],
    borderRadius: 99,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  drawButtonText: {
    color: colors.white,
    ...typography.paragraph,
    fontWeight: "600",
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  svgFill: {
    width: "100%",
    height: "100%",
  },
  turnGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 216,
  },
  handGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  moreOptionsTrigger: {
    position: "absolute",
    bottom: 160,
    left: spacing[16],
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  moreOptions: {
    width: spacing[40],
    height: spacing[40],
    backgroundColor: theme.colors.backgroundColor,
    borderWidth: 1,
    borderColor: theme.colors.black08,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  moreIcon: {
    width: 18,
    height: 12,
    tintColor: theme.colors.black45,
  },
  devTools: {
    position: "absolute",
    bottom: 180,
    left: spacing[16],
    right: spacing[16],
    backgroundColor: "rgba(0,0,0,0.85)",
    padding: spacing[16],
    borderRadius: 16,
    zIndex: 1000,
  },
  devTitle: {
    color: colors.white,
    ...typography.smallText,
    marginBottom: spacing[8],
    opacity: 0.6,
  },
  devButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
    borderRadius: 8,
    marginRight: spacing[8],
  },
  devButtonText: {
    color: colors.white,
    ...typography.smallText,
  },
}));
