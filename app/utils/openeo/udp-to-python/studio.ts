/**
 * What is specific to openEO Studio: the code runs after the loader script,
 * which already provides `datacube`, `bounding_box`, `time`, `bands` and
 * `add_graph_to_map`. So the main collection and its parameters move to the
 * editor configuration, and the result becomes a layer on the map.
 */
import type { PropertyFilter, PropertyFilterOperator } from '$types';
import { PROPERTY_FILTER_OPERATORS } from '$utils/property-filters';
import { importLines } from './client';
import { Conversion, type Host } from './conversion';
import { errors, notices } from './messages';
import { pyModule } from './python';
import {
  childGraph,
  type Dict,
  fromNode,
  fromParameter,
  type Graph,
  type GraphNode,
  isDict,
  toGraph,
  type UdpParameter,
  udpParameters
} from './udp';

export interface UdpConversionOptions {
  title: string;
  /** Example argument values, used where a parameter has no default. */
  scenario?: Dict;
}

export interface UdpConversion {
  code: string;
  /** The configuration the code expects. Values the UDP doesn't set are absent. */
  seed: {
    collectionId?: string;
    bands: string[];
    temporalRange?: [string, string];
    boundingBox?: [number, number, number, number];
    propertyFilters: PropertyFilter[];
  };
  warnings: string[];
  /** Every process the code uses. */
  processes: string[];
  /** The collections the code loads itself, next to the configuration's. */
  collections: string[];
}

// Names the loader script (`app/algorithms/base/loader.py`) and the map
// layer below already use.
const LOADER_NAMES =
  'ALLOWED_OPERATORS DataCube PGNode Parameter SaveResult absolute add_graph_to_map and_ array_create bands bounding_box clip datacube graph if_ index inspect json linear_scale_range load_collection_args map_graphs map_layer operator parameter_name parameters process properties property_condition property_filter property_name property_parameter_name re reduced sqrt time'.split(
    ' '
  );

// Results the map can't show as a layer.
const NOT_AN_IMAGE = ['aggregate_spatial', 'raster_to_vector'];

/** The west, south, east and north of a GeoJSON object. */
function geometryBounds(geometry: unknown) {
  const xs: number[] = [];
  const ys: number[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      if (typeof value[0] === 'number' && typeof value[1] === 'number') {
        xs.push(value[0]);
        ys.push(value[1]);
      } else value.forEach(visit);
    } else if (isDict(value)) {
      Object.entries(value).forEach(([key, v]) => key !== 'bbox' && visit(v));
    }
  };
  visit(geometry);
  if (xs.length === 0) return undefined;
  return [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys)
  ] as [number, number, number, number];
}

/** The studio project of one UDP: its configuration and its code. */
class StudioProject implements Host {
  private graph: Graph;
  private parameters: Map<string, UdpParameter>;
  private conversion: Conversion;
  private seed: UdpConversion['seed'] = { bands: [], propertyFilters: [] };
  private warnings: string[] = [];
  /** The Python name of each UDP parameter the code refers to. */
  private written = new Map<string, string>();
  /** The node the loader script's `datacube` stands for. */
  private mainCollection?: string;

  constructor(
    udp: Dict,
    private options: UdpConversionOptions
  ) {
    this.graph = toGraph(udp.process_graph);
    this.parameters = udpParameters(udp);
    this.conversion = new Conversion(this, LOADER_NAMES);
    this.configure();
  }

  private parameterValue(name: string): unknown {
    return this.options.scenario?.[name] ?? this.parameters.get(name)?.default;
  }

  private findParameter(subtype: string, names: RegExp) {
    return [...this.parameters.values()].find(
      (p) =>
        [p.schema ?? []]
          .flat()
          .some((s) => isDict(s) && s.subtype === subtype) || names.test(p.name)
    )?.name;
  }

  /** Picks the collection and the parameters the configuration takes over. */
  private configure() {
    // The main collection gets the time range and the area of the
    // configuration. A collection the UDP loads for all times is not one.
    const spatialOf = (node: GraphNode) =>
      fromParameter(node.arguments.spatial_extent);
    const rank = (node: GraphNode) =>
      (spatialOf(node) === undefined ? 0 : 2) +
      (Array.isArray(node.arguments.bands) ? 1 : 0);
    const [id, node] = Object.entries(this.graph)
      .filter(
        ([, n]) =>
          n.process_id === 'load_collection' &&
          !n.namespace &&
          typeof n.arguments.id === 'string' &&
          fromParameter(n.arguments.temporal_extent) !== undefined &&
          (n.arguments.spatial_extent == null || spatialOf(n) !== undefined)
      )
      .reduce<[string, GraphNode] | []>(
        (best, load) =>
          best[1] && rank(best[1]) >= rank(load[1]) ? best : load,
        []
      );
    const args = node?.arguments ?? {};

    const spatial =
      fromParameter(args.spatial_extent) ??
      this.findParameter(
        'bounding-box',
        /^(spatial_extent|bbox|bounding_box)$/
      );
    const temporal =
      fromParameter(args.temporal_extent) ??
      this.findParameter('temporal-interval', /^(temporal_extent|time)$/);
    if (spatial !== undefined) {
      this.written.set(spatial, 'bounding_box');
      const value = this.parameterValue(spatial);
      const sides = ['west', 'south', 'east', 'north'];
      if (isDict(value) && sides.every((k) => typeof value[k] === 'number')) {
        this.seed.boundingBox = sides.map((k) => value[k]) as [
          number,
          number,
          number,
          number
        ];
      } else if (value != null) {
        this.seed.boundingBox = geometryBounds(value);
        this.warnings.push(notices.geometryParameter(spatial));
      }
    }
    if (temporal !== undefined) {
      this.written.set(temporal, 'time');
      const value = this.parameterValue(temporal);
      if (
        Array.isArray(value) &&
        value.length === 2 &&
        value.every((date) => typeof date === 'string')
      ) {
        this.seed.temporalRange = [
          value[0].slice(0, 10),
          value[1].slice(0, 10)
        ];
      }
    }
    if (!id) return;

    this.mainCollection = id;
    this.seed.collectionId = args.id as string;
    const bands = fromParameter(args.bands);
    if (bands !== undefined) this.written.set(bands, 'bands');
    const list = bands === undefined ? args.bands : this.parameterValue(bands);
    if (Array.isArray(list)) this.seed.bands = list.map(String);

    for (const [property, condition] of Object.entries(
      isDict(args.properties) ? args.properties : {}
    )) {
      const filter = this.propertyFilter(property, condition);
      if (filter) this.seed.propertyFilters.push(filter);
      else this.warnings.push(notices.filterNotCarriedOver(property));
    }
    const known = 'id bands spatial_extent temporal_extent properties';
    for (const [key, v] of Object.entries(args)) {
      if (known.split(' ').includes(key) || v == null) continue;
      this.warnings.push(notices.optionNotCarriedOver(key));
    }
  }

