import type { TextStyle } from "react-native";

type FontWeight = NonNullable<TextStyle["fontWeight"]>;

export type TypographyToken = Readonly<{
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeight;
  letterSpacing: number;
}>;

// Extracted from Figma file C4ZIO7dO9LwK158lzLUKCH, node 18:728.
export const colors = {
  backgroundColor: "#F5F7FF",
  white: "#FFFFFF",
  black: "#000000",
  black66: "#000000A8",
  black45: "#00000073",
  black24: "#0000003D",
  black08: "#00000014",
  iron: "#4E3D42",
  shadow: "#00156B3D",
  teal: "#086375",
  blurple: "#544EE8",
  purple: "#A855F7",
  purple32: "#A855F752",
  purple08: "#A855F714",
  blue: "#0EA5E9",
  blue32: "#0EA5E952",
  blue08: "#0EA5E914",
  pink: "#EC4899",
  pink32: "#EC489952",
  pink08: "#EC489914",
  green: "#14B8A6",
  green32: "#14B8A652",
  green08: "#14B8A614",
} as const;

export const fontFamilies = {
  display: "Alpino",
  body: "SF Pro",
} as const;

export const fontWeights = {
  regular: "400",
  bold: "700",
  black: "900",
} as const satisfies Record<string, FontWeight>;

export const typography = {
  headline1: {
    fontFamily: fontFamilies.display,
    fontSize: 50,
    lineHeight: 50,
    fontWeight: fontWeights.black,
    letterSpacing: 0,
  },
  headline2: {
    fontFamily: fontFamilies.display,
    fontSize: 40,
    lineHeight: 40,
    fontWeight: fontWeights.black,
    letterSpacing: 0,
  },
  headline3: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    lineHeight: 32,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
  },
  headline4: {
    fontFamily: fontFamilies.display,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
  },
  headline5: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
  },
  headline6: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
  },
  labelText: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.black,
    letterSpacing: 0,
  },
  paragraph: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },
  smallText: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },
  tinyText: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },
} as const satisfies Record<string, TypographyToken>;

export const designTokens = {
  colors,
  fontFamilies,
  fontWeights,
  typography,
} as const;
