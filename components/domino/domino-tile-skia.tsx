import React from "react";
import { View } from "react-native";
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Line,
  Path,
  RoundedRect,
  Text as SkiaText,
  matchFont,
} from "@shopify/react-native-skia";
import { StyleSheet } from "react-native-unistyles";

import { defaultPipAdapter } from "@/src/game-domain/presentation/pip-adapter";
import {
  FaceGlyph,
  NumeralGlyph,
  PipGlyph,
} from "@/src/game-domain/presentation/tile-face";
import { domino, fontFamilies, fontWeights } from "@/theme/tokens";

import { DominoTileRendererProps, DominoTileRenderMode } from "./domino-tile.types";
import {
  buildDominoTileBevelHighlightPath,
  buildDominoTileBevelLowlightPath,
  buildDominoTileDepthFillPath,
  buildDominoTileDepthPath,
  clampDominoFlipProgress,
  getDominoTileFaceOffsets,
  getDominoTileMetrics,
  getDominoTileRotationAngle,
  resolveDominoTileOpacity,
  resolveDominoTileRenderMode,
  resolveDominoTileShadowOpacity,
} from "./domino-tile.utils";

export function DominoTileSkiaRenderer({
  value1,
  value2,
  orientation = "up",
  faceStyle = "pips",
  state = "idle",
  appearance,
  pose,
}: DominoTileRendererProps) {
  const metrics = getDominoTileMetrics(orientation);
  const scale = pose?.scale ?? 1;
  const elevation = pose?.elevation ?? domino.idleElevation;
  const flipProgress = clampDominoFlipProgress(pose?.flipProgress);
  const renderMode = resolveDominoTileRenderMode(
    appearance?.renderMode,
    flipProgress,
  );
  const opacity = resolveDominoTileOpacity(state, appearance?.opacity);
  const showShadow = appearance?.showShadow ?? true;
  const showSelectionOutline =
    appearance?.showSelectionOutline ?? state === "selected";

  const padding = metrics.padding * scale;
  const bodyX = padding;
  const bodyY = padding;
  const bodyWidth = metrics.bodySize.width * scale;
  const bodyHeight = metrics.bodySize.height * scale;
  const borderRadius = domino.borderRadius * scale;
  const strokeWidth = metrics.strokeWidth * scale;
  const depthOffset = metrics.depthOffset * scale;
  const bevelInset = domino.bevelInset * scale;
  const faceHighlightHeight = domino.faceHighlightHeight * scale;
  const canvasWidth = (metrics.bodySize.width + metrics.padding * 2) * scale;
  const canvasHeight = (metrics.frameSize.height + metrics.padding * 2) * scale;
  const rotateYDeg = (pose?.tiltYDeg ?? 0) + flipProgress * 180;
  const outlineColor = appearance?.outlineStroke ?? domino.colors.selection;
  const shellOpacity = renderMode === "shell" ? domino.shellBodyOpacity : 1;
  const shadowOpacity = showShadow
    ? resolveDominoTileShadowOpacity(renderMode, state, pose?.shadowOpacity)
    : 0;
  const shadowBlur = (domino.shadowRadius + elevation) * scale;
  const shadowY = bodyY + (domino.shadowOffsetY + elevation) * scale;
  const [face1, face2] = getDominoTileFaceOffsets(orientation);
  const rotationAngleRad = (getDominoTileRotationAngle(orientation) * Math.PI) / 180;

  return (
    <View
      style={[
        styles.surface,
        {
          width: metrics.bodySize.width * scale,
          height: metrics.frameSize.height * scale,
          opacity,
          transform: [
            { perspective: domino.perspective },
            { rotateX: `${pose?.tiltXDeg ?? 0}deg` },
            { rotateY: `${rotateYDeg}deg` },
          ],
        },
      ]}
    >
      <Canvas
        style={[
          styles.canvasSurface,
          {
            width: canvasWidth,
            height: canvasHeight,
            left: -padding,
            top: -padding,
          },
        ]}
      >
        {showShadow && (
          <RoundedRect
            x={bodyX + domino.shadowOffsetX * scale}
            y={shadowY}
            width={bodyWidth}
            height={bodyHeight}
            r={borderRadius}
            color={domino.colors.shadow}
            opacity={shadowOpacity}
          >
            <BlurMask blur={shadowBlur} style="normal" respectCTM={true} />
          </RoundedRect>
        )}

        <Path
          path={buildDominoTileDepthFillPath(
            bodyX,
            bodyY,
            bodyWidth,
            bodyHeight,
            depthOffset,
            borderRadius,
          )}
          color={domino.colors.bottomEdge}
          opacity={renderMode === "shell" ? domino.shellDepthOpacity : 1}
          fillType="evenOdd"
        />
        <Path
          path={buildDominoTileDepthPath(
            bodyX,
            bodyY,
            bodyWidth,
            bodyHeight,
            depthOffset,
            borderRadius,
          )}
          color={domino.colors.bottomEdgeStroke}
          opacity={renderMode === "shell" ? domino.shellDepthOpacity : 1}
          style="stroke"
          strokeWidth={strokeWidth}
        />

        <RoundedRect
          x={bodyX}
          y={bodyY}
          width={bodyWidth}
          height={bodyHeight}
          r={borderRadius}
          color={domino.colors.body}
          opacity={shellOpacity}
        />

        <RoundedRect
          x={bodyX + bevelInset}
          y={bodyY + bevelInset}
          width={bodyWidth - bevelInset * 2}
          height={faceHighlightHeight}
          r={Math.max(0, borderRadius - bevelInset)}
          color={domino.colors.faceHighlight}
          opacity={shellOpacity}
        />
        <Path
          path={buildDominoTileBevelHighlightPath(
            bodyX,
            bodyY,
            bodyWidth,
            bodyHeight,
            bevelInset,
          )}
          color={domino.colors.bevelHighlight}
          opacity={shellOpacity}
          style="stroke"
          strokeWidth={strokeWidth}
        />
        <Path
          path={buildDominoTileBevelLowlightPath(
            bodyX,
            bodyY,
            bodyWidth,
            bodyHeight,
            bevelInset,
          )}
          color={domino.colors.bevelLowlight}
          opacity={shellOpacity}
          style="stroke"
          strokeWidth={strokeWidth}
        />

        {renderMode !== "back" && (
          <SkiaFrontSurface
            value1={value1}
            value2={value2}
            faceStyle={faceStyle}
            orientation={orientation}
            renderMode={renderMode}
            face1={face1}
            face2={face2}
            bodyX={bodyX}
            bodyY={bodyY}
            bodyWidth={bodyWidth}
            bodyHeight={bodyHeight}
            strokeWidth={strokeWidth}
            scale={scale}
            rotationAngleRad={rotationAngleRad}
          />
        )}

        <RoundedRect
          x={bodyX}
          y={bodyY}
          width={bodyWidth}
          height={bodyHeight}
          r={borderRadius}
          color={domino.colors.divider}
          style="stroke"
          strokeWidth={strokeWidth}
        />

        {showSelectionOutline && (
          <SkiaSelectionOutline
            x={bodyX}
            y={bodyY}
            width={bodyWidth}
            height={bodyHeight}
            borderRadius={borderRadius}
            strokeWidth={strokeWidth}
            scale={scale}
            color={outlineColor}
          />
        )}
      </Canvas>
    </View>
  );
}

