import { Button } from "@/components/Button";
import { BoardArea } from "@/components/game/BoardArea";
import { BoardHeader } from "@/components/game/BoardHeader";
import { BoneyardIndicator } from "@/components/game/BoneyardIndicator";
import { DrawTileOverlay } from "@/components/game/DrawTileOverlay";
import { HandDragOverlay } from "@/components/game/HandDragOverlay";
import { OpenEndsIndicator } from "@/components/game/OpenEndsIndicator";
import { OpponentHand } from "@/components/game/OpponentHand";
import { PlayerHand } from "@/components/game/PlayerHand";
import {
  PendingDrawState,
  createDrawTileAnimation,
  resolveCompletedDrawEvent,
  resolveDrawPresentation,
} from "@/components/game/draw-tile-animation";
import {
  createActiveHandDrag,
  createPromotedActiveHandDrag,
  createReturningHandDrag,
  getHiddenHandTileIds,
} from "@/components/game/hand-drag-state";
import {
  createCenteredDragTileVisual,
  createSourceDragTileVisual,
  findLayoutAnchorForSide,
  getDragTileVisualCenter,
  projectPlacedTileGeometryToDragVisual,
  resolveDraggedTileVisual,
} from "@/components/game/hand-drag-visual";
import {
  ActiveHandDrag,
  DragTileVisual,
  DrawTileAnimation,
  HandTileDragStart,
  OpponentPlacementAnimation,
  PlacementTileAnimation,
  ReturningHandDrag,
  ScreenPoint,
  ScreenRect,
} from "@/components/game/hand-drag.types";
import { getComputerAction } from "@/src/game-domain/computer-player";
import {
  GameEvent,
  RoundEndedEvent,
  TilePlayedEvent,
  TurnPassedEvent,
} from "@/src/game-domain/events/schema";
import { projectPlacement } from "@/src/game-domain/layout/project-placement";
import {
  CameraTransform,
  LayoutAnchor,
  Point,
} from "@/src/game-domain/layout/types";
import { useBoardCamera } from "@/src/game-domain/layout/useBoardCamera";
import { useBoardInteraction } from "@/src/game-domain/layout/useBoardInteraction";
import { createRoundStartedEvent } from "@/src/game-domain/local-session";
import { useLocalSessionStore } from "@/src/game-domain/local-session-store";
import {
  EventId,
  FivesLegalMove,
  PlayerId,
  ReconstructionState,
  Tile,
  TileId,
} from "@/src/game-domain/types";
import {
  calculateFivesScoringTotal,
  evaluateFivesLegalMoves,
} from "@/src/game-domain/variants/fives";
import {
  createTargetScoreGameEndedEvent,
  evaluateRoundResolution,
} from "@/src/game-domain/variants/fives/round-resolution";
import { colors, spacing, typography } from "@/theme/tokens";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

