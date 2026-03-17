import { spacing } from "@/theme/tokens";

export type HandPanIntent = "wait" | "activate_drag" | "yield_to_scroll";

export const handPanIntentThresholds = {
  verticalActivationDistance: spacing[4],
  horizontalYieldDistance: spacing[32],
  directionBias: spacing[4],
} as const;

type ResolveHandPanIntentInput = Readonly<{
  translationX: number;
  translationY: number;
}>;

export function resolveHandPanIntent(
  input: ResolveHandPanIntentInput,
): HandPanIntent {
  "worklet";

  const absX = Math.abs(input.translationX);
  const absY = Math.abs(input.translationY);

  if (
    input.translationY <= -handPanIntentThresholds.verticalActivationDistance &&
    absY >= absX + handPanIntentThresholds.directionBias
  ) {
    return "activate_drag";
  }

  if (
    absX >= handPanIntentThresholds.horizontalYieldDistance &&
    absX >= absY + handPanIntentThresholds.directionBias
  ) {
    return "yield_to_scroll";
  }

  return "wait";
}
