import { StyleSheet } from "react-native-unistyles";
import { designTokens } from "./tokens";

export const lightTheme = {
  colors: designTokens.colors,
} as const;

export const darkTheme = {
  // Can be implemented later. Mirror lightTheme for now.
  ...lightTheme,
} as const;

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Define the Unistyles types globally based on our specific configuration
type AppBreakpoints = typeof breakpoints;
type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  breakpoints,
  themes: {
    light: lightTheme,
    dark: darkTheme, // Fallback for dark theme to unblock feature testing
  },
  settings: {
    initialTheme: "light",
  },
});
