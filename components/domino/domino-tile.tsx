import React from "react";

import { DominoTileSkiaRenderer } from "./domino-tile-skia";
import {
  DominoOrientation,
  DominoState,
  DominoTileProps,
  DominoTileRendererProps,
  TileAppearance,
  TilePose,
} from "./domino-tile.types";

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
  return <DominoTileSkiaRenderer {...props} faceStyle={faceStyle} />;
}
