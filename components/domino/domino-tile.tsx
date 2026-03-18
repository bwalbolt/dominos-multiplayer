import React, { useId } from "react";
import { Platform, View } from "react-native";
import Svg, { ClipPath, Defs, G, Line, Path, Rect } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";

import { defaultPipAdapter } from "@/src/game-domain/presentation/pip-adapter";
import { FaceStyle } from "@/src/game-domain/presentation/tile-face";
import { DominoPip } from "@/src/game-domain/types";
import { domino } from "@/theme/tokens";

import { DominoSelectionOutline } from "./DominoSelectionOutline";
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
import {
  DominoTileRendererProps,
  DominoOrientation,
  DominoState,
  DominoTileProps,
  DominoTileRenderMode,
  TileAppearance,
  TilePose,
} from "./domino-tile.types";
import { FaceRenderer } from "./face-renderers";

export const DOMINO_TILE_RENDERER_BACKEND =
  Platform.OS === "web" || process.env.NODE_ENV === "test" ? "svg" : "skia";

const dominoTileSkiaModule =
  DOMINO_TILE_RENDERER_BACKEND === "skia"
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? (require("./domino-tile-skia") as typeof import("./domino-tile-skia"))
    : null;

type DominoTileHighlightShellProps = Readonly<{
  orientation?: DominoOrientation;
  state?: DominoState;
  appearance?: TileAppearance;
  pose?: TilePose;
}>;

type FacedownDominoTileProps = Readonly<{
  orientation?: DominoOrientation;
  appearance?: TileAppearance;
  pose?: TilePose;
}>;

export const DominoTile = React.memo(function DominoTile({
  scale = 1,
  appearance,
  pose,
  ...rest
}: DominoTileProps) {
  return (
    <DominoTileRenderer
      {...rest}
      appearance={{
        ...appearance,
        renderMode: appearance?.renderMode ?? "front",
      }}
      pose={{
        ...pose,
        scale: pose?.scale ?? scale,
      }}
    />
  );
});

export const DominoTileHighlightShell = React.memo(function DominoTileHighlightShell({
  orientation = "up",
  state = "selected",
  appearance,
  pose,
}: DominoTileHighlightShellProps) {
  return (
    <DominoTileRenderer
      orientation={orientation}
      state={state}
      appearance={{
        ...appearance,
        renderMode: "shell",
        showSelectionOutline:
          appearance?.showSelectionOutline ?? state === "selected",
      }}
      pose={pose}
    />
  );
});

export const FacedownDominoTile = React.memo(function FacedownDominoTile({
  orientation = "up",
  appearance,
  pose,
}: FacedownDominoTileProps) {
  return (
    <DominoTileRenderer
      orientation={orientation}
      appearance={{
        ...appearance,
        renderMode: "back",
      }}
      pose={pose}
    />
  );
});

function DominoTileRenderer({
  faceStyle = "pips",
  ...props
}: DominoTileRendererProps) {
  const shouldUseSkia =
    DOMINO_TILE_RENDERER_BACKEND === "skia" &&
    dominoTileSkiaModule !== null &&
    faceStyle === "pips";

  if (shouldUseSkia) {
    const { DominoTileSkiaRenderer } = dominoTileSkiaModule;
    return <DominoTileSkiaRenderer {...props} faceStyle={faceStyle} />;
  }

  return <DominoTileSvgRenderer {...props} faceStyle={faceStyle} />;
}

function DominoTileSvgRenderer({
  value1,
  value2,
  orientation = "up",
  faceStyle = "pips",
  state = "idle",
  appearance,
  pose,
}: DominoTileRendererProps) {
  const metrics = getDominoTileMetrics(orientation);
  const clipPathId = useId().replace(/:/g, "_");
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
  const rotateYDeg = (pose?.tiltYDeg ?? 0) + flipProgress * 180;

  return (
    <View
      style={[
        styles.surface,
        {
          width: metrics.bodySize.width * scale,
          height: metrics.frameSize.height * scale,
          opacity,
          shadowColor: domino.colors.shadow,
          shadowOpacity: showShadow
            ? resolveDominoTileShadowOpacity(
                renderMode,
                state,
                pose?.shadowOpacity,
              )
            : 0,
          shadowRadius: showShadow ? domino.shadowRadius + elevation : 0,
          shadowOffset: {
            width: domino.shadowOffsetX,
            height: domino.shadowOffsetY + elevation,
          },
          elevation: showShadow ? elevation : 0,
          transform: [
            { perspective: domino.perspective },
            { rotateX: `${pose?.tiltXDeg ?? 0}deg` },
            { rotateY: `${rotateYDeg}deg` },
          ],
        },
      ]}
    >
      <Svg
        width={(metrics.bodySize.width + metrics.padding * 2) * scale}
        height={(metrics.frameSize.height + metrics.padding * 2) * scale}
        viewBox={`${-metrics.svgOffset} ${-metrics.svgOffset} ${metrics.svgWidth} ${metrics.svgHeight}`}
        style={[
          styles.svgSurface,
          {
            left: -metrics.padding * scale,
            top: -metrics.padding * scale,
          },
        ]}
      >
        <Defs>
          <ClipPath id={clipPathId}>
            <Rect
              x={0}
              y={0}
              width={metrics.bodySize.width}
              height={metrics.bodySize.height}
              rx={domino.borderRadius}
              ry={domino.borderRadius}
            />
          </ClipPath>
        </Defs>

        <TileDepth metrics={metrics} renderMode={renderMode} />

        <G clipPath={`url(#${clipPathId})`}>
          <Rect
            x={0}
            y={0}
            width={metrics.bodySize.width}
            height={metrics.bodySize.height}
            fill={domino.colors.body}
            fillOpacity={renderMode === "shell" ? domino.shellBodyOpacity : 1}
          />

          <TileBevel metrics={metrics} renderMode={renderMode} />

          {renderMode !== "back" && (
            <TileFrontSurface
              value1={value1}
              value2={value2}
              faceStyle={faceStyle}
              orientation={orientation}
              renderMode={renderMode}
              metrics={metrics}
            />
          )}
        </G>

        <Rect
          x={0}
          y={0}
          width={metrics.bodySize.width}
          height={metrics.bodySize.height}
          rx={domino.borderRadius}
          ry={domino.borderRadius}
          fill="none"
          stroke={domino.colors.divider}
          strokeWidth={metrics.strokeWidth}
        />

        {showSelectionOutline && (
          <DominoSelectionOutline
            width={metrics.bodySize.width}
            height={metrics.bodySize.height}
            borderRadius={domino.borderRadius}
            stroke={appearance?.outlineStroke ?? domino.colors.selection}
          />
        )}
      </Svg>
    </View>
  );
}

