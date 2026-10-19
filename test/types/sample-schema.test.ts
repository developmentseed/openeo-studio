/**
 * The prefill sample schema is generated from `app/types/sample-prefill.ts`.
 * This test fails when the committed schema is older than the type.
 *
 * Run `pnpm schema:sample` to make the file current again.
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const GENERATOR = join(ROOT, 'scripts/generate-sample-schema.mjs');

describe('prefill sample schema', () => {
  it('matches the type in app/types/sample-prefill.ts', () => {
    expect(() =>
      execFileSync('node', [GENERATOR, '--check'], {
        cwd: ROOT,
        stdio: 'pipe'
      })
    ).not.toThrow();
  }, 120000);
});
