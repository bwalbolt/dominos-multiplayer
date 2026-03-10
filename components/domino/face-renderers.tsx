import React from "react";
import { Circle, G, Text as SvgText } from "react-native-svg";
import {
  FaceGlyph,
  NumeralGlyph,
  PipGlyph,
} from "../../src/game-domain/presentation/tile-face";
import { domino } from "../../theme/tokens";

interface FaceRendererProps {
  glyph: FaceGlyph;
  x: number;
  y: number;
  rotationAngle: number;
  faceSize: number;
  opacity?: number;
}

export const FaceRenderer: React.FC<FaceRendererProps> = ({
  glyph,
  x,
  y,
  rotationAngle,
  faceSize,
  opacity = 1,
}) => {
  const center = faceSize / 2;

  if (glyph.style === "pips") {
    const pipGlyph = glyph as PipGlyph;
    return (
      <G
        transform={`translate(${x}, ${y}) rotate(${rotationAngle}, ${center}, ${center})`}
        opacity={opacity}
      >
        {pipGlyph.pips.map((pip, index) => (
          <Circle
            key={`${index}-${pip.x}-${pip.y}`}
            cx={pip.x * faceSize}
            cy={pip.y * faceSize}
            r={domino.pipSize / 2}
            fill={domino.colors.pips}
          />
        ))}
      </G>
    );
  }

  if (glyph.style === "numerals") {
    const numeralGlyph = glyph as NumeralGlyph;
    return (
      <G transform={`translate(${x}, ${y})`} opacity={opacity}>
        <SvgText
          x={center}
          y={center + 6} // Subtle offset for vertical centering
          fontSize={24}
          fontWeight="900"
          fill={domino.colors.pips}
          textAnchor="middle"
        >
          {numeralGlyph.label}
        </SvgText>
      </G>
    );
  }

  return null;
};
