import { FaceStyle } from "../../src/game-domain/presentation/tile-face";
import { DominoPip } from "../../src/game-domain/types";

export type DominoOrientation = "up" | "down" | "left" | "right";
export type DominoState = "idle" | "selected" | "ghost";

export interface DominoTileProps {
  /**
   * The pip value for the first face (top if vertical, left if horizontal).
   */
  value1: DominoPip;
  /**
   * The pip value for the second face (bottom if vertical, right if horizontal).
   */
  value2: DominoPip;
  /**
   * Orientation of the tile.
   * @default "up"
   */
  orientation?: DominoOrientation;
  /**
   * Visual style for the faces.
   * @default "pips"
   */
  faceStyle?: FaceStyle;
  /**
   * Interaction state of the tile.
   * @default "idle"
   */
  state?: DominoState;
  /**
   * Optional scale factor for the tile.
   * @default 1
   */
  scale?: number;
}
