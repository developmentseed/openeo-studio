/**
 * @jest-environment node
 */

import { udpCollectionIds, udpToPython } from '$utils/openeo/udp-to-python';

const param = (name: string) => ({ from_parameter: name });
const node = (id: string) => ({ from_node: id });

const BBOX_PARAM = {
  name: 'bbox',
  description: 'Spatial extent.',
  schema: { type: 'object', subtype: 'bounding-box' }
};
const TIME_PARAM = {
  name: 'temporal_extent',
  description: 'Temporal extent.',
  schema: { type: 'array', subtype: 'temporal-interval' }
};

const load = (bands: unknown, extra = {}) => ({
  process_id: 'load_collection',
  arguments: {
    bands,
    id: 'SENTINEL2_L2A',
    spatial_extent: param('bbox'),
    temporal_extent: param('temporal_extent'),
    ...extra
  }
});

const ndvi = {
  arrayelement1: {
    process_id: 'array_element',
    arguments: { data: param('data'), index: 1 }
  },
  arrayelement2: {
    process_id: 'array_element',
    arguments: { data: param('data'), index: 0 }
  },
  subtract1: {
    process_id: 'subtract',
    arguments: { x: node('arrayelement1'), y: node('arrayelement2') }
  },
  add1: {
    process_id: 'add',
    arguments: { x: node('arrayelement1'), y: node('arrayelement2') }
  },
  divide1: {
    process_id: 'divide',
    arguments: { x: node('subtract1'), y: node('add1') },
    result: true
  }
};

const max = {
  max1: {
    process_id: 'max',
    arguments: { data: param('data') },
    result: true
  }
};

const MAX_NDVI = {
  id: 'max_ndvi',
  parameters: [BBOX_PARAM, TIME_PARAM],
  process_graph: {
    loadcollection1: load(['B04', 'B08']),
    reducedimension1: {
      process_id: 'reduce_dimension',
      arguments: {
        data: node('loadcollection1'),
        dimension: 'bands',
        reducer: { process_graph: ndvi }
      }
    },
    reducedimension2: {
      process_id: 'reduce_dimension',
      arguments: {
        data: node('reducedimension1'),
        dimension: 't',
        reducer: { process_graph: max }
      },
      result: true
    }
  }
};

/** A UDP that applies `callback` to the bands of one collection. */
const withReducer = (callback: object, parameters: object[] = []) => ({
  parameters: [BBOX_PARAM, TIME_PARAM, ...parameters],
  process_graph: {
    loadcollection1: load(['B04', 'B08']),
    reducedimension1: {
      process_id: 'reduce_dimension',
      arguments: {
        data: node('loadcollection1'),
        dimension: 'bands',
        reducer: { process_graph: callback }
      },
      result: true
    }
  }
});

const convert = (udp: unknown, options = {}) =>
  udpToPython(udp, { title: 'Test', ...options });

