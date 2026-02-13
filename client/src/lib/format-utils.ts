/**
 * Format large numbers with k/M/B suffixes
 *
 * Examples:
 * - 999 → "999"
 * - 1000 → "1k"
 * - 1500 → "1.5k"
 * - 2347 → "2.3k"
 * - 1000000 → "1M"
 * - 2500000 → "2.5M"
 * - 1000000000 → "1B"
 */
export function formatCount(count: number): string {
  if (count >= 1000000000) {
    return (count / 1000000000).toFixed(count % 1000000000 === 0 ? 0 : 1) + 'B';
  } else if (count >= 1000000) {
    return (count / 1000000).toFixed(count % 1000000 === 0 ? 0 : 1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(count % 1000 === 0 ? 0 : 1) + 'k';
  }
  return count.toString();
}
