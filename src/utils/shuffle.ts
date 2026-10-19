/**
 * Deterministically or pseudo-randomly shuffles an array without mutating the original.
 * Uses the Fisher-Yates (Knuth) shuffle algorithm.
 */
export function shuffleArray<T>(items: readonly T[] | T[] | undefined): T[] {
  if (!items || items.length <= 1) {
    return items ? [...items] : [];
  }
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
