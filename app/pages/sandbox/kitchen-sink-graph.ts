import type { ProcessGraph } from '$types/openeo-process';

/**
 * Kitchen-sink process graph for `/sandbox/visual-graph`.
 *
 * Exercises every branch of `formatArgumentValue` / `buildGraphView`:
 * scalars, truncation, arrays, objects, refs, multi-wired edges, collection +
 * result nodes, namespace, description, subgraph at arg root, subgraph nested
 * under an object, and a second drill-down level inside a callback.
 */
export const KITCHEN_SINK_GRAPH: ProcessGraph = {
  lc1: {
    process_id: 'load_collection',
    arguments: {
      id: 'sentinel-2-l2a',
      bands: { from_parameter: 'bands' },
      spatial_extent: {
        west: 12.0,
        south: 44.5,
        east: 14.0,
        north: 46.0
      },
      // Short label so the joined dates fit the display budget.
      ab: ['2025-11-23', '2025-11-24'],
      tags: [
        'reflectance|b02',
        'reflectance|b03',
        'reflectance|b04',
        'reflectance|b08'
      ],
      empty: {},
      geom: {
        type: 'Polygon',
        coordinates: [
          [
            [12, 44.5],
            [14, 44.5],
            [14, 46],
            [12, 46],
            [12, 44.5]
          ]
        ]
      },
      options: { resampling: 'bilinear', nodata: -9999 },
      long_id:
        'this-string-is-deliberately-longer-than-the-display-budget-so-it-truncates',
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
  },

  a: {
    process_id: 'constant',
    arguments: { x: 1 }
  },

  b: {
    process_id: 'constant',
    arguments: { x: 2 }
  },

  // Multi-wired target → edge labels "x" and "y".
  sub1: {
    process_id: 'subtract',
    arguments: {
      x: { from_node: 'a' },
      y: { from_node: 'b' }
    }
  },

  // Nested from_node refs inside an array (display still shows ← a / ← b).
  arr1: {
    process_id: 'array_create',
    arguments: {
      data: [{ from_node: 'a' }, { from_node: 'b' }]
    }
  },

  kitchen: {
    process_id: 'inspect_literals',
    namespace: 'sandbox',
    description:
      'Node-level description: muted line under the argument rows when present.',
    arguments: {
      flag_on: true,
      flag_off: false,
      count: 255,
      missing: null,
      format: 'PNG',
      // Whole-value from_node → empty display; the edge carries the link.
      data: { from_node: 'lc1' },
      score: { from_node: 'sub1' },
      // Callback at the argument root (path "").
      process: {
        process_graph: {
          ae1: {
            process_id: 'array_element',
            arguments: {
              data: { from_parameter: 'data' },
              index: 0
            }
          },
          // Second drill level: subgraph nested inside this callback node.
          apply1: {
            process_id: 'apply',
            arguments: {
              data: { from_node: 'ae1' },
              process: {
                process_graph: {
                  abs1: {
                    process_id: 'absolute',
                    arguments: { x: { from_parameter: 'x' } },
                    result: true
                  }
                }
              }
            },
            result: true
          }
        }
      }
    }
  },

  sr1: {
    process_id: 'save_result',
    arguments: {
      data: { from_node: 'kitchen' },
      format: 'PNG'
    },
    result: true
  },

  sr2: {
    process_id: 'save_result',
    arguments: {
      data: { from_node: 'kitchen' },
      score: { from_node: 'sub1' },
      format: 'GeoTIFF'
    }
  }
};
