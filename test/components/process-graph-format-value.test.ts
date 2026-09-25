import { formatArgumentValue } from '$components/process-graph/format-value';

describe('formatArgumentValue', () => {
  describe('values that render in full', () => {
    it('renders true with a check glyph and no popover', () => {
      expect(formatArgumentValue(true, 'flag')).toEqual({
        display: 'true',
        glyph: 'check'
      });
    });

    it('renders false with a cross glyph and no popover', () => {
      expect(formatArgumentValue(false, 'flag')).toEqual({
        display: 'false',
        glyph: 'cross'
      });
    });

    it('renders a number with no popover', () => {
      expect(formatArgumentValue(255, 'output_max')).toEqual({
        display: '255'
      });
    });

    it('renders a short string verbatim with no popover', () => {
      expect(formatArgumentValue('PNG', 'format')).toEqual({ display: 'PNG' });
    });

    it('renders null as n/a with no popover', () => {
      expect(formatArgumentValue(null, 'target_dimension')).toEqual({
        display: 'n/a'
      });
    });
  });

  describe('strings', () => {
    it('truncates past the budget and exposes the full value', () => {
      // budget = max(24 - 'id'.length, 8) = 22
      const value = 'a'.repeat(50);
      const result = formatArgumentValue(value, 'id');
      expect(result.display).toBe(`${'a'.repeat(22)}…`);
      expect(result.full).toBe(JSON.stringify(value, null, 2));
    });

    it('floors the budget at 8 for very long labels', () => {
      const label = 'x'.repeat(40);
      const result = formatArgumentValue('abcdefghijklmno', label);
      expect(result.display).toBe('abcdefgh…');
    });
  });

  describe('arrays', () => {
    it('joins elements when they fit the budget', () => {
      // Short label so "a, b" fits max(24 - 2, 8) = 22.
      const value = ['a', 'b'];
      const result = formatArgumentValue(value, 'ab');
      expect(result.display).toBe('a, b');
      expect(result.full).toBe(JSON.stringify(value, null, 2));
    });

    it('collapses to List(n) when the joined text overflows', () => {
      const value = ['reflectance|b02', 'reflectance|b03', 'reflectance|b04'];
      const result = formatArgumentValue(value, 'bands');
      expect(result.display).toBe('List(3)');
      expect(result.full).toBe(JSON.stringify(value, null, 2));
    });

    it('renders an empty array as List(0)', () => {
      expect(formatArgumentValue([], 'bands').display).toBe('List(0)');
    });
  });

  describe('objects', () => {
    it('renders an empty object as None', () => {
      // Empty objects are shown as None with no popover (same as null → n/a).
      expect(formatArgumentValue({}, 'properties')).toEqual({
        display: 'None'
      });
    });

    it('recognises a bounding box', () => {
      const value = { west: 12, south: 44.5, east: 14, north: 46 };
      expect(formatArgumentValue(value, 'spatial_extent').display).toBe(
        'Bounding Box'
      );
    });

    it('renders GeoJSON as its type', () => {
      const value = { type: 'Polygon', coordinates: [] };
      expect(formatArgumentValue(value, 'geometries').display).toBe('Polygon');
    });

    it('renders a parameter reference with a dollar prefix', () => {
      const result = formatArgumentValue({ from_parameter: 'bands' }, 'bands');
      expect(result.display).toBe('$bands');
    });

    it('renders a node reference with an arrow', () => {
      const result = formatArgumentValue({ from_node: 'lc1' }, 'data');
      expect(result.display).toBe('← lc1');
    });

    it('falls back to Object for anything else', () => {
      const result = formatArgumentValue({ a: 1, b: 2 }, 'options');
      expect(result.display).toBe('Object');
      expect(result.full).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
    });
  });
});
