/**
 * Up to `count` distinct items picked at random. The same seed always picks
 * the same items, in the same order.
 */
export function seededPick<T>(items: T[], count: number, seed: number): T[] {
  // mulberry32: a small, well-distributed 32-bit PRNG.
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const pool = [...items];
  return Array.from(
    { length: Math.min(count, pool.length) },
    () => pool.splice(Math.floor(random() * pool.length), 1)[0]
  );
}