describe('udpToPython', () => {
  it('writes the studio code of a simple UDP', () => {
    const { code, seed, warnings } = udpToPython(MAX_NDVI, {
      title: 'Max NDVI',
      scenario: {
        bbox: { west: 5.07, east: 5.09, south: 51.21, north: 51.23 },
        temporal_extent: ['2023-08-01', '2023-09-30']
      }
    });

    expect(code).toBe(`# Max NDVI
# Generated from the UDP process graph. Review before use.


def reducer(data):
    B08 = data[1]
    B04 = data[0]
    return (B08 - B04) / (B08 + B04)


reduce_dimension_1 = datacube.reduce_dimension(dimension="bands", reducer=reducer)
reduce_dimension_2 = reduce_dimension_1.reduce_dimension(dimension="t", reducer="max")

# TODO: the UDP returns data values, not colours. Set the value range to show.
map_layer = reduce_dimension_2.linear_scale_range(
    input_min=0, input_max=1, output_min=0, output_max=255
)
map_layer = map_layer.save_result("PNG")
add_graph_to_map(map_layer, "Max NDVI")
`);
    expect(seed).toEqual({
      collectionId: 'SENTINEL2_L2A',
      bands: ['B04', 'B08'],
      temporalRange: ['2023-08-01', '2023-09-30'],
      boundingBox: [5.07, 51.21, 5.09, 51.23],
      propertyFilters: []
    });
    expect(warnings).toEqual([]);
  });

  it('lists the processes the code uses, callbacks included', () => {
    expect(convert(MAX_NDVI).processes.sort()).toEqual([
      'add',
      'array_element',
      'divide',
      'load_collection',
      'max',
      'reduce_dimension',
      'subtract'
    ]);
  });

  it('loads a second collection in the code, and says so', () => {
    const { code, collections, warnings } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: load(['B04', 'B08']),
        loadcollection2: load(['SCL']),
        mask1: {
          process_id: 'mask',
          arguments: {
            data: node('loadcollection1'),
            mask: node('loadcollection2')
          },
          result: true
        }
      }
    });

    expect(code).toContain(
      'sentinel2_l2a = DataCube(PGNode("load_collection", id="SENTINEL2_L2A", bands=["SCL"], spatial_extent=bounding_box, temporal_extent=time))'
    );
    expect(code).toContain('mask_1 = datacube.mask(mask=sentinel2_l2a)');
    expect(warnings).toEqual([
      'The UDP loads more than one collection, which Studio does not support natively.'
    ]);
    expect(code).toContain(
      'from openeo.internal.graph_building import PGNode\nfrom openeo.rest.datacube import DataCube\n'
    );
    expect(collections).toEqual(['SENTINEL2_L2A']);
  });

  it('lists the collections a UDP loads, each once', () => {
    const udp = {
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: load(['B04']),
        loadcollection2: {
          process_id: 'load_collection',
          arguments: { id: 'SENTINEL1_GRD', bands: ['VV'] }
        },
        loadcollection3: load(['SCL']),
        mergecubes1: {
          process_id: 'merge_cubes',
          arguments: {
            cube1: node('loadcollection1'),
            cube2: node('loadcollection2')
          },
          result: true
        }
      }
    };
    expect(udpCollectionIds(udp)).toEqual(['SENTINEL2_L2A', 'SENTINEL1_GRD']);
  });

  it('writes logic and comparisons the client can build', () => {
    const scl = (id: string, value: number) => ({
      [`arrayelement${id}`]: {
        process_id: 'array_element',
        arguments: { data: param('data'), index: 0 }
      },
      [`eq${id}`]: {
        process_id: 'eq',
        arguments: { x: node(`arrayelement${id}`), y: value }
      }
    });
    const { code } = convert(
      withReducer({
        ...scl('1', 8),
        ...scl('2', 9),
        or1: {
          process_id: 'or',
          arguments: { x: node('eq1'), y: node('eq2') }
        },
        lt1: { process_id: 'lt', arguments: { x: 5, y: node('or1') } },
        if1: {
          process_id: 'if',
          arguments: { value: node('lt1'), accept: 1, reject: 0 },
          result: true
        }
      })
    );

    expect(code).toContain('    B04 = data[0]\n');
    expect(code).toContain(
      '    return if_(process("lt", x=5, y=(B04 == 8).or_(B04 == 9)), 1, 0)\n'
    );
    expect(code).toContain('from openeo.processes import if_, process\n');
  });

  it('keeps the operand order of a subtraction and a division', () => {
    const { code } = convert(
      withReducer({
        subtract1: {
          process_id: 'subtract',
          arguments: { x: 1, y: param('data') }
        },
        subtract2: {
          process_id: 'subtract',
          arguments: { x: param('data'), y: node('subtract1') }
        },
        log1: {
          process_id: 'log',
          arguments: { x: node('subtract2'), base: 10 }
        },
        power1: {
          process_id: 'power',
          arguments: { base: 2, p: node('log1') },
          result: true
        }
      })
    );

    expect(code).toContain(
      '    return process("power", base=2, p=(data - (1 - data)).log(base=10))\n'
    );
  });

  it('calls a process the client has no method for', () => {
    const { code, processes } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: load(['SCL']),
        toscldilationmask1: {
          process_id: 'to_scl_dilation_mask',
          arguments: { data: node('loadcollection1'), kernel1_size: 17 },
          result: true
        }
      }
    });

    expect(code).toContain(
      'to_scl_dilation_mask_1 = datacube.process("to_scl_dilation_mask", data=datacube, kernel1_size=17)'
    );
    expect(processes).toContain('to_scl_dilation_mask');
  });

  it('turns the other parameters into constants', () => {
    const { code, warnings } = convert(
      withReducer(
        {
          multiply1: {
            process_id: 'multiply',
            arguments: { x: param('data'), y: param('factor') }
          },
          add1: {
            process_id: 'add',
            arguments: { x: node('multiply1'), y: param('offset') }
          },
          divide1: {
            process_id: 'divide',
            arguments: { x: node('add1'), y: param('class') },
            result: true
          }
        },
        [
          { name: 'factor', description: 'Scale factor.\nMore.', default: 2 },
          { name: 'offset', description: 'Offset.', default: 1 },
          { name: 'class', description: 'Class.' }
        ]
      ),
      { scenario: { offset: 0.5 } }
    );

    expect(code).toContain('# Scale factor.\nfactor = 2\n');
    expect(code).toContain('# Offset.\noffset = 0.5\n');
    expect(code).toContain('class_ = None  # TODO: set a value. Class.\n');
    expect(code).toContain('    return (data * factor + offset) / class_\n');
    expect(warnings).toEqual([
      'Parameter "class" has no default value. Set it in the code.'
    ]);
  });

  it('maps only one temporal parameter to the configuration', () => {
    const reference = { ...TIME_PARAM, name: 'reference_extent' };
    const { code, seed } = convert(
      {
        parameters: [BBOX_PARAM, TIME_PARAM, reference],
        process_graph: {
          loadcollection1: load(['VV']),
          loadcollection2: load(['VV'], {
            temporal_extent: param('reference_extent')
          }),
          mergecubes1: {
            process_id: 'merge_cubes',
            arguments: {
              cube1: node('loadcollection1'),
              cube2: node('loadcollection2')
            },
            result: true
          }
        }
      },
      {
        scenario: {
          temporal_extent: ['2020-01-01T00:00:00Z', '2020-02-01T00:00:00Z'],
          reference_extent: ['2017-01-01', '2017-02-01']
        }
      }
    );

    expect(seed.temporalRange).toEqual(['2020-01-01', '2020-02-01']);
    expect(code).toContain('reference_extent = ["2017-01-01", "2017-02-01"]\n');
    expect(code).toContain(
      'spatial_extent=bounding_box, temporal_extent=reference_extent))'
    );
  });

  it('uses the bounding box of a geometry and says so', () => {
    const { seed, warnings } = convert(MAX_NDVI, {
      scenario: {
        bbox: {
          type: 'Polygon',
          coordinates: [
            [
              [5, 51],
              [6, 51.5],
              [5.5, 52],
              [5, 51]
            ]
          ]
        }
      }
    });

    expect(seed.boundingBox).toEqual([5, 51, 6, 52]);
    expect(warnings).toEqual([
      'Parameter "bbox" is a geometry in the UDP. The code uses its bounding box.'
    ]);
  });

  it('moves the filters of the main collection to the configuration', () => {
    const condition = (y: unknown) => ({
      process_graph: {
        lte1: {
          process_id: 'lte',
          arguments: { x: param('value'), y },
          result: true
        }
      }
    });
    const { code, seed, warnings } = convert({
      parameters: [
        BBOX_PARAM,
        TIME_PARAM,
        { name: 'max_cloud_cover', default: 80 }
      ],
      process_graph: {
        loadcollection1: load(['B04'], {
          properties: { 'eo:cloud_cover': condition(param('max_cloud_cover')) }
        }),
        loadcollection2: load(['SCL'], {
          properties: { 'eo:cloud_cover': condition(95) }
        }),
        mask1: {
          process_id: 'mask',
          arguments: {
            data: node('loadcollection1'),
            mask: node('loadcollection2')
          },
          result: true
        }
      }
    });

    expect(seed.propertyFilters).toEqual([
      { property: 'eo:cloud_cover', operator: 'lte', value: 80 }
    ]);
    expect(code).not.toContain('max_cloud_cover');
    expect(code).toContain(
      'def eo_cloud_cover(value):\n    return value <= 95\n'
    );
    expect(code).toContain(
      'properties={"eo:cloud_cover": build_child_callback(eo_cloud_cover, parent_parameters=["value"])}'
    );
    expect(code).toContain(
      'from openeo.rest._datacube import build_child_callback\n'
    );
    expect(warnings).toEqual([
      'The UDP loads more than one collection, which Studio does not support natively.'
    ]);
  });

  it('gives callbacks names that do not hide the names the code uses', () => {
    const double = {
      multiply1: {
        process_id: 'multiply',
        arguments: { x: param('x'), y: 2 },
        result: true
      }
    };
    const apply = (data: string, result = false) => ({
      process_id: 'apply',
      arguments: { data: node(data), process: { process_graph: double } },
      result
    });
    const { code } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: load(['B04']),
        apply1: apply('loadcollection1'),
        apply2: apply('apply1', true)
      }
    });

    // Both steps share the one function, and `process` stays the import.
    expect(code.match(/^def /gm)).toHaveLength(1);
    expect(code).toContain('def transform(x):\n    return x * 2\n');
    expect(code).toContain('apply_2 = apply_1.apply(process=transform)');
  });

  it('lets a nested callback use the values of the outer one', () => {
    const { code } = convert(
      withReducer({
        arrayapply1: {
          process_id: 'array_apply',
          arguments: {
            data: param('data'),
            process: {
              process_graph: {
                max1: { process_id: 'max', arguments: { data: param('data') } },
                divide1: {
                  process_id: 'divide',
                  arguments: { x: param('x'), y: node('max1') },
                  result: true
                }
              }
            }
          },
          result: true
        }
      })
    );

    expect(code).toContain(
      'def reducer(data):\n    return process("array_apply", data=data, process=build_child_callback(lambda x: x / data.max(), parent_parameters=["x"]))\n'
    );
  });

  it('passes a callback itself when the method would not give it its parameters', () => {
    const { code } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: load(['B04']),
        apply1: {
          process_id: 'apply',
          arguments: {
            data: node('loadcollection1'),
            process: {
              process_graph: {
                multiply1: {
                  process_id: 'multiply',
                  arguments: { x: param('x'), y: param('context') },
                  result: true
                }
              }
            },
            context: 2
          },
          result: true
        }
      }
    });

    expect(code).toContain(
      'def transform(x, context):\n    return x * context\n'
    );
    expect(code).toContain(
      'apply_1 = datacube.process("apply", data=datacube, process=build_child_callback(transform, parent_parameters=["x", "context"]), context=2)'
    );
  });

  it('asks for a value the UDP uses but does not declare', () => {
    const { code, warnings } = convert(
      withReducer({
        multiply1: {
          process_id: 'multiply',
          arguments: { x: param('data'), y: param('smoothing') },
          result: true
        }
      })
    );

    expect(code).toContain('smoothing = None  # TODO: set a value.\n');
    expect(code).toContain('def reducer(data):\n    return data * smoothing\n');
    expect(warnings).toEqual([
      'Parameter "smoothing" has no default value. Set it in the code.'
    ]);
  });

  it('takes the collection the time range applies to as the main one', () => {
    const { code, seed } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: {
          process_id: 'load_collection',
          arguments: {
            id: 'ESA_WORLDCOVER',
            bands: ['MAP'],
            spatial_extent: param('bbox')
          }
        },
        loadcollection2: load(['B04']),
        mask1: {
          process_id: 'mask',
          arguments: {
            data: node('loadcollection2'),
            mask: node('loadcollection1')
          },
          result: true
        }
      }
    });

    expect(seed.collectionId).toBe('SENTINEL2_L2A');
    expect(code).toContain(
      'esa_worldcover = DataCube(PGNode("load_collection", id="ESA_WORLDCOVER", bands=["MAP"], spatial_extent=bounding_box))'
    );
    expect(code).toContain('mask_1 = datacube.mask(mask=esa_worldcover)');
  });

  it('keeps a collection without a time range in the code', () => {
    const { seed, warnings } = convert({
      parameters: [BBOX_PARAM],
      process_graph: {
        loadcollection1: {
          process_id: 'load_collection',
          arguments: { id: 'ESA_WORLDCOVER', bands: ['MAP'] },
          result: true
        }
      }
    });

    expect(seed.collectionId).toBeUndefined();
    expect(warnings).toEqual([
      'The collection is set in the code. The collection in the configuration is not used.'
    ]);
  });

  it('says so when the code loads every one of several collections', () => {
    const static_ = (id: string) => ({
      process_id: 'load_collection',
      arguments: { id, bands: ['MAP'] }
    });
    const { warnings } = convert({
      parameters: [BBOX_PARAM],
      process_graph: {
        loadcollection1: static_('ESA_WORLDCOVER'),
        loadcollection2: static_('COPERNICUS_30'),
        mergecubes1: {
          process_id: 'merge_cubes',
          arguments: {
            cube1: node('loadcollection1'),
            cube2: node('loadcollection2')
          },
          result: true
        }
      }
    });

    expect(warnings).toEqual([
      'The collection is set in the code. The collection in the configuration is not used.',
      'The UDP loads more than one collection, which Studio does not support natively.'
    ]);
  });

  it('drops the save_result of the UDP', () => {
    const { code } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: load(['B04']),
        saveresult1: {
          process_id: 'save_result',
          arguments: { data: node('loadcollection1'), format: 'GTiff' },
          result: true
        }
      }
    });

    expect(code).not.toContain('GTiff');
    expect(code).toContain('map_layer = datacube.linear_scale_range(');
  });

  it('writes a UDP that loads no collection, with a warning', () => {
    const { code, seed, warnings } = convert(
      {
        parameters: [
          { name: 'geometry', schema: { type: 'object', subtype: 'geojson' } },
          { name: 'startdate', schema: { type: 'string' } }
        ],
        process_graph: {
          cropsar1: {
            process_id: 'cropsar',
            namespace: 'vito',
            arguments: {
              geometry: param('geometry'),
              startdate: param('startdate')
            },
            result: true
          }
        }
      },
      { scenario: { startdate: '2024-01-01' } }
    );

    expect(code).toContain(
      'cropsar_1 = DataCube(PGNode("cropsar", geometry=geometry, startdate=startdate, namespace="vito"))'
    );
    expect(seed.collectionId).toBeUndefined();
    expect(warnings).toEqual([
      'Parameter "geometry" has no default value. Set it in the code.',
      'The UDP loads no collection. The collection in the configuration is not used.',
      'Process "cropsar" comes from the namespace "vito".'
    ]);
  });

  it('warns when the result is not an image', () => {
    const { warnings } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM, { name: 'geometries' }],
      process_graph: {
        loadcollection1: load(['B04']),
        aggregatespatial1: {
          process_id: 'aggregate_spatial',
          arguments: {
            data: node('loadcollection1'),
            geometries: param('geometries'),
            reducer: { process_graph: max }
          },
          result: true
        }
      }
    });

    expect(warnings).toContain(
      'The result of "aggregate_spatial" is not an image. The map cannot show it.'
    );
  });

  it('keeps multi-line text readable', () => {
    const { code } = convert({
      parameters: [BBOX_PARAM, TIME_PARAM],
      process_graph: {
        loadcollection1: load(['B04']),
        apply1: {
          process_id: 'apply',
          arguments: {
            data: node('loadcollection1'),
            process: {
              process_graph: {
                runudf1: {
                  process_id: 'run_udf',
                  arguments: {
                    data: param('x'),
                    runtime: 'Python',
                    udf: 'def f(x):\n    return x\n'
                  },
                  result: true
                }
              }
            }
          },
          result: true
        }
      }
    });

    expect(code).toContain(
      'x.run_udf(runtime="Python", udf="""def f(x):\n    return x\n""")'
    );
  });

  it('quotes text that has quotes and backslashes of its own', () => {
    const text = (udf: string) =>
      convert({
        parameters: [BBOX_PARAM, TIME_PARAM],
        process_graph: {
          loadcollection1: load(['B04']),
          runudf1: {
            process_id: 'run_udf',
            arguments: { data: node('loadcollection1'), udf },
            result: true
          }
        }
      }).code;

    expect(text('"""Doc."""\nr = "\\d"\n')).toContain(
      `udf='''"""Doc."""\nr = "\\\\d"\n''')`
    );
    expect(text(`'''a'''\n"""b"""`)).toContain(
      `udf="'''a'''\\n\\"\\"\\"b\\"\\"\\""`
    );
  });

  it.each([
    ['no process graph', { id: 'x' }, 'The UDP has no process graph.'],
    [
      'no result node',
      { process_graph: { a: { process_id: 'x', arguments: {} } } },
      'The UDP has no result node.'
    ],
    [
      'a reference to a missing node',
      {
        process_graph: {
          a: {
            process_id: 'x',
            arguments: { data: node('gone') },
            result: true
          }
        }
      },
      'The UDP refers to a node "gone" that does not exist.'
    ],
    [
      'a node that depends on itself',
      {
        process_graph: {
          a: { process_id: 'x', arguments: { data: node('a') }, result: true }
        }
      },
      'The UDP node "a" depends on itself.'
    ]
  ])('rejects a UDP with %s', (_, udp, message) => {
    expect(() => convert(udp)).toThrow(message);
  });
});