function SkiaFrontSurface({
  value1,
  value2,
  faceStyle,
  orientation,
  renderMode,
  face1,
  face2,
  bodyX,
  bodyY,
  bodyWidth,
  bodyHeight,
  strokeWidth,
  scale,
  rotationAngleRad,
}: Readonly<{
  value1?: DominoTileRendererProps["value1"];
  value2?: DominoTileRendererProps["value2"];
  faceStyle: DominoTileRendererProps["faceStyle"];
  orientation: NonNullable<DominoTileRendererProps["orientation"]>;
  renderMode: DominoTileRenderMode;
  face1: Readonly<{ x: number; y: number }>;
  face2: Readonly<{ x: number; y: number }>;
  bodyX: number;
  bodyY: number;
  bodyWidth: number;
  bodyHeight: number;
  strokeWidth: number;
  scale: number;
  rotationAngleRad: number;
}>) {
  const divider = getDominoTileMetrics(orientation).divider;
  const showGlyphs = renderMode === "front" && value1 !== undefined && value2 !== undefined;
  const dividerOpacity =
    renderMode === "shell" ? domino.shellDividerOpacity : 1;

  return (
    <>
      <Line
        p1={{
          x: bodyX + divider.x1 * scale,
          y: bodyY + divider.y1 * scale,
        }}
        p2={{
          x: bodyX + divider.x2 * scale,
          y: bodyY + divider.y2 * scale,
        }}
        color={domino.colors.divider}
        opacity={dividerOpacity}
        strokeWidth={strokeWidth}
      />

      {showGlyphs && (
        <>
          <SkiaFaceRenderer
            glyph={defaultPipAdapter.getFaceGlyph(value1, faceStyle ?? "pips")}
            x={bodyX + face1.x * scale}
            y={bodyY + face1.y * scale}
            faceSize={domino.width * scale}
            rotationAngleRad={rotationAngleRad}
          />
          <SkiaFaceRenderer
            glyph={defaultPipAdapter.getFaceGlyph(value2, faceStyle ?? "pips")}
            x={bodyX + face2.x * scale}
            y={bodyY + face2.y * scale}
            faceSize={domino.width * scale}
            rotationAngleRad={rotationAngleRad}
          />
        </>
      )}
    </>
  );
}

