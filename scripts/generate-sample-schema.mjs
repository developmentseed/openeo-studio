/* eslint-disable no-undef */

/**
 * Generates the JSON Schema of the prefill sample from
 * `app/types/sample-prefill.ts`.
 *
 * Studio publishes the schema at `agents/sample.schema.json`, so that an
 * agent can validate the sample before it builds an `/editor?sample=` link.
 *
 * Run it with `pnpm schema:sample`. The test
 * `test/types/sample-schema.test.ts` fails when the committed file is old.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createGenerator } from 'ts-json-schema-generator';
import { format, resolveConfig } from 'prettier';

export const SCHEMA_PATH = 'app/types/sample-prefill.schema.json';

const GENERATOR_CONFIG = {
  path: 'app/types/sample-prefill.ts',
  tsconfig: 'tsconfig.app.json',
  type: 'SamplePrefill',
  skipTypeCheck: true,
  topRef: false,
  additionalProperties: false
};

export function buildSampleSchema() {
  const schema = createGenerator(GENERATOR_CONFIG).createSchema(
    GENERATOR_CONFIG.type
  );
  return {
    ...schema,
    $id: 'https://github.com/developmentseed/openeo-studio/sample.schema.json',
    title: 'openEO Studio prefill sample',
    $comment:
      'Generated from app/types/sample-prefill.ts. Do not edit by hand. Run `pnpm schema:sample`.'
  };
}

export async function renderSampleSchema(schema) {
  const options = await resolveConfig(SCHEMA_PATH);
  return format(JSON.stringify(schema), {
    ...options,
    filepath: SCHEMA_PATH,
    parser: 'json'
  });
}

const isMain =
  process.argv[1] && process.argv[1].endsWith('generate-sample-schema.mjs');

if (isMain) {
  const current = await renderSampleSchema(buildSampleSchema());

  if (process.argv.includes('--check')) {
    const committed = readFileSync(SCHEMA_PATH, 'utf8');
    if (current !== committed) {
      process.stderr.write(
        `${SCHEMA_PATH} is not current.\n` +
          'The type in app/types/sample-prefill.ts changed. ' +
          'Run `pnpm schema:sample` and commit the result.\n'
      );
      process.exit(1);
    }
    process.stdout.write(`${SCHEMA_PATH} is current.\n`);
  } else {
    writeFileSync(SCHEMA_PATH, current);
    process.stdout.write(`Wrote ${SCHEMA_PATH}\n`);
  }
}
