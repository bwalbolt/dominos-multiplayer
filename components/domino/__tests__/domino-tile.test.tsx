import React from "react";
import { View } from "react-native";
// eslint-disable-next-line import/no-unresolved
import * as TestRenderer from "react-test-renderer";
import {
  DominoTile,
  DominoTileHighlightShell,
  FacedownDominoTile,
} from "../domino-tile";

const { act } = TestRenderer;

describe("domino-tile", () => {
  it("renders skia tile variants for pip and numeral faces", async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <View>
          <DominoTile value1={6} value2={4} />
          <DominoTile
            value1={3}
            value2={1}
            faceStyle="numerals"
            orientation="right"
          />
          <DominoTileHighlightShell orientation="left" />
          <FacedownDominoTile orientation="down" />
        </View>,
      );
    });

    expect(renderer!.root.findAllByType(View).length).toBeGreaterThan(0);
  });
});