const DROP_SETTLE_PAUSE_MS = 100;
const OPPONENT_PLAY_INTRO_DURATION_MS = 400;
const OPPONENT_PLAY_SETTLE_DURATION_MS = 400;
const OPPONENT_PLAY_INTRO_TRAVEL_PX = 100;
const OPPONENT_PLAY_INTRO_CLEARANCE_PX = 48;

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
  const isScreenFocused = useIsFocused();
  const [isBoardTransitionActive, setIsBoardTransitionActive] = useState(false);
  const [placementAnimation, setPlacementAnimation] =
    useState<PlacementTileAnimation | null>(null);
  const [opponentPlacementAnimation, setOpponentPlacementAnimation] =
    useState<OpponentPlacementAnimation | null>(null);
  const [drawAnimation, setDrawAnimation] = useState<DrawTileAnimation | null>(
    null,
  );
  const [pendingDraw, setPendingDraw] = useState<PendingDrawState | null>(null);
  const [opponentLaunchTileRect, setOpponentLaunchTileRect] =
    useState<ScreenRect | null>(null);
  const [boneyardRect, setBoneyardRect] = useState<ScreenRect | null>(null);
  const [playerDrawTargetRect, setPlayerDrawTargetRect] =
    useState<ScreenRect | null>(null);
  const [opponentDrawTargetRect, setOpponentDrawTargetRect] =
    useState<ScreenRect | null>(null);
  const boneyardIndicatorRef = useRef<View | null>(null);

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
  const drawPresentation = useMemo(
    () =>
      resolveDrawPresentation({
        playerHand,
        opponentHandCount,
        boneyardCount,
        pendingDraw,
      }),
    [boneyardCount, opponentHandCount, pendingDraw, playerHand],
  );
  const displayedPlayerHand = drawPresentation.displayedPlayerHand;
  const displayedOpponentHandCount =
    drawPresentation.displayedOpponentHandCount;
  const displayedBoneyardCount = drawPresentation.displayedBoneyardCount;
  const hasDrawActivity = pendingDraw !== null || drawAnimation !== null;
  const fivesScoringTotal = useMemo(() => {
    return calculateFivesScoringTotal(currentRound.board);
  }, [currentRound.board]);
  const isPlayerTurn = game.turn?.activePlayerId === player1Id;
  const isBoardInteractionEnabled =
    isPlayerTurn &&
    isScreenFocused &&
    !isBoardTransitionActive &&
    placementAnimation === null &&
    opponentPlacementAnimation === null &&
    !hasDrawActivity;

  const opponentProfile = game.players.find(
    (p: any) => p.playerId === player2Id,
  );

  const { layout, transform, onLayout, geometry, viewRef, containerOffset } =
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
    snapAnchor,
    dropTargetAnchor,
    hasClearedHandThreshold,
    dragScreenPosition,
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
    isBoardInteractionEnabled,
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
  const scoreByPlayerId = useMemo(
    () => ({
      [player1Id]: game.playerStateById[player1Id].score,
      [player2Id]: game.playerStateById[player2Id].score,
    }),
    [game.playerStateById, player1Id, player2Id],
  );
  const autoEndedScoreEventCountRef = useRef<number | null>(null);
  const [activeHandDrag, setActiveHandDrag] = useState<ActiveHandDrag | null>(
    null,
  );
  const [returningHandDrags, setReturningHandDrags] = useState<
    ReturningHandDrag[]
  >([]);
  const activeHandDragRef = useRef<ActiveHandDrag | null>(null);
  const returningHandDragsRef = useRef<ReturningHandDrag[]>([]);
  const currentDragVisualRef = useRef<DragTileVisual | null>(null);
  const pendingDrawRef = useRef<PendingDrawState | null>(null);
  const nextReturnIdRef = useRef(0);
  const nextPlacementIdRef = useRef(0);
  const nextDrawIdRef = useRef(0);
  const pendingPlacementEventRef = useRef<TilePlayedEvent | null>(null);
  const pendingOpponentPlayEventRef = useRef<TilePlayedEvent | null>(null);
  const placementPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const currentDragVisual = useMemo(() => {
    if (!activeHandDrag) {
      return null;
    }

    return resolveDraggedTileVisual({
      sourceRect: activeHandDrag.sourceRect,
      dragScreenPosition,
      fallbackVisual: activeHandDrag.initialVisual,
      previewGeometry,
      cameraTransform: transform,
      containerOffset,
      isSnapped: snapAnchor !== null,
    });
  }, [
    activeHandDrag,
    snapAnchor,
    containerOffset,
    dragScreenPosition,
    previewGeometry,
    transform,
  ]);
  const hiddenTileIds = useMemo(
    () =>
      new Set([
        ...getHiddenHandTileIds(activeHandDrag, returningHandDrags),
        ...(placementAnimation ? [placementAnimation.tileId] : []),
        ...(drawPresentation.hiddenPlayerTileId
          ? [drawPresentation.hiddenPlayerTileId]
          : []),
      ]),
    [
      activeHandDrag,
      drawPresentation.hiddenPlayerTileId,
      placementAnimation,
      returningHandDrags,
    ],
  );
  const highlightedTileIsDouble = useMemo(() => {
    if (draggedTileId === null) {
      return false;
    }

    const draggedTile = tileCatalog[draggedTileId];
    return draggedTile ? draggedTile.sideA === draggedTile.sideB : false;
  }, [draggedTileId, tileCatalog]);
  const usesVerticalDragActivation = displayedPlayerHand.length >= 8;

  activeHandDragRef.current = activeHandDrag;
  returningHandDragsRef.current = [...returningHandDrags];
  currentDragVisualRef.current = currentDragVisual;
  pendingDrawRef.current = pendingDraw;

  useEffect(() => {
    if (isScreenFocused) {
      return;
    }

    activeHandDragRef.current = null;
    returningHandDragsRef.current = [];
    currentDragVisualRef.current = null;
    pendingPlacementEventRef.current = null;
    pendingOpponentPlayEventRef.current = null;
    pendingDrawRef.current = null;
    if (placementPauseTimeoutRef.current) {
      clearTimeout(placementPauseTimeoutRef.current);
      placementPauseTimeoutRef.current = null;
    }
    setActiveHandDrag(null);
    setPlacementAnimation(null);
    setOpponentPlacementAnimation(null);
    setDrawAnimation(null);
    setPendingDraw(null);
    setOpponentLaunchTileRect(null);
    setBoneyardRect(null);
    setPlayerDrawTargetRect(null);
    setOpponentDrawTargetRect(null);
    setReturningHandDrags([]);
  }, [isScreenFocused]);

  const createNextReturnId = useCallback(() => {
    nextReturnIdRef.current += 1;
    return `return-${nextReturnIdRef.current}`;
  }, []);

  const createNextPlacementId = useCallback(() => {
    nextPlacementIdRef.current += 1;
    return `placement-${nextPlacementIdRef.current}`;
  }, []);

  const createNextDrawId = useCallback(() => {
    nextDrawIdRef.current += 1;
    return `draw-${nextDrawIdRef.current}`;
  }, []);

  const measureBoneyardRect = useCallback(() => {
    const boneyardIndicator = boneyardIndicatorRef.current;
    if (!boneyardIndicator) {
      setBoneyardRect(null);
      return;
    }

    boneyardIndicator.measureInWindow((x, y, width, height) => {
      setBoneyardRect({ x, y, width, height });
    });
  }, []);

  useEffect(() => {
    let delayedFrameId: number | null = null;
    const frameId = requestAnimationFrame(measureBoneyardRect);
    const timeoutId = setTimeout(() => {
      delayedFrameId = requestAnimationFrame(measureBoneyardRect);
    }, 50);

    return () => {
      cancelAnimationFrame(frameId);
      if (delayedFrameId !== null) {
        cancelAnimationFrame(delayedFrameId);
      }
      clearTimeout(timeoutId);
    };
  }, [displayedBoneyardCount, measureBoneyardRect]);

  const startPendingDraw = useCallback(
    (actor: PendingDrawState["actor"], playerId: PlayerId) => {
      const tileId = currentRound?.boneyard.remainingTileIds[0];
      if (!tileId) {
        return false;
      }

      const tile = tileCatalog[tileId];
      if (!tile) {
        return false;
      }

      const nextPendingDraw: PendingDrawState = {
        actor,
        event: {
          eventId: Math.random().toString(36).substring(7) as EventId,
          gameId: game.gameId,
          eventSeq: events.length + 1,
          type: "TILE_DRAWN",
          version: 1,
          occurredAt: new Date().toISOString(),
          playerId,
          roundId: currentRound.roundId,
          tileId,
          source: "boneyard",
        },
        tile: {
          id: tileId,
          value1: tile.sideA,
          value2: tile.sideB,
        },
      };

      pendingDrawRef.current = nextPendingDraw;
      setPendingDraw(nextPendingDraw);
      setDrawAnimation(null);
      setPlayerDrawTargetRect(null);
      setOpponentDrawTargetRect(null);
      return true;
    },
    [currentRound, events.length, game.gameId, tileCatalog],
  );

  useEffect(() => {
    if (!pendingDraw || drawAnimation || !boneyardRect) {
      return;
    }

    const targetRect =
      pendingDraw.actor === "player"
        ? playerDrawTargetRect
        : opponentDrawTargetRect;
    if (!targetRect) {
      return;
    }

    setDrawAnimation(
      createDrawTileAnimation({
        animationId: createNextDrawId(),
        tile: pendingDraw.tile,
        destinationRect: targetRect,
        boneyardRect,
        faceMode: pendingDraw.actor === "player" ? "front" : "back",
      }),
    );
  }, [
    boneyardRect,
    createNextDrawId,
    drawAnimation,
    opponentDrawTargetRect,
    pendingDraw,
    playerDrawTargetRect,
  ]);

  const handleDraw = useCallback(() => {
    if (!currentRound) return;
    const tileId = currentRound.boneyard.remainingTileIds[0];

    if (tileId) {
      startPendingDraw("player", player1Id);
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
  }, [
    appendEvent,
    currentRound,
    events.length,
    game.gameId,
    player1Id,
    startPendingDraw,
  ]);

  const handleHandDragStart = useCallback(
    (dragStart: HandTileDragStart) => {
      const tile = tileCatalog[dragStart.tileId];

      if (!tile || activeHandDragRef.current) {
        return;
      }

      const nextActiveDrag = createActiveHandDrag({
        tileId: dragStart.tileId,
        value1: tile.sideA,
        value2: tile.sideB,
        sourceRect: dragStart.sourceRect,
        initialVisual: createSourceDragTileVisual(dragStart.sourceRect),
      });

      activeHandDragRef.current = nextActiveDrag;
      currentDragVisualRef.current = nextActiveDrag.initialVisual;
      setActiveHandDrag(nextActiveDrag);
      onDragStart(dragStart.tileId, dragStart.sourceRect);
    },
    [onDragStart, tileCatalog],
  );

  const finalizeActiveDrag = useCallback(() => {
    const drag = activeHandDragRef.current;
    const dragVisual = currentDragVisualRef.current;
    const initialFromVisual =
      dragVisual ??
      drag?.initialVisual ??
      (drag ? createSourceDragTileVisual(drag.sourceRect) : null);
    const endResult = onDragEnd();
    const move = endResult?.move ?? null;
    const targetVisual =
      drag && endResult?.targetPreviewGeometry
        ? resolveDraggedTileVisual({
            sourceRect: drag.sourceRect,
            dragScreenPosition: null,
            fallbackVisual: null,
            previewGeometry: endResult.targetPreviewGeometry,
            cameraTransform: transform,
            containerOffset,
            isSnapped: true,
          })
        : null;
    const fromVisual =
      endResult?.wasSnapped && targetVisual ? targetVisual : initialFromVisual;
    if (!drag) {
      return;
    }

    if (!isPlayerTurn || !move || !currentRound) {
      setReturningHandDrags((current) => {
        const next = [
          ...current,
          createReturningHandDrag({
            returnId: createNextReturnId(),
            activeDrag: drag,
            returnFrom:
              fromVisual ?? createSourceDragTileVisual(drag.sourceRect),
          }),
        ];
        returningHandDragsRef.current = next;
        return next;
      });
      activeHandDragRef.current = null;
      currentDragVisualRef.current = null;
      setActiveHandDrag(null);
      return;
    }

    activeHandDragRef.current = null;
    currentDragVisualRef.current = null;
    setActiveHandDrag(null);

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

    if (fromVisual && targetVisual) {
      pendingPlacementEventRef.current = event;
      setPlacementAnimation({
        animationId: createNextPlacementId(),
        tileId: drag.tileId,
        value1: drag.value1,
        value2: drag.value2,
        from: fromVisual,
        to: targetVisual,
      });
      return;
    }

    appendEvent(event);
  }, [
    appendEvent,
    containerOffset,
    currentRound,
    createNextReturnId,
    createNextPlacementId,
    events.length,
    game.gameId,
    isPlayerTurn,
    onDragEnd,
    player1Id,
    transform,
  ]);

  const handleDragEnd = useCallback(() => {
    finalizeActiveDrag();
  }, [finalizeActiveDrag]);

  const handleReturnAnimationComplete = useCallback((returnId: string) => {
    setReturningHandDrags((current) => {
      const next = current.filter(
        (returningDrag) => returningDrag.returnId !== returnId,
      );
      returningHandDragsRef.current = next;
      return next;
    });
  }, []);

  const handlePlacementAnimationComplete = useCallback(
    (animationId: string) => {
      if (placementPauseTimeoutRef.current) {
        clearTimeout(placementPauseTimeoutRef.current);
        placementPauseTimeoutRef.current = null;
      }

      placementPauseTimeoutRef.current = setTimeout(() => {
        setPlacementAnimation((current) => {
          if (!current || current.animationId !== animationId) {
            return current;
          }

          return null;
        });

        const event = pendingPlacementEventRef.current;
        pendingPlacementEventRef.current = null;
        placementPauseTimeoutRef.current = null;

        if (event) {
          appendEvent(event);
        }
      }, DROP_SETTLE_PAUSE_MS);
    },
    [appendEvent],
  );

  const handleDrawAnimationComplete = useCallback(
    (animationId: string) => {
      const event = resolveCompletedDrawEvent({
        pendingDraw: pendingDrawRef.current,
        drawAnimation,
        completedAnimationId: animationId,
      });

      if (!event) {
        return;
      }

      pendingDrawRef.current = null;
      setDrawAnimation(null);
      setPendingDraw(null);
      setPlayerDrawTargetRect(null);
      setOpponentDrawTargetRect(null);
      appendEvent(event);
    },
    [appendEvent, drawAnimation],
  );

  const handleOpponentPlacementAnimationComplete = useCallback(
    (animationId: string) => {
      setOpponentPlacementAnimation((current) => {
        if (!current || current.animationId !== animationId) {
          return current;
        }

        return null;
      });

      const event = pendingOpponentPlayEventRef.current;
      pendingOpponentPlayEventRef.current = null;

      if (event) {
        appendEvent(event);
      }
    },
    [appendEvent],
  );

  const handleReturningDragStart = useCallback(
    (
      returnId: string,
      currentVisual: DragTileVisual,
      touchPoint: ScreenPoint,
    ) => {
      if (activeHandDragRef.current) {
        return;
      }

      const returningDrag = returningHandDragsRef.current.find(
        (candidate) => candidate.returnId === returnId,
      );
      if (!returningDrag) {
        return;
      }

      setReturningHandDrags((current) => {
        const next = current.map((candidate) =>
          candidate.returnId === returnId
            ? { ...candidate, isPromotedToActive: true }
            : candidate,
        );
        returningHandDragsRef.current = next;
        return next;
      });
      const promotedDrag = createPromotedActiveHandDrag(
        returningDrag,
        currentVisual,
      );
      activeHandDragRef.current = promotedDrag;
      currentDragVisualRef.current = currentVisual;
      setActiveHandDrag(promotedDrag);
      onDragStart(returningDrag.tileId, returningDrag.sourceRect);
      onDragUpdate(touchPoint.x, touchPoint.y);
    },
    [onDragStart, onDragUpdate],
  );

  const handleReturningDragUpdate = useCallback(
    (_returnId: string, screenX: number, screenY: number) => {
      onDragUpdate(screenX, screenY);
    },
    [onDragUpdate],
  );

  const handleReturningDragEnd = useCallback(
    (returnId: string) => {
      setReturningHandDrags((current) => {
        const next = current.filter(
          (returningDrag) => returningDrag.returnId !== returnId,
        );
        returningHandDragsRef.current = next;
        return next;
      });
      finalizeActiveDrag();
    },
    [finalizeActiveDrag],
  );

  const [showDevTools, setShowDevTools] = useState(false);

  const resolution = useMemo(() => {
    if (!currentRound || currentRound.status !== "active") return null;
    return evaluateRoundResolution(currentRound, tileCatalog);
  }, [currentRound, tileCatalog]);

  useEffect(() => {
    if (
      game.status !== "active" ||
      currentRound.status !== "active" ||
      resolution !== null
    ) {
      autoEndedScoreEventCountRef.current = null;
      return;
    }

    const gameEnded = createTargetScoreGameEndedEvent({
      eventId: Math.random().toString(36).substring(7) as EventId,
      gameId: game.gameId,
      eventSeq: events.length + 1,
      occurredAt: new Date().toISOString(),
      roundId: currentRound.roundId,
      playerScores: scoreByPlayerId,
      targetScore: game.metadata.targetScore,
    });

    if (gameEnded === null) {
      autoEndedScoreEventCountRef.current = null;
      return;
    }

    if (autoEndedScoreEventCountRef.current === events.length) {
      return;
    }

    autoEndedScoreEventCountRef.current = events.length;
    appendEvent(gameEnded);
  }, [
    appendEvent,
    currentRound.roundId,
    currentRound.status,
    events.length,
    game.gameId,
    game.metadata.targetScore,
    game.status,
    resolution,
    scoreByPlayerId,
  ]);

  // Automated Computer Turn
  useEffect(() => {
    const isComputerTurn = game.turn?.activePlayerId === player2Id;
    const isRoundActive = currentRound.status === "active";
    const noResolutionPending = !resolution;
    const hasPendingOpponentPlay =
      pendingOpponentPlayEventRef.current !== null ||
      opponentPlacementAnimation !== null ||
      pendingDraw !== null ||
      drawAnimation !== null;

    if (
      isComputerTurn &&
      isRoundActive &&
      noResolutionPending &&
      !hasPendingOpponentPlay
    ) {
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
          const animation = createOpponentPlacementAnimation({
            animationId: createNextPlacementId(),
            move: action.move,
            tileCatalog,
            anchors: geometry.anchors,
            cameraTransform: transform,
            containerOffset,
            sourceRect: opponentLaunchTileRect,
          });

          if (animation) {
            pendingOpponentPlayEventRef.current = event;
            setOpponentPlacementAnimation(animation);
            return;
          }

          appendEvent(event);
        } else if (action.kind === "draw") {
          const tileId = currentRound.boneyard.remainingTileIds[0];
          if (tileId) {
            startPendingDraw("opponent", player2Id);
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
    geometry.anchors,
    transform,
    containerOffset,
    tileCatalog,
    opponentLaunchTileRect,
    opponentPlacementAnimation,
    pendingDraw,
    drawAnimation,
    createNextPlacementId,
    appendEvent,
    startPendingDraw,
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
    const gameEnded = createTargetScoreGameEndedEvent({
      eventId: Math.random().toString(36).substring(7) as EventId,
      gameId: game.gameId,
      eventSeq: events.length + 2,
      occurredAt: new Date().toISOString(),
      roundId: currentRound.roundId,
      playerScores: nextScores,
      targetScore: game.metadata.targetScore,
    });

    if (gameEnded) {
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
          count={displayedOpponentHandCount}
          isTurn={game.turn?.activePlayerId === player2Id}
          isLaunchingTile={opponentPlacementAnimation !== null}
          onLaunchTileRectChange={setOpponentLaunchTileRect}
          pendingDrawTileIndex={drawPresentation.trackedOpponentTileIndex}
          onPendingDrawTileRectChange={setOpponentDrawTargetRect}
        />

        <View style={styles.boneyardWrapper}>
          <OpenEndsIndicator scoringTotal={fivesScoringTotal} />
          <View
            ref={boneyardIndicatorRef}
            collapsable={false}
            style={styles.boneyardIndicatorMeasureTarget}
          >
            <BoneyardIndicator count={displayedBoneyardCount} />
          </View>
        </View>

        <View ref={viewRef} style={styles.boardContainer} onLayout={onLayout}>
          <BoardArea
            board={currentRound.board}
            layout={layout}
            highlightedAnchor={
              hasClearedHandThreshold ? dropTargetAnchor : null
            }
            highlightedTileIsDouble={highlightedTileIsDouble}
            previewAnchor={snapAnchor}
            previewTile={snapAnchor ? previewGeometry : null}
            onTransitionActiveChange={setIsBoardTransitionActive}
          />
        </View>

        {/* Draw button when stuck */}
        {isPlayerTurn &&
          playableTileIds.size === 0 &&
          !activeHandDrag &&
          !placementAnimation &&
          !opponentPlacementAnimation &&
          !hasDrawActivity && (
            <View style={styles.drawButtonContainer}>
              <Button
                label={displayedBoneyardCount > 0 ? "Draw Tile" : "Pass Turn"}
                variant="play"
                onPress={handleDraw}
                style={{ width: "auto" }}
              />
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
            hand={displayedPlayerHand}
            playableTileIds={playableTileIds}
            hiddenTileIds={hiddenTileIds}
            hasActiveDrag={
              activeHandDrag !== null ||
              placementAnimation !== null ||
              opponentPlacementAnimation !== null ||
              hasDrawActivity
            }
            activeTileId={activeHandDrag?.tileId ?? null}
            isInteractionEnabled={isBoardInteractionEnabled}
            trackedTileId={drawPresentation.trackedPlayerTileId}
            onTrackedTileRectChange={setPlayerDrawTargetRect}
            onDragStart={handleHandDragStart}
            onDragUpdate={onDragUpdate}
            onDragEnd={handleDragEnd}
          />
        </View>
      </View>

      <View pointerEvents="box-none" style={styles.drawAnimationOverlay}>
        <DrawTileOverlay
          animation={drawAnimation}
          onAnimationComplete={handleDrawAnimationComplete}
        />
      </View>

      <View pointerEvents="box-none" style={styles.opponentDragOverlay}>
        <HandDragOverlay
          activeDrag={null}
          activeDragVisual={null}
          placementAnimation={null}
          opponentPlacementAnimation={opponentPlacementAnimation}
          returningDrags={[]}
          hideActiveDrag={false}
          usesVerticalDragActivation={usesVerticalDragActivation}
          hasActiveDrag={hasDrawActivity}
          onPlacementAnimationComplete={handlePlacementAnimationComplete}
          onOpponentPlacementAnimationComplete={
            handleOpponentPlacementAnimationComplete
          }
          onReturnComplete={handleReturnAnimationComplete}
          onReturningDragStart={handleReturningDragStart}
          onReturningDragUpdate={handleReturningDragUpdate}
          onReturningDragEnd={handleReturningDragEnd}
        />
      </View>

      <View pointerEvents="box-none" style={styles.playerDragOverlay}>
        <HandDragOverlay
          activeDrag={activeHandDrag}
          activeDragVisual={currentDragVisual}
          placementAnimation={placementAnimation}
          opponentPlacementAnimation={null}
          returningDrags={returningHandDrags}
          hideActiveDrag={snapAnchor !== null}
          usesVerticalDragActivation={usesVerticalDragActivation}
          hasActiveDrag={
            activeHandDrag !== null ||
            placementAnimation !== null ||
            opponentPlacementAnimation !== null ||
            hasDrawActivity
          }
          onPlacementAnimationComplete={handlePlacementAnimationComplete}
          onOpponentPlacementAnimationComplete={
            handleOpponentPlacementAnimationComplete
          }
          onReturnComplete={handleReturnAnimationComplete}
          onReturningDragStart={handleReturningDragStart}
          onReturningDragUpdate={handleReturningDragUpdate}
          onReturningDragEnd={handleReturningDragEnd}
        />
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

function createOpponentPlacementAnimation(
  input: Readonly<{
    animationId: string;
    move: FivesLegalMove;
    tileCatalog: Readonly<Record<TileId, Tile>>;
    anchors: readonly LayoutAnchor[];
    cameraTransform: CameraTransform;
    containerOffset: Point;
    sourceRect: ScreenRect | null;
  }>,
): OpponentPlacementAnimation | null {
  if (!input.sourceRect) {
    return null;
  }

  const tile = input.tileCatalog[input.move.tileId];
  if (!tile) {
    return null;
  }

  const anchor = findLayoutAnchorForSide(input.anchors, input.move.side);
  if (!anchor) {
    return null;
  }

  const placementGeometry = projectPlacement(
    tile,
    anchor,
    input.move.inwardTileSide,
  );
  const sourceVisual = createSourceDragTileVisual(input.sourceRect);
  const destinationVisual = projectPlacedTileGeometryToDragVisual(
    placementGeometry,
    input.cameraTransform,
    input.containerOffset,
  );
  const sourceCenter = getDragTileVisualCenter(sourceVisual);
  const destinationCenter = getDragTileVisualCenter(destinationVisual);
  const introTravelPx = Math.min(
    OPPONENT_PLAY_INTRO_TRAVEL_PX,
    Math.max(
      0,
      destinationCenter.y - sourceCenter.y - OPPONENT_PLAY_INTRO_CLEARANCE_PX,
    ),
  );
  const introCenter = {
    x: sourceCenter.x,
    y:
      introTravelPx > 0
        ? sourceCenter.y + introTravelPx
        : sourceCenter.y + (destinationCenter.y - sourceCenter.y) / 2,
  };

  return {
    animationId: input.animationId,
    tileId: tile.id,
    value1: tile.sideA,
    value2: tile.sideB,
    from: sourceVisual,
    via: createCenteredDragTileVisual(
      introCenter,
      "up",
      destinationVisual.scale,
    ),
    to: destinationVisual,
    targetRotationDeg: placementGeometry.rotationDeg,
    flipIntroDurationMs: OPPONENT_PLAY_INTRO_DURATION_MS,
    settleDurationMs: OPPONENT_PLAY_SETTLE_DURATION_MS,
  };
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
  dragOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
  },
  opponentDragOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  drawAnimationOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  playerDragOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
  },

  boneyardWrapper: {
    position: "absolute",
    left: 0,
    top: 32, // Below header
    zIndex: 10,
  },
  boneyardIndicatorMeasureTarget: {
    alignSelf: "flex-start",
  },
  drawButtonContainer: {
    position: "absolute",
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
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
    bottom: 140,
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
