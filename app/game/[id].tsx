import { BoardArea } from "@/components/game/BoardArea";
import { BoardHeader } from "@/components/game/BoardHeader";
import { BoneyardIndicator } from "@/components/game/BoneyardIndicator";
import { OpenEndsIndicator } from "@/components/game/OpenEndsIndicator";
import { OpponentHand } from "@/components/game/OpponentHand";
import { PlayerHand } from "@/components/game/PlayerHand";
import { getComputerAction } from "@/src/game-domain/computer-player";
import {
  GameEndedEvent,
  GameEvent,
  RoundEndedEvent,
  TileDrawnEvent,
  TilePlayedEvent,
  TurnPassedEvent,
} from "@/src/game-domain/events/schema";
import { useBoardCamera } from "@/src/game-domain/layout/useBoardCamera";
import { useBoardInteraction } from "@/src/game-domain/layout/useBoardInteraction";
import { createRoundStartedEvent } from "@/src/game-domain/local-session";
import { useLocalSessionStore } from "@/src/game-domain/local-session-store";
import {
  EventId,
  PlayerId,
  ReconstructionState,
  TileId,
} from "@/src/game-domain/types";
import {
  calculateOpenEndsTotal,
  evaluateFivesLegalMoves,
} from "@/src/game-domain/variants/fives";
import {
  checkGameWinner,
  evaluateRoundResolution,
} from "@/src/game-domain/variants/fives/round-resolution";
import { colors, spacing, typography } from "@/theme/tokens";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

export default function GameScreen() {
  const { id, opponentName } = useLocalSearchParams<{
    id: string;
    opponentName?: string;
  }>();
  const { reconstruction, initialize, seed } = useLocalSessionStore();

  const getSeedFromGameId = useCallback((gameId?: string) => {
    if (!gameId) return 123;

    const parsed = Number.parseInt(gameId, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    const hashed = Array.from(gameId).reduce((accumulator, character) => {
      return (accumulator * 31 + character.charCodeAt(0)) >>> 0;
    }, 0);

    return hashed === 0 ? 123 : hashed;
  }, []);

  // Use the ID as a seed for deterministic local play
  const numericSeed = useMemo(() => {
    return getSeedFromGameId(id);
  }, [getSeedFromGameId, id]);

  useEffect(() => {
    // Only initialize if the seed changes or if not already initialized
    if (seed !== numericSeed) {
      initialize(numericSeed, opponentName);
    }
  }, [numericSeed, initialize, seed, opponentName]);

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
      reconstruction={reconstruction}
    />
  );
}

