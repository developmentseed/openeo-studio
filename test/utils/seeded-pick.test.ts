import { seededPick } from '$utils/seeded-pick';

const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('seededPick', () => {
  it('picks the same items for the same seed', () => {
    expect(seededPick(ITEMS, 2, 493_000)).toEqual(
      seededPick(ITEMS, 2, 493_000)
    );
  });

  it('picks distinct items from the list', () => {
    for (let seed = 0; seed < 50; seed++) {
      const picked = seededPick(ITEMS, 2, seed);
      expect(picked).toHaveLength(2);
      expect(new Set(picked).size).toBe(2);
      picked.forEach((item) => expect(ITEMS).toContain(item));
    }
  });

  it('varies the picks across seeds', () => {
    const picks = new Set(
      Array.from({ length: 24 }, (_, seed) =>
        seededPick(ITEMS, 2, seed).join()
      )
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it('returns every item when asked for more than exist', () => {
    expect(seededPick(ITEMS, 10, 1).sort()).toEqual(ITEMS);
  });
});