function SkiaFaceRenderer({
  glyph,
  x,
  y,
  faceSize,
  rotationAngleRad,
}: Readonly<{
  glyph: FaceGlyph;
  x: number;
  y: number;
  faceSize: number;
  rotationAngleRad: number;
}>) {
  if (glyph.style === "pips") {
    return (
      <SkiaPipFace
        glyph={glyph as PipGlyph}
        x={x}
        y={y}
        faceSize={faceSize}
      />
    );
  }

  if (glyph.style === "numerals") {
    return (
      <SkiaNumeralFace
        glyph={glyph as NumeralGlyph}
        x={x}
        y={y}
        faceSize={faceSize}
        rotationAngleRad={rotationAngleRad}
      />
    );
  }

  return null;
}

function SkiaPipFace({
  glyph,
  x,
  y,
  faceSize,
}: Readonly<{
  glyph: PipGlyph;
  x: number;
  y: number;
  faceSize: number;
}>) {
  return (
    <>
      {glyph.pips.map((pip, index) => (
        <Circle
          key={`${index}-${pip.x}-${pip.y}`}
          cx={x + pip.x * faceSize}
          cy={y + pip.y * faceSize}
          r={(domino.pipSize / 2) * (faceSize / domino.width)}
          color={domino.colors.pips}
        />
      ))}
    </>
  );
}

function SkiaNumeralFace({
  glyph,
  x,
  y,
  faceSize,
  rotationAngleRad,
}: Readonly<{
  glyph: NumeralGlyph;
  x: number;
  y: number;
  faceSize: number;
  rotationAngleRad: number;
}>) {
  const scale = faceSize / domino.width;
  const font = matchFont({
    fontFamily: fontFamilies.body,
    fontSize: domino.numeralFontSize * scale,
    fontWeight: fontWeights.black,
  });
  const bounds = font.measureText(glyph.label);
  const textWidth = bounds.width ?? 0;
  const center = faceSize / 2;

  return (
    <Group transform={[{ rotate: rotationAngleRad }]} origin={{ x: x + center, y: y + center }}>
      <SkiaText
        x={x + center - textWidth / 2}
        y={y + center + domino.numeralVerticalOffset * scale}
        text={glyph.label}
        font={font}
        color={domino.colors.pips}
      />
    </Group>
  );
}

function SkiaSelectionOutline({
  x,
  y,
  width,
  height,
  borderRadius,
  strokeWidth,
  scale,
  color,
}: Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  strokeWidth: number;
  scale: number;
  color: string;
}>) {
  const glowOffset = domino.selectionPulseOffset * scale;
  const baseStrokeWidth = domino.selectionStrokeWidth * scale;

  return (
    <>
      <RoundedRect
        x={x}
        y={y}
        width={width}
        height={height}
        r={borderRadius}
        color={color}
        style="stroke"
        strokeWidth={Math.max(strokeWidth, baseStrokeWidth)}
      />
      <RoundedRect
        x={x - glowOffset / 2}
        y={y - glowOffset / 2}
        width={width + glowOffset}
        height={height + glowOffset}
        r={borderRadius + glowOffset / 2}
        color={color}
        opacity={0.35}
        style="stroke"
        strokeWidth={Math.max(
          strokeWidth,
          baseStrokeWidth * domino.selectionStrokeWidthGain,
        )}
      />
    </>
  );
}

const styles = StyleSheet.create(() => ({
  surface: {
    overflow: "visible",
  },
  canvasSurface: {
    position: "absolute",
  },
}));
