import { readFileSync } from 'fs';
import { join } from 'path';

import {
  LOADER_GLOBALS,
  OPENEO_PROCESS_NAMES,
  PUBLIC_GLOBALS
} from '../../app/algorithms/base/environment';

const ALGORITHMS = join(__dirname, '../../app/algorithms');
const read = (path: string) => readFileSync(join(ALGORITHMS, path), 'utf8');

/**
 * The public top-level names that a Python file defines: assignments,
 * functions, and imports. Names that start with `_` are private.
 */
function topLevelNames(source: string): string[] {
  const names = new Set<string>();
  for (const line of source.split('\n')) {
    const assign = line.match(/^([A-Za-z]\w*)\s*(?::[^=]+)?=(?!=)/);
    const def = line.match(/^def\s+([A-Za-z]\w*)\s*\(/);
    const importAs = line.match(/^import\s+[\w.]+\s+as\s+([A-Za-z]\w*)/);
    const plainImport = line.match(/^import\s+([A-Za-z]\w*)\s*$/);
    const fromImport = line.match(/^from\s+[\w.]+\s+import\s+(.+)$/);
    for (const match of [assign, def, importAs, plainImport]) {
      if (match) names.add(match[1]);
    }
    if (fromImport) {
      fromImport[1]
        .split(',')
        .map((part) =>
          part
            .trim()
            .split(/\s+as\s+/)
            .pop()!
        )
        .filter((name) => /^[A-Za-z]\w*$/.test(name))
        .forEach((name) => names.add(name));
    }
  }
  return [...names];
}

describe('code contract', () => {
  it.each(['base/processes.py', 'base/loader.py'])(
    'lists every top-level name of %s in LOADER_GLOBALS',
    (file) => {
      const missing = topLevelNames(read(file)).filter(
        (name) => !LOADER_GLOBALS.includes(name)
      );
      expect(missing).toEqual([]);
    }
  );

  it('exposes all openEO processes, with built-in clashes underscored', () => {
    expect(OPENEO_PROCESS_NAMES.length).toBeGreaterThan(100);
    expect(OPENEO_PROCESS_NAMES).toEqual(
      expect.arrayContaining(['clip', 'sqrt', 'if_', 'and_', 'or_', 'not_'])
    );
    expect(OPENEO_PROCESS_NAMES).toEqual(
      expect.arrayContaining(['max_', 'min_', 'sum_', 'round_', 'int_'])
    );
    for (const builtin of ['max', 'min', 'sum', 'round', 'int', 'all', 'any']) {
      expect(OPENEO_PROCESS_NAMES).not.toContain(builtin);
    }
  });

  it('documents only names that exist', () => {
    const defined = new Set(LOADER_GLOBALS);
    for (const { name } of PUBLIC_GLOBALS) {
      for (const part of name.replace(/\(.*\)/, '').split(',')) {
        expect(defined.has(part.trim())).toBe(true);
      }
    }
  });

  it.each(['apa', 'bais2', 'cloud-detection', 'lava', 'ndci', 'true-color'])(
    'sample %s calls processes as op.<name>',
    (sample) => {
      const source = read(`visualizations/${sample}.py`);
      const bare = OPENEO_PROCESS_NAMES.filter((name) =>
        new RegExp(`(?<![\\w.])${name}\\(`).test(
          source.replace(/^\s*def\s+\w+\(/gm, '')
        )
      );
      expect(bare).toEqual([]);
    }
  );
});
