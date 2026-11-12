/**
 * What the openEO Python client can express, as of version 0.49: which
 * processes have an operator or a method, and what those build. Anything not
 * listed here still works through the generic `process()`.
 */

const words = (text: string) => text.split(' ');

// Operators of the client's callback values: symbol, binding strength, and
// whether a plain value may be the left operand.
export const OPERATORS: Record<string, [string, number, boolean]> = {
  eq: ['==', 0, false],
  neq: ['!=', 0, false],
  gt: ['>', 0, false],
  gte: ['>=', 0, false],
  lt: ['<', 0, false],
  lte: ['<=', 0, false],
  add: ['+', 1, true],
  subtract: ['-', 1, true],
  multiply: ['*', 2, true],
  divide: ['/', 2, true],
  power: ['**', 3, false]
};

// Callback values have no `&` and `|`: logic is a method on the left operand.
export const LOGIC: Record<string, string> = {
  and: 'and_',
  or: 'or_',
  xor: 'xor'
};

// Processes the callback values have a method for, by the name of their
// first parameter.
export const BUILDER_METHODS: Record<'data' | 'x', Set<string>> = {
  data: new Set(
    words(
      'all any array_append array_contains array_element array_find array_find_label array_interpolate_linear array_labels array_modify count cummax cummin cumproduct cumsum extrema first last max mean median min order product quantiles rearrange run_udf sd sort sum text_begins text_concat text_contains text_ends variance'
    )
  ),
  x: new Set(
    words(
      'absolute arccos arcosh arcsin arctan arsinh artanh between ceil clip cos cosh floor int is_infinite is_nan is_nodata is_valid linear_scale_range ln log mod normalized_difference not round sgn sin sinh sqrt tan tanh'
    )
  )
};

// Reducers the client builds from their name alone, as `reducer(data)`.
export const NAMED_REDUCERS = new Set(
  words('all any first last max mean median min product sd sum variance')
);

export interface CubeMethod {
  receiver: string; // the argument the cube goes in
  args: Record<string, string>; // UDP argument -> Python argument
  callbacks: Record<string, string[]>; // the parameters each callback gets
}

function cubeMethod(
  receiver: string,
  args: string,
  callbacks: CubeMethod['callbacks'] = {}
): CubeMethod {
  return {
    receiver,
    args: Object.fromEntries(
      [...words(args), ...Object.keys(callbacks)].map((name) => {
        const [udp, python = udp] = name.split(':');
        return [udp, python];
      })
    ),
    callbacks
  };
}

// DataCube methods that build exactly the node they are named after, with
// the arguments that are safe on a cube without metadata.
export const CUBE_METHODS: Record<string, CubeMethod> = {
  reduce_dimension: cubeMethod('data', 'dimension context', {
    reducer: ['data', 'context']
  }),
  apply: cubeMethod('data', 'context', { process: ['x'] }),
  apply_dimension: cubeMethod('data', 'dimension context', {
    process: ['data', 'context']
  }),
  apply_neighborhood: cubeMethod('data', 'size overlap context', {
    process: ['data']
  }),
  aggregate_temporal: cubeMethod('data', 'intervals labels dimension context', {
    reducer: ['data']
  }),
  aggregate_temporal_period: cubeMethod('data', 'period dimension context', {
    reducer: ['data']
  }),
  merge_cubes: cubeMethod('cube1', 'cube2:other context', {
    overlap_resolver: ['x', 'y']
  }),
  filter_bands: cubeMethod('data', 'bands'),
  filter_temporal: cubeMethod('data', 'extent'),
  filter_bbox: cubeMethod('data', 'extent:bbox'),
  mask: cubeMethod('data', 'mask replacement'),
  rename_labels: cubeMethod('data', 'dimension target source'),
  add_dimension: cubeMethod('data', 'name label type'),
  drop_dimension: cubeMethod('data', 'name'),
  resample_cube_spatial: cubeMethod('data', 'target method')
};

// Argument names `process()` and `PGNode()` take for themselves.
export const OWN_ARGUMENTS = [
  'arguments',
  'metadata',
  'namespace',
  'process_id'
];

// The module of each client name the code may use.
export const IMPORTS: Record<string, string> = {
  PGNode: 'openeo.internal.graph_building',
  array_create: 'openeo.processes',
  if_: 'openeo.processes',
  process: 'openeo.processes',
  build_child_callback: 'openeo.rest._datacube',
  DataCube: 'openeo.rest.datacube'
};

/** The import statements for the client names a piece of code uses. */
export function importLines(names: Iterable<string>): string[] {
  const modules = new Map<string, string[]>();
  for (const name of [...names].sort()) {
    modules.set(IMPORTS[name], [...(modules.get(IMPORTS[name]) ?? []), name]);
  }
  return [...modules.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([module, list]) => `from ${module} import ${list.join(', ')}`);
}
