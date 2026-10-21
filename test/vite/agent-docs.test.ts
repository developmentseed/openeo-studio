/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildAgentDocs,
  isAgentDocPath,
  resolveAgentDocsValues
} from '../../vite/plugins/agent-docs';
import { SAMPLE_SCENES_META } from '$config/sample-scenes-meta';
import { validateSamplePrefill } from '$utils/sample-prefill';

const ROOT = join(__dirname, '..', '..');
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');

function sources() {
  const algorithms: Record<string, string> = {};
  for (const sample of SAMPLE_SCENES_META) {
    algorithms[sample.algorithm] = read(`app/algorithms/${sample.algorithm}`);
  }
  return {
    loaderScript: read('app/algorithms/base/loader.py'),
    userGuide: read('app/pages/docs/docs-content.md'),
    sampleSchema: read('app/types/sample-prefill.schema.json'),
    algorithms
  };
}

describe('agent docs', () => {
  const values = resolveAgentDocsValues(
    {
      VITE_BASE_URL: 'https://example.org/studio/',
      VITE_OPENEO_API_URL: 'https://api.example.org/openeo/'
    },
    '1.2.3'
  );
  const docs = buildAgentDocs(values, sources());

  it('uses the deployment URL without a trailing slash', () => {
    expect(values.rootUrl).toBe('https://example.org/studio');
    expect(values.openeoApiUrl).toBe('https://api.example.org/openeo');
    expect(docs['llms.txt']).toContain(
      'https://example.org/studio/agents/script-contract.md'
    );
    expect(docs['llms.txt']).not.toContain('studio//');
  });

  it('keeps the Docker placeholders when VITE_BASE_URL is one', () => {
    const docker = resolveAgentDocsValues(
      {
        VITE_BASE_URL: '${BASE_URL}',
        VITE_OPENEO_API_URL: '${OPENEO_API_URL}',
        VITE_APP_TITLE: '${APP_TITLE}'
      },
      '1.2.3'
    );
    expect(docker.rootUrl).toBe('${STUDIO_ROOT_URL}');
    expect(docker.openeoApiUrl).toBe('${OPENEO_API_URL}');
    expect(buildAgentDocs(docker, sources())['llms.txt']).toMatch(
      /^# \$\{APP_TITLE\}/
    );
  });

  it('points at every sample, its code, and the openeo-udp examples', () => {
    const samplesMd = docs['agents/samples.md'];
    for (const sample of SAMPLE_SCENES_META) {
      expect(samplesMd).toContain(
        `https://example.org/studio/editor/${sample.id}`
      );
      expect(samplesMd).toContain(
        `blob/v1.2.3/app/algorithms/${sample.algorithm}`
      );
    }
    expect(samplesMd).toContain(
      'https://github.com/developmentseed/openeo-udp'
    );
  });

  it('writes a valid prefill JSON for every sample', () => {
    for (const sample of SAMPLE_SCENES_META) {
      const json = JSON.parse(docs[`agents/samples/${sample.id}.json`]);
      const prefill = validateSamplePrefill(json);
      expect(prefill.code).toBe(sources().algorithms[sample.algorithm]);
      expect(prefill.bands).toEqual(sample.defaultBands);
    }
  });

  it('lists the samples in the manifest', () => {
    const manifest = JSON.parse(docs['.well-known/openeo-studio.json']);
    expect(manifest.openeoApiUrl).toBe('https://api.example.org/openeo');
    expect(manifest.samples.map((s: { id: string }) => s.id)).toEqual(
      SAMPLE_SCENES_META.map((s) => s.id)
    );
  });

  it('has a sample file for every script on disk that a sample uses', () => {
    for (const sample of SAMPLE_SCENES_META) {
      expect(() => read(`app/algorithms/${sample.algorithm}`)).not.toThrow();
    }
  });

  it('serves in dev only the paths of the documents', () => {
    for (const file of Object.keys(docs)) {
      expect(isAgentDocPath(file)).toBe(true);
    }
    expect(isAgentDocPath('app/main.tsx')).toBe(false);
    expect(isAgentDocPath('@vite/client')).toBe(false);
  });
});
