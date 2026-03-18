export function resolveOpponentLaunchTileIndex(count: number): number {
  return Math.floor((count - 1) / 2);
}

export function shouldHideOpponentLaunchTile(
  index: number,
  count: number,
  isLaunchingTile: boolean,
): boolean {
  return isLaunchingTile && index === resolveOpponentLaunchTileIndex(count);
}
