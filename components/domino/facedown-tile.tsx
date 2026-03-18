import React from "react";

import { FacedownDominoTile } from "./domino-tile";
import {
  DominoOrientation,
  TileAppearance,
  TilePose,
} from "./domino-tile.types";

interface FacedownTileProps {
  scale?: number;
  orientation?: DominoOrientation;
  appearance?: TileAppearance;
  pose?: TilePose;
}

export const FacedownTile = React.memo(function FacedownTile({
  scale = 1,
  orientation = "up",
  appearance,
  pose,
}: FacedownTileProps) {
  return (
    <FacedownDominoTile
      orientation={orientation}
      appearance={appearance}
      pose={{
        ...pose,
        scale: pose?.scale ?? scale,
      }}
    />
  );
});
