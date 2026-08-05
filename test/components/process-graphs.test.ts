// process-graphs.ts also imports appConfig from $config/runtime, which reads
// import.meta.env at module scope — ts-jest can't downlevel import.meta for
// CommonJS, so that module is mocked here rather than actually loaded. Only
// deriveConfigFromProject (pure, no config dependency) is under test.
jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

import {
  buildDescription,
  deriveConfigFromProject,
  mergeProcessGraphs,
  resolveSharedParameters
} from '$utils/process-graphs';
import type { UserDefinedProcess } from '$types';
import type { ProcessGraph, ProcessParameter } from '$types/openeo-process';

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

describe('mergeProcessGraphs', () => {
  // Mirrors algorithms/base/loader.py: every graph in one script execution
  // shares this exact load_collection -> apply_pixel_selection prefix,
  // independently re-flattened (so its ids restart at 1 every time).
  function sharedPrefix(): ProcessGraph {
    return {
      loadcollection1: {
        process_id: 'load_collection',
        arguments: { id: 'sentinel-2-l2a' }
      },
      applypixelselection1: {
        process_id: 'apply_pixel_selection',
        arguments: {
          data: { from_node: 'loadcollection1' },
          pixel_selection: 'first'
        }
      }
    };
  }

  function graphWithPngTail(): ProcessGraph {
    return {
      ...sharedPrefix(),
      linearscalerange1: {
        process_id: 'linear_scale_range',
        arguments: {
          x: { from_node: 'applypixelselection1' },
          input_min: 0,
          input_max: 1
        }
      },
      saveresult1: {
        process_id: 'save_result',
        arguments: { data: { from_node: 'linearscalerange1' }, format: 'PNG' },
        result: true
      }
    };
  }

  function graphWithGtiffTail(): ProcessGraph {
    return {
      ...sharedPrefix(),
      saveresult1: {
        process_id: 'save_result',
        arguments: {
          data: { from_node: 'applypixelselection1' },
          format: 'GTiff'
        },
        result: true
      }
    };
  }

  // Deliberately reuses the same auto-numbered id (loadcollection1) as
  // sharedPrefix() but with different content, mirroring how two graphs can
  // legitimately disagree even though PGNode.flat_graph() gave them the same
  // auto-numbered id.
  function unrelatedGraph(): ProcessGraph {
    return {
      loadcollection1: {
        process_id: 'load_collection',
        arguments: { id: 'sentinel-1-grd' }
      },
      saveresult1: {
        process_id: 'save_result',
        arguments: { data: { from_node: 'loadcollection1' }, format: 'GTiff' },
        result: true
      }
    };
  }

  it('returns a single graph unchanged, without namespacing its node ids', () => {
    const merged = mergeProcessGraphs([graphWithPngTail()]);
    expect(merged).toEqual(graphWithPngTail());
  });

  it('namespaces node ids per source graph index and rewrites from_node references', () => {
    const merged = mergeProcessGraphs([graphWithPngTail(), unrelatedGraph()]);

    expect(merged.g0_linearscalerange1.arguments.x).toEqual({
      from_node: 'g0_applypixelselection1'
    });
    expect(merged.g1_saveresult1.arguments.data).toEqual({
      from_node: 'g1_loadcollection1'
    });
  });

  it('does not let same-named nodes from different graphs overwrite each other', () => {
    const merged = mergeProcessGraphs([graphWithPngTail(), unrelatedGraph()]);

    expect(merged.g0_loadcollection1.arguments.id).toBe('sentinel-2-l2a');
    expect(merged.g1_loadcollection1.arguments.id).toBe('sentinel-1-grd');
  });

  it('dedupes an identical shared prefix instead of duplicating it', () => {
    const merged = mergeProcessGraphs([
      graphWithPngTail(),
      graphWithGtiffTail()
    ]);

    // Only one copy of the shared load_collection / apply_pixel_selection
    // pair, even though two graphs both contained it.
    expect(Object.keys(merged).sort()).toEqual([
      'g0_applypixelselection1',
      'g0_linearscalerange1',
      'g0_loadcollection1',
      'g0_saveresult1',
      'g1_saveresult1'
    ]);
    // The second graph's diverging tail references the deduped (graph-0
    // namespaced) shared node, not a duplicate of its own.
    expect(merged.g1_saveresult1.arguments.data).toEqual({
      from_node: 'g0_applypixelselection1'
    });
  });

  it('collapses two fully-identical graphs into one, adding no g1_ nodes at all', () => {
    const merged = mergeProcessGraphs([graphWithPngTail(), graphWithPngTail()]);

    expect(Object.keys(merged).sort()).toEqual([
      'g0_applypixelselection1',
      'g0_linearscalerange1',
      'g0_loadcollection1',
      'g0_saveresult1'
    ]);
  });

  it("keeps result:true only on the first graph's result node, clearing it on every other graph", () => {
    const merged = mergeProcessGraphs([
      graphWithPngTail(),
      graphWithGtiffTail()
    ]);

    expect(merged.g0_saveresult1.result).toBe(true);
    expect(merged.g1_saveresult1.result).toBeUndefined();
    expect('result' in merged.g1_saveresult1).toBe(false);
  });

  it('leaves from_parameter references untouched', () => {
    const withParam: ProcessGraph = {
      loadcollection1: {
        process_id: 'load_collection',
        arguments: { spatial_extent: { from_parameter: 'bounding_box' } },
        result: true
      }
    };

    const merged = mergeProcessGraphs([withParam, unrelatedGraph()]);
    expect(merged.g0_loadcollection1.arguments.spatial_extent).toEqual({
      from_parameter: 'bounding_box'
    });
  });

  it('leaves nested (callback) process_graph arguments untouched', () => {
    const withReducer: ProcessGraph = {
      loadcollection1: {
        process_id: 'load_collection',
        arguments: { id: 'sentinel-2-l2a' }
      },
      reduce1: {
        process_id: 'reduce_dimension',
        arguments: {
          data: { from_node: 'loadcollection1' },
          reducer: {
            process_graph: {
              mean1: {
                process_id: 'mean',
                arguments: { data: { from_parameter: 'data' } },
                result: true
              }
            }
          }
        },
        result: true
      }
    };

    const merged = mergeProcessGraphs([withReducer, unrelatedGraph()]);
    expect(merged.g0_reduce1.arguments.reducer).toEqual({
      process_graph: {
        mean1: {
          process_id: 'mean',
          arguments: { data: { from_parameter: 'data' } },
          result: true
        }
      }
    });
  });

  it('throws when given an empty array', () => {
    expect(() => mergeProcessGraphs([])).toThrow(/at least one process graph/);
  });
});

describe('resolveSharedParameters', () => {
  function timeParam(): ProcessParameter {
    return {
      name: 'time',
      description: 'Temporal extent',
      schema: { type: 'array' },
      default: ['2025-11-01', '2025-11-02']
    };
  }

  it('returns the shared parameters when every set is identical', () => {
    const result = resolveSharedParameters([
      [timeParam()],
      [timeParam()],
      [timeParam()]
    ]);
    expect(result).toEqual([timeParam()]);
  });

  it('returns the single set unchanged when only one graph was produced', () => {
    const result = resolveSharedParameters([[timeParam()]]);
    expect(result).toEqual([timeParam()]);
  });

  it('throws a descriptive error when parameter sets differ', () => {
    const different: ProcessParameter = {
      ...timeParam(),
      default: ['2025-01-01', '2025-01-02']
    };

    expect(() => resolveSharedParameters([[timeParam()], [different]])).toThrow(
      /parameters differ/
    );
  });

  it('throws when given an empty array', () => {
    expect(() => resolveSharedParameters([])).toThrow(
      /at least one parameter set/
    );
  });
});
