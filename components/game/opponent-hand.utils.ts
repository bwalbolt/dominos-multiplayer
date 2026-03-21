export function resolveOpponentLaunchTileIndex(count: number): number {
  return Math.floor((count - 1) / 2);
}

export function resolveOpponentPendingDrawTileIndex(count: number): number {
  return Math.max(0, count - 1);
}

export function shouldHideOpponentLaunchTile(
  index: number,
  count: number,
  isLaunchingTile: boolean,
): boolean {
  return shouldHideOpponentTile(index, count, {
    isLaunchingTile,
    pendingDrawTileIndex: null,
  });
}

export function shouldHideOpponentTile(
  index: number,
  count: number,
  input: Readonly<{
    isLaunchingTile: boolean;
    pendingDrawTileIndex: number | null;
  }>,
): boolean {
  return (
    (input.isLaunchingTile &&
      index === resolveOpponentLaunchTileIndex(count)) ||
    index === input.pendingDrawTileIndex
  );
}
