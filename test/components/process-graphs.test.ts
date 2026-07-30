// process-graphs.ts also imports appConfig from $config/runtime, which reads
// import.meta.env at module scope — ts-jest can't downlevel import.meta for
// CommonJS, so that module is mocked here rather than actually loaded. Only
// deriveConfigFromProject (pure, no config dependency) is under test.
jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

import {
  buildDescription,
  deriveConfigFromProject
} from '$utils/process-graphs';
import type { UserDefinedProcess } from '$types';

function buildProject(
  overrides: Partial<UserDefinedProcess> = {}
): UserDefinedProcess {
  return {
    id: 'test-project',
    summary: 'Test Project',
    description: '```openeo-studio\nprint("hi")\n```',
    process_graph: {
      loadcollection1: {
        process_id: 'load_collection',
        arguments: { id: 'sentinel-2-l2a' }
      },
      applypixelselection1: {
        process_id: 'apply_pixel_selection',
        arguments: { data: { from_node: 'loadcollection1' } },
        result: true
      }
    },
    parameters: [
      {
        name: 'time',
        description: 'Temporal extent',
        schema: { type: 'array' },
        default: ['2025-11-01', '2025-11-02']
      },
      {
        name: 'bounding_box',
        description: 'Spatial extent',
        schema: { type: 'object' },
        default: { west: 12.0, south: 44.5, east: 14, north: 46 }
      },
      {
        name: 'bands',
        description: 'Selected bands',
        schema: { type: 'array' },
        default: ['reflectance|b02', 'reflectance|b03', 'reflectance|b04']
      },
      {
        name: 'cloud_cover_max',
        description: 'Maximum cloud cover',
        schema: { type: 'number' },
        default: 20
      }
    ],
    ...overrides
  };
}

describe('deriveConfigFromProject', () => {
  it('extracts collectionId from the load_collection node', () => {
    const config = deriveConfigFromProject(buildProject());
    expect(config.collectionId).toBe('sentinel-2-l2a');
  });

  it('extracts temporalRange from the "time" parameter', () => {
    const config = deriveConfigFromProject(buildProject());
    expect(config.temporalRange).toEqual(['2025-11-01', '2025-11-02']);
  });

  it('extracts selectedBands from the "bands" parameter', () => {
    const config = deriveConfigFromProject(buildProject());
    expect(config.selectedBands).toEqual([
      'reflectance|b02',
      'reflectance|b03',
      'reflectance|b04'
    ]);
  });

  it('extracts cloudCover from the "cloud_cover_max" parameter', () => {
    const config = deriveConfigFromProject(buildProject());
    expect(config.cloudCover).toBe(20);
  });

  it('converts the bounding_box object default to a [w,s,e,n] tuple', () => {
    const config = deriveConfigFromProject(buildProject());
    expect(config.boundingBox).toEqual([12.0, 44.5, 14, 46]);
  });

  it('omits fields it cannot find, without throwing', () => {
    const config = deriveConfigFromProject(
      buildProject({ process_graph: {}, parameters: [] })
    );
    expect(config).toEqual({});
  });

  it('omits collectionId when process_graph has no load_collection node', () => {
    const config = deriveConfigFromProject(
      buildProject({
        process_graph: {
          somenode: { process_id: 'apply', arguments: {} }
        }
      })
    );
    expect(config.collectionId).toBeUndefined();
  });
});

describe('buildDescription', () => {
  it('returns just the code block when there is no existing description', () => {
    const result = buildDescription(undefined, 'print(1)');
    expect(result).toBe('```openeo-studio\nprint(1)\n```');
  });

  it('returns just the code block when the existing description is an empty string', () => {
    const result = buildDescription('', 'print(1)');
    expect(result).toBe('```openeo-studio\nprint(1)\n```');
  });

  it('preserves existing non-code text and appends the code block', () => {
    const result = buildDescription(
      'Some notes about this project.',
      'print(1)'
    );
    expect(result).toBe(
      'Some notes about this project.\n\n```openeo-studio\nprint(1)\n```'
    );
  });

  it('replaces an existing code block with the new code, keeping surrounding text', () => {
    const existing = 'Notes.\n\n```openeo-studio\nold code\n```';
    const result = buildDescription(existing, 'new code');
    expect(result).toBe('Notes.\n\n```openeo-studio\nnew code\n```');
  });

  it('returns just the new code block when the existing description was only a code block', () => {
    const existing = '```openeo-studio\nold code\n```';
    const result = buildDescription(existing, 'new code');
    expect(result).toBe('```openeo-studio\nnew code\n```');
  });

  it('strips every old code block when there is more than one, keeping the surrounding text', () => {
    const existing =
      'Intro.\n\n```openeo-studio\nold1\n```\n\nMiddle.\n\n```openeo-studio\nold2\n```\n\nOutro.';
    const result = buildDescription(existing, 'new code');

    expect(result).not.toContain('old1');
    expect(result).not.toContain('old2');
    expect(result).toContain('Intro.');
    expect(result).toContain('Middle.');
    expect(result).toContain('Outro.');
    expect(result).toContain('```openeo-studio\nnew code\n```');
    // Exactly one code block in the result.
    expect(result.match(/```openeo-studio/g)).toHaveLength(1);
  });
});
