import type { ImageProps } from "expo-image";

import type { GameState, PlayerId } from "@/src/game-domain/types";

export type MatchOutcome = "victory" | "defeat";

export type GameEndScoreRow = Readonly<{
  key: "player" | "opponent";
  name: string;
  title: string;
  score: number;
  avatarSource: ImageProps["source"];
}>;

export type GameEndAction = Readonly<{
  label: string;
  iconSource?: ImageProps["source"];
}>;

export type GameEndPresentation = Readonly<{
  outcome: MatchOutcome;
  headline: string;
  bannerSource: ImageProps["source"];
  scoreRows: readonly [GameEndScoreRow, GameEndScoreRow];
  xp: Readonly<{
    label: string;
    gainLabel: string;
    currentLabel: string;
    targetLabel: string;
    progress: number;
  }>;
  actions: Readonly<{
    addFriend: GameEndAction;
    rematch: GameEndAction;
    backToHome: GameEndAction;
  }>;
}>;

export type LocalRematchRoute = Readonly<{
  pathname: "/game/[id]";
  params: Readonly<{
    id: string;
    opponentName?: string;
  }>;
}>;

export const PLAYER_AVATAR_SOURCE = require("@/assets/images/avatar(4).png");
export const OPPONENT_AVATAR_SOURCE = require("@/assets/images/avatar(9).png");
export const VICTORY_BANNER_SOURCE = require("@/assets/images/victory-banner.png");
export const DEFEAT_BANNER_SOURCE = require("@/assets/images/defeat-banner.png");
export const ADD_FRIEND_ICON_SOURCE = require("@/assets/images/icons/User_Add.svg");
export const REMATCH_ICON_SOURCE = require("@/assets/images/icons/Redo.svg");

const DUMMY_PLAYER_TITLE = "Novice - Level 12";
const DUMMY_XP_PROGRESS = 0.625;

function clampProgress(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function createGameEndPresentation(
  game: GameState,
  localPlayerId: PlayerId,
): GameEndPresentation {
  const localPlayer =
    game.players.find((player) => player.playerId === localPlayerId) ??
    game.players[0];
  const opponentPlayer =
    game.players.find((player) => player.playerId !== localPlayer.playerId) ??
    game.players[1] ??
    localPlayer;
  const isVictory = game.winnerPlayerId === localPlayer.playerId;
  const playerScore = game.playerStateById[localPlayer.playerId]?.score ?? 0;
  const opponentScore = game.playerStateById[opponentPlayer.playerId]?.score ?? 0;

  return {
    outcome: isVictory ? "victory" : "defeat",
    headline: isVictory ? "Victory!" : "Defeat",
    bannerSource: isVictory ? VICTORY_BANNER_SOURCE : DEFEAT_BANNER_SOURCE,
    scoreRows: [
      {
        key: "player",
        name: localPlayer.displayName ?? "Player",
        title: DUMMY_PLAYER_TITLE,
        score: playerScore,
        avatarSource: PLAYER_AVATAR_SOURCE,
      },
      {
        key: "opponent",
        name: opponentPlayer.displayName ?? "Opponent",
        title: DUMMY_PLAYER_TITLE,
        score: opponentScore,
        avatarSource: OPPONENT_AVATAR_SOURCE,
      },
    ],
    xp: {
      label: "Experience Gained",
      gainLabel: "+250 XP",
      currentLabel: "1,250 XP",
      targetLabel: "2,000 XP",
      progress: clampProgress(DUMMY_XP_PROGRESS),
    },
    actions: {
      addFriend: {
        label: "Add Friend",
        iconSource: ADD_FRIEND_ICON_SOURCE,
      },
      rematch: {
        label: "Rematch",
        iconSource: REMATCH_ICON_SOURCE,
      },
      backToHome: {
        label: "Back to Home",
      },
    },
  };
}

export function buildLocalRematchRoute(
  opponentName?: string | null,
  timestampMs: number = Date.now(),
): LocalRematchRoute {
  const nextId = `local-${timestampMs}`;

  return {
    pathname: "/game/[id]",
    params:
      opponentName && opponentName.trim().length > 0
        ? {
            id: nextId,
            opponentName,
          }
        : {
            id: nextId,
          },
  };
}
