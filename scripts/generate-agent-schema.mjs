/* eslint-disable no-undef */

/**
 * Generates the JSON Schema of the agent contract from `app/types/agent.ts`.
 *
 * The TypeScript file is the one source. This script writes the schema that
 * openEO Studio publishes, so that an agent in another language can validate
 * the state document, the proposals, and the tool arguments.
 *
 * Run it with `pnpm schema:agent`. The test
 * `test/types/agent-schema.test.ts` fails when the committed file is old.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createGenerator } from 'ts-json-schema-generator';
import { format, resolveConfig } from 'prettier';

export const SCHEMA_PATH = 'app/types/agent-contract.schema.json';

export const GENERATOR_CONFIG = {
  path: 'app/types/agent.ts',
  tsconfig: 'tsconfig.app.json',
  type: '*',
  // The types are the source of truth. A full type check here would also
  // report the unrelated errors that exist elsewhere in the app.
  skipTypeCheck: true,
  topRef: true,
  additionalProperties: false
};

/** Builds the schema object. The test uses this function too. */
export function buildAgentSchema() {
  const schema = createGenerator(GENERATOR_CONFIG).createSchema(
    GENERATOR_CONFIG.type
  );

  return {
    $id: 'https://github.com/developmentseed/openeo-studio/agent-contract.schema.json',
    title: 'openEO Studio agent contract',
    description:
      'Generated from app/types/agent.ts. Do not edit by hand. Run `pnpm schema:agent`.',
    ...schema
  };
}

/**
 * Renders the schema with the Prettier settings of the repository, so that
 * the file the generator writes is the file the linter expects.
 */
export async function renderAgentSchema(schema) {
  const options = await resolveConfig(SCHEMA_PATH);
  return format(JSON.stringify(schema), {
    ...options,
    filepath: SCHEMA_PATH,
    parser: 'json'
  });
}

const isMain =
  process.argv[1] && process.argv[1].endsWith('generate-agent-schema.mjs');

if (isMain) {
  const current = await renderAgentSchema(buildAgentSchema());

  // `--check` compares only. Continuous integration and the unit test use it.
  if (process.argv.includes('--check')) {
    const committed = readFileSync(SCHEMA_PATH, 'utf8');
    if (current !== committed) {
      process.stderr.write(
        `${SCHEMA_PATH} is not current.\n` +
          'The types in app/types/agent.ts changed. ' +
          'Run `pnpm schema:agent` and commit the result.\n'
      );
      process.exit(1);
    }
    process.stdout.write(`${SCHEMA_PATH} is current.\n`);
  } else {
    writeFileSync(SCHEMA_PATH, current);
    process.stdout.write(`Wrote ${SCHEMA_PATH}\n`);
  }
}