function TileDepth({
  metrics,
  renderMode,
}: Readonly<{
  metrics: ReturnType<typeof getDominoTileMetrics>;
  renderMode: DominoTileRenderMode;
}>) {
  return (
    <>
      <Path
        d={buildDominoTileDepthFillPath(
          0,
          0,
          metrics.bodySize.width,
          metrics.bodySize.height,
          metrics.depthOffset,
          domino.borderRadius,
        )}
        fill={domino.colors.bottomEdge}
        fillOpacity={renderMode === "shell" ? domino.shellDepthOpacity : 1}
        fillRule="evenodd"
      />
      <Path
        d={buildDominoTileDepthPath(
          0,
          0,
          metrics.bodySize.width,
          metrics.bodySize.height,
          metrics.depthOffset,
          domino.borderRadius,
        )}
        fill="none"
        stroke={domino.colors.bottomEdgeStroke}
        strokeOpacity={renderMode === "shell" ? domino.shellDepthOpacity : 1}
        strokeWidth={metrics.strokeWidth}
        strokeLinejoin="round"
      />
    </>
  );
}

function TileBevel({
  metrics,
  renderMode,
}: Readonly<{
  metrics: ReturnType<typeof getDominoTileMetrics>;
  renderMode: DominoTileRenderMode;
}>) {
  const inset = domino.bevelInset;
  const innerWidth = metrics.bodySize.width - inset * 2;
  const opacity = renderMode === "shell" ? domino.shellBodyOpacity : 1;

  return (
    <>
      <Rect
        x={inset}
        y={inset}
        width={innerWidth}
        height={domino.faceHighlightHeight}
        fill={domino.colors.faceHighlight}
        fillOpacity={opacity}
      />
      <Path
        d={buildDominoTileBevelHighlightPath(
          0,
          0,
          metrics.bodySize.width,
          metrics.bodySize.height,
          inset,
        )}
        fill="none"
        stroke={domino.colors.bevelHighlight}
        strokeOpacity={opacity}
        strokeWidth={metrics.strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d={buildDominoTileBevelLowlightPath(
          0,
          0,
          metrics.bodySize.width,
          metrics.bodySize.height,
          inset,
        )}
        fill="none"
        stroke={domino.colors.bevelLowlight}
        strokeOpacity={opacity}
        strokeWidth={metrics.strokeWidth}
        strokeLinejoin="round"
      />
    </>
  );
}

function TileFrontSurface({
  value1,
  value2,
  faceStyle,
  orientation,
  renderMode,
  metrics,
}: Readonly<{
  value1?: DominoPip;
  value2?: DominoPip;
  faceStyle: FaceStyle;
  orientation: DominoOrientation;
  renderMode: DominoTileRenderMode;
  metrics: ReturnType<typeof getDominoTileMetrics>;
}>) {
  const [face1, face2] = getDominoTileFaceOffsets(orientation);
  const rotationAngle = getDominoTileRotationAngle(orientation);
  const showGlyphs = renderMode === "front" && value1 !== undefined && value2 !== undefined;

  return (
    <>
      <Line
        x1={metrics.divider.x1}
        y1={metrics.divider.y1}
        x2={metrics.divider.x2}
        y2={metrics.divider.y2}
        stroke={domino.colors.divider}
        strokeOpacity={renderMode === "shell" ? domino.shellDividerOpacity : 1}
        strokeWidth={metrics.strokeWidth}
      />

      {showGlyphs && (
        <>
          <FaceRenderer
            glyph={defaultPipAdapter.getFaceGlyph(value1, faceStyle)}
            x={face1.x}
            y={face1.y}
            rotationAngle={rotationAngle}
            faceSize={metrics.halfFaceSize}
          />
          <FaceRenderer
            glyph={defaultPipAdapter.getFaceGlyph(value2, faceStyle)}
            x={face2.x}
            y={face2.y}
            rotationAngle={rotationAngle}
            faceSize={metrics.halfFaceSize}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create(() => ({
  surface: {
    overflow: "visible",
  },
  svgSurface: {
    position: "absolute",
  },
}));
