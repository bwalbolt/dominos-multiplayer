import React from "react";
import { View } from "react-native";
import Svg, { ClipPath, Defs, G, Line, Path, Rect } from "react-native-svg";
import { defaultPipAdapter } from "../../src/game-domain/presentation/pip-adapter";
import { domino } from "../../theme/tokens";
import { DominoTileProps } from "./domino-tile.types";
import {
  DominoSelectionOutline,
  DOMINO_SELECTION_OUTLINE_PADDING,
} from "./DominoSelectionOutline";
import { FaceRenderer } from "./face-renderers";

export const DominoTile = React.memo(function DominoTile({
  value1,
  value2,
  orientation = "up",
  faceStyle = "pips",
  scale = 1,
  state = "idle",
}: DominoTileProps) {
  const isVertical = orientation === "up" || orientation === "down";
  const width = isVertical ? domino.width : domino.height;
  const height = isVertical ? domino.height : domino.width;
  const halfTileSize = domino.width; // 56

  const glyph1 = defaultPipAdapter.getFaceGlyph(value1, faceStyle);
  const glyph2 = defaultPipAdapter.getFaceGlyph(value2, faceStyle);

  const isGhost = state === "ghost";
  const isSelected = state === "selected";
  const opacity = isGhost ? 0.5 : 1;

  // Calculate face positions based on orientation
  const face1 = { x: 0, y: 0 };
  const face2 = { x: 0, y: 0 };

  if (orientation === "up") {
    face1.y = 0;
    face2.y = halfTileSize;
  } else if (orientation === "down") {
    face1.y = halfTileSize;
    face2.y = 0;
  } else if (orientation === "left") {
    face1.x = 0;
    face2.x = halfTileSize;
  } else if (orientation === "right") {
    face1.x = halfTileSize;
    face2.x = 0;
  }

  const rotationAngle =
    {
      up: 0,
      right: 90,
      down: 180,
      left: 270,
    }[orientation] ?? 0;

  const dividerX1 = isVertical ? 2 : halfTileSize;
  const dividerY1 = isVertical ? halfTileSize : 2;
  const dividerX2 = isVertical ? width - 2 : halfTileSize;
  const dividerY2 = isVertical ? halfTileSize : height - 2;

  // Visual constants
  const extension = 5;
  const strokeWidth = 1;

  // Account for glow padding (max 3px + shadow space)
  const padding = DOMINO_SELECTION_OUTLINE_PADDING;
  const offset = strokeWidth / 2 + padding;

  const svgWidth = width + strokeWidth + padding * 2;
  const svgHeight = height + extension + strokeWidth + padding * 2;

  return (
    <View
      style={{
        width: width * scale,
        height: (height + extension) * scale,
        opacity,
      }}
    >
      <Svg
        width={(width + padding * 2) * scale}
        height={(height + extension + padding * 2) * scale}
        viewBox={`${-offset} ${-offset} ${svgWidth} ${svgHeight}`}
        style={{
          position: "absolute",
          left: -padding * scale,
          top: -padding * scale,
        }}
      >
        <Defs>
          <ClipPath id="tileBodyClip">
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={domino.borderRadius}
              ry={domino.borderRadius}
            />
          </ClipPath>
        </Defs>

        {/* Bottom edge shadow/perspective */}
        <Path
          d={`
            M 0,${height - domino.borderRadius}
            V ${height + extension - domino.borderRadius}
            Q 0,${height + extension} ${domino.borderRadius},${height + extension}
            H ${width - domino.borderRadius}
            Q ${width},${height + extension} ${width},${height + extension - domino.borderRadius}
            V ${height - domino.borderRadius}
          `}
          fill={domino.colors.bottomEdge}
          stroke={domino.colors.bottomEdgeStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />

        {/* Tile Body Wrapper for Clipping */}
        <G clipPath="url(#tileBodyClip)">
          {/* Tile Body Fill */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={domino.colors.body}
          />

          {/* Divider */}
          <Line
            x1={dividerX1}
            y1={dividerY1}
            x2={dividerX2}
            y2={dividerY2}
            stroke={domino.colors.divider}
            strokeWidth={strokeWidth}
          />

          {/* Face 1 */}
          <FaceRenderer
            glyph={glyph1}
            x={face1.x}
            y={face1.y}
            rotationAngle={rotationAngle}
            faceSize={halfTileSize}
          />

          {/* Face 2 */}
          <FaceRenderer
            glyph={glyph2}
            x={face2.x}
            y={face2.y}
            rotationAngle={rotationAngle}
            faceSize={halfTileSize}
          />
        </G>

        {/* Tile Body Outer Stroke */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={domino.borderRadius}
          ry={domino.borderRadius}
          fill="none"
          stroke={domino.colors.divider}
          strokeWidth={strokeWidth}
        />

        {/* Selected Overlay (Glow in front) */}
        {isSelected && (
          <DominoSelectionOutline
            width={width}
            height={height}
            borderRadius={domino.borderRadius}
          />
        )}
      </Svg>
    </View>
  );
});