  /** A `load_collection` condition as a filter, when it is one comparison. */
  private propertyFilter(
    property: string,
    condition: unknown
  ): PropertyFilter | undefined {
    const nodes = Object.values(childGraph(condition) ?? {});
    const [only] = nodes;
    if (nodes.length !== 1 || !isDict(only) || !isDict(only.arguments)) {
      return undefined;
    }
    const operator = only.process_id as PropertyFilterOperator;
    const { x, y } = only.arguments;
    const parameter = fromParameter(y);
    const value = parameter === undefined ? y : this.parameterValue(parameter);
    const comparable =
      PROPERTY_FILTER_OPERATORS.includes(operator) &&
      Object.keys(only.arguments).length === 2 &&
      fromParameter(x) === 'value' &&
      (typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'boolean');
    return comparable ? { property, operator, value } : undefined;
  }

  /** The loader script's `datacube` is the main collection. */
  provided(nodeId: string): string | undefined {
    return nodeId === this.mainCollection ? 'datacube' : undefined;
  }

  /**
   * The loader script's name for a parameter the configuration takes over.
   * Any other parameter becomes a constant in the code.
   */
  parameter(name: string): string {
    const known = this.written.get(name);
    if (known) return known;

    const value = this.parameterValue(name);
    const description = this.parameters.get(name)?.description ?? '';
    const constant = this.conversion.constant(name, description, value);
    this.written.set(name, constant);
    if (value === undefined) {
      this.warnings.push(notices.parameterWithoutValue(name));
    }
    return constant;
  }

  /** The end of the code: the result as a layer on the map. */
  private mapLayer(result: string): string {
    return [
      '# TODO: the UDP returns data values, not colours. Set the value range to show.',
      `map_layer = ${result}.linear_scale_range(`,
      '    input_min=0, input_max=1, output_min=0, output_max=255',
      ')',
      'map_layer = map_layer.save_result("PNG")',
      `add_graph_to_map(map_layer, ${JSON.stringify(this.options.title)})`
    ].join('\n');
  }

  run(): UdpConversion {
    const { conversion, graph, warnings } = this;
    const root = conversion.scope(graph);
    const end = root.result();
    const result = root.node(end.id).src;

    const loadsAny = Object.values(graph).some(
      (node) => node.process_id === 'load_collection'
    );
    if (!this.mainCollection) {
      warnings.push(loadsAny ? notices.collectionInCode : notices.noCollection);
    }
    // The configuration selects one collection. Code can load more, but
    // Studio then has no control over them.
    if (conversion.loads + (this.mainCollection ? 1 : 0) > 1) {
      warnings.push(
        this.mainCollection
          ? notices.severalCollections
          : notices.severalCollectionsInCode
      );
    }
    for (const [process, namespace] of conversion.namespaces) {
      warnings.push(notices.namespacedProcess(process, namespace));
    }
    const unused = root.unused();
    if (unused.length > 0) {
      warnings.push(notices.unusedSteps(unused));
    }
    const last =
      end.process_id === 'save_result'
        ? graph[fromNode(end.arguments.data) ?? '']
        : end;
    if (last && NOT_AN_IMAGE.includes(last.process_id)) {
      warnings.push(notices.notAnImage(last.process_id));
    }

    const title = this.options.title.replace(/\s+/g, ' ');
    return {
      code: pyModule([
        `# ${title}\n# Generated from the UDP process graph. Review before use.`,
        importLines(conversion.imports).join('\n'),
        conversion.constants.join('\n'),
        ...conversion.functions,
        root.lines.join('\n'),
        this.mapLayer(result)
      ]),
      seed: this.seed,
      warnings,
      processes: [...conversion.processes],
      collections: [...conversion.collections]
    };
  }
}

/**
 * Converts a UDP to studio code.
 *
 * @param udp The parsed UDP document
 * @throws Error when the document has no usable process graph
 */
export function udpToPython(
  udp: unknown,
  options: UdpConversionOptions
): UdpConversion {
  if (!isDict(udp)) throw new Error(errors.noProcessGraph);
  return new StudioProject(udp, options).run();
}
