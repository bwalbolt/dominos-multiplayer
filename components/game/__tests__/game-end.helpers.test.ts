import { createLocalGameSession } from "@/src/game-domain/local-session";
import { reconstructGameState } from "@/src/game-domain/reconstruct";
import type { GameState, PlayerId } from "@/src/game-domain/types";

import {
  VICTORY_BANNER_SOURCE,
  DEFEAT_BANNER_SOURCE,
  buildLocalRematchRoute,
  createGameEndPresentation,
} from "../game-end.helpers";

function createCompletedGameState(input: {
  playerScore: number;
  opponentScore: number;
  winnerPlayerId: PlayerId;
}): GameState {
  const player1Id = "p1" as PlayerId;
  const player2Id = "p2" as PlayerId;
  const reconstruction = reconstructGameState(
    createLocalGameSession(123, "Avery", "Computer (Easy)"),
  );
  const game = reconstruction.game;

  if (!game) {
    throw new Error("Expected reconstructed game state.");
  }

  return {
    ...game,
    status: "completed",
    winnerPlayerId: input.winnerPlayerId,
    playerStateById: {
      ...game.playerStateById,
      [player1Id]: {
        ...game.playerStateById[player1Id],
        score: input.playerScore,
      },
      [player2Id]: {
        ...game.playerStateById[player2Id],
        score: input.opponentScore,
      },
    },
  };
}

describe("createGameEndPresentation", () => {
  it("maps a victory result with player-first score rows", () => {
    const player1Id = "p1" as PlayerId;
    const presentation = createGameEndPresentation(
      createCompletedGameState({
        playerScore: 105,
        opponentScore: 45,
        winnerPlayerId: player1Id,
      }),
      player1Id,
    );

    expect(presentation.outcome).toBe("victory");
    expect(presentation.headline).toBe("Victory!");
    expect(presentation.bannerSource).toBe(VICTORY_BANNER_SOURCE);
    expect(presentation.scoreRows[0]).toMatchObject({
      key: "player",
      name: "Avery",
      score: 105,
    });
    expect(presentation.scoreRows[1]).toMatchObject({
      key: "opponent",
      name: "Computer (Easy)",
      score: 45,
    });
  });

  it("maps a defeat result while keeping player first", () => {
    const player1Id = "p1" as PlayerId;
    const player2Id = "p2" as PlayerId;
    const presentation = createGameEndPresentation(
      createCompletedGameState({
        playerScore: 80,
        opponentScore: 100,
        winnerPlayerId: player2Id,
      }),
      player1Id,
    );

    expect(presentation.outcome).toBe("defeat");
    expect(presentation.headline).toBe("Defeat");
    expect(presentation.bannerSource).toBe(DEFEAT_BANNER_SOURCE);
    expect(presentation.scoreRows[0]).toMatchObject({
      key: "player",
      score: 80,
    });
    expect(presentation.scoreRows[1]).toMatchObject({
      key: "opponent",
      score: 100,
    });
  });
});

describe("buildLocalRematchRoute", () => {
  it("creates a fresh local route and preserves opponent context", () => {
    expect(buildLocalRematchRoute("Computer (Easy)", 1700000000000)).toEqual({
      pathname: "/game/[id]",
      params: {
        id: "local-1700000000000",
        opponentName: "Computer (Easy)",
      },
    });
  });
});
