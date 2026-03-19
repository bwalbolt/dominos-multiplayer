jest.mock("@shopify/react-native-skia", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const createViewComponent = (displayName) => {
    const Component = ({ children, ...props }) =>
      React.createElement(View, props, children);
    Component.displayName = displayName;
    return Component;
  };

  const SkiaText = ({ text, ...props }) =>
    React.createElement(Text, props, text);

  SkiaText.displayName = "SkiaText";

  return {
    BlurMask: createViewComponent("BlurMask"),
    Canvas: createViewComponent("Canvas"),
    Circle: createViewComponent("Circle"),
    Group: createViewComponent("Group"),
    Line: createViewComponent("Line"),
    Path: createViewComponent("Path"),
    RoundedRect: createViewComponent("RoundedRect"),
    Text: SkiaText,
    matchFont: ({ fontSize = 0 } = {}) => ({
      measureText: (text = "") => ({
        x: 0,
        y: 0,
        width: text.length * fontSize * 0.6,
        height: fontSize,
      }),
    }),
  };
});

jest.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (factory) =>
      typeof factory === "function" ? factory({ colors: {} }) : factory,
    absoluteFillObject: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
  useUnistyles: () => ({
    theme: {
      colors: {},
    },
  }),
}));
