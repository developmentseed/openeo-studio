/**
 * The agent contract schema is generated from `app/types/agent.ts`.
 *
 * This test fails when the committed schema is older than the types. It is
 * the reason the schema can live in the repository without going stale: the
 * types stay the one source, and the schema is a build product.
 *
 * Run `pnpm schema:agent` to make the file current again.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const SCHEMA_PATH = join(ROOT, 'app/types/agent-contract.schema.json');
const GENERATOR = join(ROOT, 'scripts/generate-agent-schema.mjs');

describe('agent contract schema', () => {
  it('matches the types in app/types/agent.ts', () => {
    // The generator exits with 1 and explains what to do when the file is old.
    expect(() =>
      execFileSync('node', [GENERATOR, '--check'], {
        cwd: ROOT,
        stdio: 'pipe'
      })
    ).not.toThrow();
  }, 120000);

  it('describes the types that the contract publishes', () => {
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
    const names = Object.keys(schema.definitions);

    expect(names).toEqual(
      expect.arrayContaining([
        'StudioStateDocument',
        'Proposal',
        'ToolDecision',
        'TriggerDescriptor',
        'AgentEvent',
        'AgentCard',
        'CatalogueItemRef'
      ])
    );
  });
});
