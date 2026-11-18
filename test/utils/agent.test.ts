// user-defined-processes.ts imports $config/runtime, which reads import.meta.env.
jest.mock('$config/runtime', () => ({ appConfig: {} }));

import {
  applyEdits,
  projectParameters,
  replaceAll,
  type CodeEdit
} from '$utils/agent';
import { deriveConfigFromProject } from '$utils/openeo/user-defined-processes';

describe('applyEdits', () => {
  const code = 'a = 1\nb = 2\nc = 3\n';

  it('replaces and inserts by line number', () => {
    expect(
      applyEdits(code, [
        { start_line: 2, end_line: 2, replace: 'b = 20' },
        { start_line: 1, end_line: 0, replace: '# top' }
      ])
    ).toBe('# top\na = 1\nb = 20\nc = 3\n');
  });

  it('deletes lines with an empty replacement', () => {
    expect(
      applyEdits(code, [{ start_line: 2, end_line: 2, replace: '' }])
    ).toBe('a = 1\nc = 3\n');
  });

  it('replaces the whole file, empty or not', () => {
    expect(applyEdits(code, [replaceAll(code, 'x = 1')])).toBe('x = 1\n');
    expect(applyEdits('', [replaceAll('', 'x = 1')])).toBe('x = 1');
  });

  it('refuses an edit out of range or overlapping another', () => {
    expect(
      applyEdits(code, [{ start_line: 3, end_line: 4, replace: 'x' }])
    ).toBeNull();
    expect(
      applyEdits(code, [
        { start_line: 1, end_line: 2, replace: 'x' },
        { start_line: 2, end_line: 3, replace: 'y' }
      ])
    ).toBeNull();
  });

  it('refuses an edit that is not line numbers and text', () => {
    const malformed = [
      { end_line: 1, replace: 'x' },
      { start_line: '1', end_line: 1, replace: 'x' },
      { start_line: 1.5, end_line: 1, replace: 'x' },
      { start_line: 1, end_line: 1, replace: 2 }
    ] as unknown as CodeEdit[];
    malformed.forEach((edit) => expect(applyEdits(code, [edit])).toBeNull());
  });
});

describe('projectParameters', () => {
  it('is read back as the same configuration', () => {
    const config = {
      collectionId: 'sentinel-2-l2a',
      selectedBands: ['B04', 'B08'],
      temporalRange: ['2025-07-01', '2025-07-31'] as [string, string],
      boundingBox: [9.0, 45.4, 9.3, 45.5] as [number, number, number, number],
      propertyFilters: [
        { property: 'eo:cloud_cover', operator: 'lt' as const, value: 10 }
      ]
    };
    const project = {
      id: 'p',
      process_graph: {
        load: {
          process_id: 'load_collection',
          arguments: {
            id: config.collectionId,
            properties: {
              'eo:cloud_cover': {
                process_graph: {
                  cc: {
                    process_id: 'lt',
                    arguments: {
                      x: { from_parameter: 'value' },
                      y: { from_parameter: 'cloud_cover_max' }
                    },
                    result: true
                  }
                }
              }
            }
          }
        }
      },
      parameters: projectParameters(config)
    };
    expect(
      deriveConfigFromProject(
        project as Parameters<typeof deriveConfigFromProject>[0]
      )
    ).toEqual(config);
  });
});
