/**
 * A simple seeded pseudo-random number generator (SplitMix32).
 * Fast, deterministic, and sufficient for shuffling tiles.
 */
export function createPRNG(seed: number) {
  let h = (seed | 0) + 0x9e3779b9;
  return function () {
    h ^= h >>> 16;
    h = Math.imul(h, 0x21f0aaad);
    h ^= h >>> 15;
    h = Math.imul(h, 0x735a2d97);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array using a provided PRNG.
 */
export function shuffle<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
