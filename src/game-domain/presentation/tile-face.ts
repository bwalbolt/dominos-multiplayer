import { DominoPip } from "../types";

/**
 * Defines the presentation contract for mapping a domain pip value
 * to a set of visual coordinates for SVG or other drawing primitives.
 */
export type FaceStyle = "pips" | "numerals";

export interface FacePoint {
  readonly x: number; // 0.0 - 1.0 (normalized)
  readonly y: number; // 0.0 - 1.0 (normalized)
}

/**
 * Common shape for any face renderer output.
 */
export interface FaceGlyph {
  readonly value: DominoPip;
  readonly style: FaceStyle;
}

/**
 * Specific glyph for pip-based rendering.
 */
export interface PipGlyph extends FaceGlyph {
  readonly style: "pips";
  /**
   * Relative coordinates (normalized 0 to 1) within a single square face.
   */
  readonly pips: readonly FacePoint[];
}

/**
 * Specific glyph for numeral-based rendering (future proofing).
 */
export interface NumeralGlyph extends FaceGlyph {
  readonly style: "numerals";
  readonly label: string;
}

/**
 * Maps domain pip values (0-6) into visual representation models.
 */
export interface IPresentationAdapter {
  getFaceGlyph(value: DominoPip, style: FaceStyle): FaceGlyph;
}

/**
 * Standard pip positions for a domino face.
 * These are normalized coordinates from 0.0 to 1.0.
 * Inferred from standard domino pip layouts.
 */
export const STANDARD_PIP_POSITIONS: Record<DominoPip, readonly FacePoint[]> = {
  0: [],
  1: [{ x: 0.5, y: 0.5 }],
  2: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.75 },
  ],
  3: [
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 },
  ],
  4: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  5: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
    { x: 0.5, y: 0.5 },
  ],
  6: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
};
