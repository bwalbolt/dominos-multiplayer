import React from "react";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { domino } from "@/theme/tokens";

interface FacedownTileProps {
  scale?: number;
}

export const FacedownTile: React.FC<FacedownTileProps> = ({ scale = 1 }) => {
  const width = domino.width;
  const height = domino.height;
  const extension = 5;
  const strokeWidth = 1;
  const padding = 6;
  const offset = strokeWidth / 2 + padding;

  const svgWidth = width + strokeWidth + padding * 2;
  const svgHeight = height + extension + strokeWidth + padding * 2;

  return (
    <View
      style={{
        width: width * scale,
        height: (height + extension) * scale,
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

        {/* Tile Body Fill */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={domino.borderRadius}
          ry={domino.borderRadius}
          fill={domino.colors.body}
          stroke={domino.colors.divider}
          strokeWidth={strokeWidth}
        />
      </Svg>
    </View>
  );
};
