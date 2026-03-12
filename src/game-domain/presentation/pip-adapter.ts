import { DominoPip } from "../types";
import {
    FaceGlyph,
    FaceStyle,
    IPresentationAdapter,
    NumeralGlyph,
    PipGlyph,
    STANDARD_PIP_POSITIONS,
} from "./tile-face";

export class PipPresentationAdapter implements IPresentationAdapter {
  getFaceGlyph(value: DominoPip, style: FaceStyle): FaceGlyph {
    if (style === "pips") {
      return {
        style: "pips",
        value,
        pips: STANDARD_PIP_POSITIONS[value],
      } as PipGlyph;
    }

    // Fallback or future numeral implementation
    return {
      style: "numerals",
      value,
      label: value.toString(),
    } as NumeralGlyph;
  }
}

export const defaultPipAdapter = new PipPresentationAdapter();