function GameView({
  game,
  tileCatalog,
  reconstruction,
}: {
  game: any;
  tileCatalog: any;
  reconstruction: ReconstructionState;
}) {
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
  const openEndsTotal = useMemo(() => {
    return calculateOpenEndsTotal(currentRound.board);
  }, [currentRound.board]);
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
      requiresOpeningDouble:
        currentRound.roundNumber === 1 && currentRound.board.tiles.length === 0,
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
    isPlayerTurn,
  );

  const {
    appendEvent,
    appendEvents,
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
    const tileId = currentRound.boneyard.remainingTileIds[0];

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
    if (!isPlayerTurn || !move || !currentRound) {
      return;
    }

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
  }, [
    onDragEnd,
    currentRound,
    game.gameId,
    events.length,
    isPlayerTurn,
    player1Id,
    appendEvent,
  ]);

  const [showDevTools, setShowDevTools] = useState(false);

  const resolution = useMemo(() => {
    if (!currentRound || currentRound.status !== "active") return null;
    return evaluateRoundResolution(currentRound, tileCatalog);
  }, [currentRound, tileCatalog]);

  // Automated Computer Turn
  useEffect(() => {
    const isComputerTurn = game.turn?.activePlayerId === player2Id;
    const isRoundActive = currentRound.status === "active";
    const noResolutionPending = !resolution;

    if (isComputerTurn && isRoundActive && noResolutionPending) {
      const timer = setTimeout(() => {
        const action = getComputerAction(reconstruction, player2Id);

        if (action.kind === "play") {
          const event: TilePlayedEvent = {
            eventId: Math.random().toString(36).substring(7) as EventId,
            gameId: game.gameId,
            eventSeq: events.length + 1,
            type: "TILE_PLAYED",
            version: 1,
            occurredAt: new Date().toISOString(),
            playerId: player2Id,
            roundId: currentRound.roundId,
            tileId: action.move.tileId,
            side: action.move.side,
            openPipFacingOutward: action.move.openPipFacingOutward,
          };
          appendEvent(event);
        } else if (action.kind === "draw") {
          const tileId = currentRound.boneyard.remainingTileIds[0];
          if (tileId) {
            const event: TileDrawnEvent = {
              eventId: Math.random().toString(36).substring(7) as EventId,
              gameId: game.gameId,
              eventSeq: events.length + 1,
              type: "TILE_DRAWN",
              version: 1,
              occurredAt: new Date().toISOString(),
              playerId: player2Id,
              roundId: currentRound.roundId,
              tileId,
              source: "boneyard",
            };
            appendEvent(event);
          }
        } else if (action.kind === "pass") {
          const event: TurnPassedEvent = {
            eventId: Math.random().toString(36).substring(7) as EventId,
            gameId: game.gameId,
            eventSeq: events.length + 1,
            type: "TURN_PASSED",
            version: 1,
            occurredAt: new Date().toISOString(),
            playerId: player2Id,
            roundId: currentRound.roundId,
            reason: "boneyard_empty",
          };
          appendEvent(event);
        }
      }, 1000); // 1 second delay for natural feel

      return () => clearTimeout(timer);
    }
  }, [
    game.turn?.activePlayerId,
    game.turn?.turnNumber,
    currentRound.status,
    resolution,
    reconstruction,
    player2Id,
    game.gameId,
    events.length,
    currentRound.roundId,
    currentRound.boneyard.remainingTileIds,
    appendEvent,
  ]);

  const advanceToNextRound = useCallback(() => {
    if (!resolution || !currentRound) return;

    // 1. Append ROUND_ENDED
    const roundEnded: RoundEndedEvent = {
      eventId: Math.random().toString(36).substring(7) as EventId,
      gameId: game.gameId,
      eventSeq: events.length + 1,
      type: "ROUND_ENDED",
      version: 1,
      occurredAt: new Date().toISOString(),
      roundId: currentRound.roundId,
      winnerPlayerId: resolution.winnerPlayerId,
      reason: resolution.reason as any,
      scoreAwarded: resolution.scoreAwarded,
      scoreByPlayerId: {
        [player1Id]:
          game.playerStateById[player1Id].score +
          (resolution.winnerPlayerId === player1Id
            ? resolution.scoreAwarded
            : 0),
        [player2Id]:
          game.playerStateById[player2Id].score +
          (resolution.winnerPlayerId === player2Id
            ? resolution.scoreAwarded
            : 0),
      },
      nextStartingPlayerId: resolution.winnerPlayerId || player1Id,
    };

    // 2. Check for game winner
    const nextScores = {
      [player1Id]:
        game.playerStateById[player1Id].score +
        (resolution.winnerPlayerId === player1Id ? resolution.scoreAwarded : 0),
      [player2Id]:
        game.playerStateById[player2Id].score +
        (resolution.winnerPlayerId === player2Id ? resolution.scoreAwarded : 0),
    };
    const gameWinner = checkGameWinner(nextScores, game.metadata.targetScore);

    if (gameWinner) {
      const gameEnded: GameEndedEvent = {
        eventId: Math.random().toString(36).substring(7) as EventId,
        gameId: game.gameId,
        eventSeq: events.length + 2,
        type: "GAME_ENDED",
        version: 1,
        occurredAt: new Date().toISOString(),
        roundId: currentRound.roundId,
        winnerPlayerId: gameWinner,
        reason: "target_score_reached",
        finalScoreByPlayerId: nextScores,
      };
      appendEvents([roundEnded, gameEnded]);
    } else {
      // 3. Append ROUND_STARTED for next round
      const nextRoundStarted = createRoundStartedEvent({
        gameId: game.gameId,
        eventSeq: events.length + 2,
        roundNumber: currentRound.roundNumber + 1,
        seed: storedSeed || 123,
        playerIds: [player1Id, player2Id],
        startingPlayerId: resolution.winnerPlayerId || player1Id,
      });
      appendEvents([roundEnded, nextRoundStarted]);
    }
  }, [
    resolution,
    currentRound,
    game.gameId,
    game.playerStateById,
    game.metadata.targetScore,
    events.length,
    player1Id,
    player2Id,
    storedSeed,
    appendEvents,
  ]);

  const forceHands = useCallback(() => {
    if (!currentRound) return;

    const newEvents: GameEvent[] = [];
    let nextEventSeq = events.length + 1;
    let nextRoundNumber = currentRound.roundNumber;

    // If a round is active, we must end it before starting a new one
    if (currentRound.status === "active" || currentRound.endedAt === null) {
      const roundEnded: RoundEndedEvent = {
        eventId: Math.random().toString(36).substring(7) as EventId,
        gameId: game.gameId,
        eventSeq: nextEventSeq++,
        type: "ROUND_ENDED",
        version: 1,
        occurredAt: new Date().toISOString(),
        roundId: currentRound.roundId,
        winnerPlayerId: player1Id,
        reason: "forfeit", // Using forfeit as a "skipped" reason
        scoreAwarded: 0,
        scoreByPlayerId: {
          [player1Id]: game.playerStateById[player1Id].score,
          [player2Id]: game.playerStateById[player2Id].score,
        },
        nextStartingPlayerId: player1Id,
      };
      newEvents.push(roundEnded);
      nextRoundNumber += 1;
    } else {
      nextRoundNumber += 1;
    }

    const doubleFive = "tile-5-5" as TileId;
    const doubleFour = "tile-4-4" as TileId;

    const nextRoundStarted = createRoundStartedEvent({
      gameId: game.gameId,
      eventSeq: nextEventSeq,
      roundNumber: nextRoundNumber,
      seed: storedSeed || 123,
      playerIds: [player1Id, player2Id],
      startingPlayerId: player1Id,
      forcePlayer1Hand: [
        doubleFive,
        "tile-0-0" as TileId,
        "tile-1-1" as TileId,
        "tile-2-2" as TileId,
        "tile-3-3" as TileId,
        "tile-4-4" as TileId,
        "tile-6-6" as TileId,
        "tile-0-1" as TileId,
      ],
      forcePlayer2Hand: [
        doubleFour,
        "tile-2-3" as TileId,
        "tile-3-4" as TileId,
      ],
    });
    newEvents.push(nextRoundStarted);

    appendEvents(newEvents);
  }, [
    currentRound,
    game.gameId,
    game.playerStateById,
    events.length,
    player1Id,
    player2Id,
    storedSeed,
    appendEvents,
  ]);

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.moreOptionsTrigger,
          pressed && styles.moreOptionsTriggerPressed,
        ]}
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
        opponentAvatar={require("@/assets/images/avatar(9).png")}
        playerScore={playerState.score}
        opponentScore={opponentState.score}
      />

      <View style={styles.content}>
        <OpponentHand
          count={opponentHandCount}
          isTurn={game.turn?.activePlayerId === player2Id}
        />

        <View style={styles.boneyardWrapper}>
          <OpenEndsIndicator total={openEndsTotal} />
          <BoneyardIndicator count={boneyardCount} />
        </View>

        <View ref={viewRef} style={styles.boardContainer} onLayout={onLayout}>
          <BoardArea
            geometry={geometry}
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
            isInteractionEnabled={isPlayerTurn}
            onDragStart={onDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={handleDragEnd}
          />
        </View>
      </View>

      {showDevTools && (
        <View style={styles.devTools}>
          <View style={styles.devHeader}>
            <Text style={styles.devTitle}>Developer Tools</Text>
            <Pressable onPress={() => setShowDevTools(false)}>
              <Text style={styles.devCloseText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              style={styles.devButton}
              onPress={() => initialize(storedSeed || 123)}
            >
              <Text style={styles.devButtonText}>Reset Seed</Text>
            </Pressable>

            <Pressable style={styles.devButton} onPress={forceHands}>
              <Text style={styles.devButtonText}>Force Hands (Test)</Text>
            </Pressable>

            <Pressable
              style={styles.devButton}
              onPress={() => {
                initialize(Math.floor(Math.random() * 1000));
              }}
            >
              <Text style={styles.devButtonText}>New Random Seed</Text>
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
          </ScrollView>
        </View>
      )}

      {/* Round Resolution Overlay */}
      {resolution && (
        <View style={styles.resolutionOverlay}>
          <View style={styles.resolutionCard}>
            <Text style={styles.resolutionTitle}>
              {resolution.reason === "domino" ? "Domino!" : "Round Blocked"}
            </Text>
            <Text style={styles.resolutionWinner}>
              {resolution.winnerPlayerId === player1Id
                ? "You Won the Round"
                : "Opponent Won the Round"}
            </Text>
            <View style={styles.resolutionScoreRow}>
              <Text style={styles.resolutionScoreLabel}>Score Awarded:</Text>
              <Text style={styles.resolutionScoreValue}>
                +{resolution.scoreAwarded}
              </Text>
            </View>
            <Pressable
              style={styles.advanceButton}
              onPress={advanceToNextRound}
            >
              <Text style={styles.advanceButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      )}
      {/* Game Resolution Overlay */}
      {game.status === "completed" && (
        <View style={styles.resolutionOverlay}>
          <View style={styles.resolutionCard}>
            <Text style={styles.resolutionTitle}>Game Over!</Text>
            <Text style={styles.resolutionWinner}>
              {game.winnerPlayerId === player1Id
                ? "You Won the Match!"
                : "Opponent Won the Match!"}
            </Text>
            <View style={styles.resolutionScoreRow}>
              <Text style={styles.resolutionScoreLabel}>Final Score:</Text>
              <Text style={styles.resolutionScoreValue}>
                {game.playerStateById[player1Id].score} -{" "}
                {game.playerStateById[player2Id].score}
              </Text>
            </View>
            <Pressable
              style={styles.advanceButton}
              onPress={() => initialize(storedSeed || 123)}
            >
              <Text style={styles.advanceButtonText}>Play Again</Text>
            </Pressable>
          </View>
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
    top: 32, // Below header
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
  moreOptionsTriggerPressed: {
    transform: [{ scale: 0.88 }],
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
  devHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[8],
  },
  devTitle: {
    color: colors.white,
    ...typography.smallText,
    opacity: 0.6,
  },
  devCloseText: {
    color: colors.white,
    ...typography.paragraph,
    paddingHorizontal: spacing[8],
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
  resolutionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  resolutionCard: {
    backgroundColor: colors.white,
    padding: spacing[32],
    borderRadius: 24,
    alignItems: "center",
    width: "80%",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  resolutionTitle: {
    ...typography.headline2,
    color: colors.black,
    marginBottom: spacing[8],
  },
  resolutionWinner: {
    ...typography.paragraph,
    color: colors.black45,
    marginBottom: spacing[24],
  },
  resolutionScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[32],
  },
  resolutionScoreLabel: {
    ...typography.paragraph,
    color: colors.black,
    marginRight: spacing[8],
  },
  resolutionScoreValue: {
    ...typography.headline3,
    color: colors.blue,
    fontWeight: "700",
  },
  advanceButton: {
    backgroundColor: colors.blue,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[48],
    borderRadius: 99,
  },
  advanceButtonText: {
    color: colors.white,
    ...typography.paragraph,
    fontWeight: "600",
  },
}));
