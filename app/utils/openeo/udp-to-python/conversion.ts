/**
 * The conversion itself: writes a process graph as Python for the openEO
 * client. A step of the UDP graph becomes a statement on a cube; a callback
 * becomes a function over the client's callback values.
 *
 * The code builds the same graph as the UDP, except where the host (the code
 * the result is written for) provides a node or a parameter itself.
 */
import {
  BUILDER_METHODS,
  CUBE_METHODS,
  IMPORTS,
  LOGIC,
  NAMED_REDUCERS,
  OPERATORS,
  OWN_ARGUMENTS
} from './client';
import { errors } from './messages';
import {
  ATOM,
  type Expression,
  isKeyword,
  Names,
  pyFunction,
  pyScalar,
  pyString
} from './python';
import {
  CALLBACK_PARAMETERS,
  childGraph,
  type Dict,
  fromNode,
  fromParameter,
  type Graph,
  type GraphNode,
  referencedParameters,
  toGraph,
  visitValues
} from './udp';

/** What the code around the converted graph decides. */
export interface Host {
  /** The Python name that stands in for a UDP parameter. */
  parameter(name: string): string;
  /** The Python name of a node the host already provides, if it does. */
  provided(nodeId: string): string | undefined;
}

interface Step extends Expression {
  name?: string; // preferred variable name
  inline?: boolean; // never gets a statement of its own
}

// Steps that keep the order of the bands of the cube they get.
const KEEPS_BANDS = new Set(
  'aggregate_temporal aggregate_temporal_period apply filter_bbox filter_temporal mask mask_polygon resample_cube_spatial resample_spatial'.split(
    ' '
  )
);
const BAND_DIMENSIONS = ['bands', 'spectral'];

/** What one conversion collects while its scopes write the graph. */
export class Conversion {
  names: Names;
  imports = new Set<string>();
  /** Every process the code uses. */
  processes = new Set<string>();
  /** The namespace of each process that has one. */
  namespaces = new Map<string, string>();
  /** The collections the code loads itself. */
  collections = new Set<string>();
  /** How many times the code loads a collection itself. */
  loads = 0;
  constants: string[] = [];
  functions: string[] = [];
  private functionNames = new Map<string, string>();

  /**
   * @param host Provides the parameters, and the nodes it has itself
   * @param reserved Names the host's code already uses
   */
  constructor(
    readonly host: Host,
    reserved: string[]
  ) {
    this.names = new Names([...reserved, ...Object.keys(IMPORTS)]);
  }

  /** Starts the scope of a graph that is not a callback. */
  scope(graph: Graph): Scope {
    return new Scope(graph, this);
  }

  /**
   * Writes a value as a constant at the top of the code, and returns its
   * name. A value that is not known is left for the user to set.
   */
  constant(name: string, description: string, value: unknown): string {
    const constant = this.names.fresh(name);
    const doc = description.split(/\n|\\n/)[0].trim();
    if (value === undefined) {
      const note = doc ? ` ${doc}` : '';
      this.constants.push(`${constant} = None  # TODO: set a value.${note}`);
    } else {
      const source = this.scope({}).value(value);
      this.constants.push(`${doc ? `# ${doc}\n` : ''}${constant} = ${source}`);
    }
    return constant;
  }

  /** The name of the function with these lines, written once. */
  functionName(key: string, params: string[], body: string[]): string {
    const source = pyFunction('', params, body).join('\n');
    const known = this.functionNames.get(source);
    if (known) return known;
    // `process` is the client's own function.
    const name = this.names.fresh(key === 'process' ? 'transform' : key);
    this.functionNames.set(source, name);
    this.functions.push(pyFunction(name, params, body).join('\n'));
    return name;
  }
}

/** One process graph: the UDP's own, or the graph of a callback. */
export class Scope {
  lines: string[] = [];
  /** The labels a callback can index its data with, when known. */
  private bandNames?: string[];
  /** Whether this callback uses a parameter of a callback around it. */
  private captures = false;
  private built = new Map<string, string>();
  private building = new Set<string>();
  private alias = new Map<string, string>();
  private uses = new Map<string, number>();
  private names: Names;

  constructor(
    private graph: Graph,
    private conversion: Conversion,
    private locals?: string[],
    private outer?: Scope
  ) {
    this.names = locals
      ? new Names(locals, outer?.names ?? conversion.names)
      : conversion.names;

    // Nodes that build the same value from the same inputs are one node.
    const first = new Map<string, string>();
    for (const [id, node] of Object.entries(graph)) {
      const key = JSON.stringify([node.process_id, node.arguments]);
      if (key.includes('"from_node"') || node.namespace) continue;
      if (first.has(key)) this.alias.set(id, first.get(key)!);
      else first.set(key, id);
    }
    const counted = Object.fromEntries(
      Object.entries(graph).filter(([id]) => !this.alias.has(id))
    );
    visitValues(counted, (value) => {
      const id = fromNode(value);
      if (id === undefined) return false;
      const target = this.resolve(id);
      this.uses.set(target, (this.uses.get(target) ?? 0) + 1);
      return true;
    });
  }

  private get isCallback() {
    return this.locals !== undefined;
  }

  private resolve(id: string) {
    return this.alias.get(id) ?? id;
  }

  /** The ids of the nodes that are not part of the result. */
  unused(): string[] {
    return Object.keys(this.graph).filter(
      (id) => !this.alias.has(id) && !this.built.has(id)
    );
  }

  result(): GraphNode & { id: string } {
    const id = Object.keys(this.graph).find((i) => this.graph[i].result);
    if (!id) throw new Error(errors.noResultNode);
    return { ...this.graph[id], id };
  }

  /** The Python expression for a node, written as a statement when needed. */
  node(rawId: string): Expression {
    const id = this.resolve(rawId);
    const known = this.built.get(id);
    if (known) return { src: known, prec: ATOM };

    const node = this.graph[id];
    if (!node) {
      throw new Error(errors.missingNode(rawId));
    }
    if (this.building.has(id)) {
      throw new Error(errors.circularNode(id));
    }
    this.building.add(id);
    this.conversion.processes.add(node.process_id);
    if (node.namespace) {
      this.conversion.namespaces.set(node.process_id, node.namespace);
    }
    const step = this.isCallback
      ? this.builderStep(node)
      : this.cubeStep(id, node);
    this.building.delete(id);

    // The UDP graph gets a statement per step. A callback only names the
    // values it uses more than once.
    const shared = (this.uses.get(id) ?? 0) > 1;
    if (step.inline || (this.isCallback && !shared)) {
      if (step.inline) this.built.set(id, step.src);
      return step;
    }
    const name = this.names.fresh(step.name ?? this.stepName(id, node));
    if (node.description && !this.isCallback) {
      this.lines.push(`# ${node.description.split('\n')[0]}`);
    }
    this.lines.push(`${name} = ${step.src}`);
    this.built.set(id, name);
    return { src: name, prec: ATOM };
  }

  // `reducedimension1` reads better as `reduce_dimension_1`.
  private stepName(id: string, node: GraphNode) {
    const [, stem, number] = id.match(/^(.*?)(\d*)$/)!;
    return stem === node.process_id.replace(/_/g, '') && number
      ? `${node.process_id}_${number}`
      : id;
  }

  /** A value in Python. A callback in it is passed ready-made. */
  value(v: unknown, key = 'callback'): string {
    if (typeof v !== 'object' || v === null) return pyScalar(v as null);
    if (Array.isArray(v)) {
      return `[${v.map((item) => this.value(item, key)).join(', ')}]`;
    }
    const node = fromNode(v);
    if (node !== undefined) return this.node(node).src;
    const parameter = fromParameter(v);
    if (parameter !== undefined) return this.parameter(parameter);
    const graph = childGraph(v);
    if (graph) return this.callback(graph, key, 'wrapped');
    // shortcut: the client does not convert a callback value inside a dict;
    // write it as `{"from_node": ...}` here if a UDP ever needs it.
    const items = Object.entries(v as Dict).map(
      ([k, item]) => `${JSON.stringify(k)}: ${this.value(item, k)}`
    );
    return `{${items.join(', ')}}`;
  }

  /** Whether a name is a callback parameter here or in a callback around. */
  private local(name: string): boolean {
    if (this.locals?.includes(name)) return true;
    if (!this.outer?.local(name)) return false;
    this.captures = true;
    return true;
  }

  private parameter(name: string): string {
    return this.local(name) ? name : this.conversion.host.parameter(name);
  }

  /** Whether a value is one the client builds a graph from, in a callback. */
  private isBuilder(v: unknown): boolean {
    const parameter = fromParameter(v);
    return (
      fromNode(v) !== undefined ||
      (parameter !== undefined && this.local(parameter))
    );
  }

  private operand(v: unknown, prec: number, tight = false): string {
    const id = fromNode(v);
    if (id === undefined) return this.value(v);
    const expression = this.node(id);
    const wrap = expression.prec < prec || (expression.prec === prec && tight);
    return wrap ? `(${expression.src})` : expression.src;
  }

  /** `a=1, b=2`, or the dict form when a name is not valid as a keyword. */
  private keywords(args: Dict, leading: string[] = [], skip?: string): string {
    const entries = Object.entries(args).filter(([key]) => key !== skip);
    const plain = entries.every(
      ([key]) => isKeyword(key) && !OWN_ARGUMENTS.includes(key)
    );
    const items = entries.map(([key, v]) => {
      const source = this.value(v, key);
      return plain ? `${key}=${source}` : `${JSON.stringify(key)}: ${source}`;
    });
    const call =
      plain || items.length === 0 ? items : [`arguments={${items.join(', ')}}`];
    return [...leading, ...call].join(', ');
  }

  /** A step of the UDP graph: a method of the cube, or a generic call. */
  private cubeStep(id: string, node: GraphNode): Step {
    const { process_id: pid, arguments: args, namespace } = node;
    const provided = this.conversion.host.provided(id);
    if (provided !== undefined) {
      return { src: provided, prec: ATOM, inline: true };
    }
    if (pid === 'load_collection' && !namespace) {
      return this.loadCollection(args);
    }
    const data = fromNode(args.data);
    if (pid === 'save_result' && node.result && data !== undefined) {
      return { ...this.node(data), inline: true };
    }

    const method = CUBE_METHODS[pid];
    const receiver = method && fromNode(args[method.receiver]);
    const fits =
      !namespace &&
      receiver !== undefined &&
      Object.entries(args).every(([key, v]) => {
        if (key === method.receiver) return true;
        const graph = childGraph(v);
        const given = method.callbacks[key];
        if (!given) return key in method.args && !graph;
        return (
          graph &&
          this.ownParameters(toGraph(graph)).every((p) => given.includes(p))
        );
      });
    if (fits) {
      const overBands = BAND_DIMENSIONS.includes(args.dimension as string);
      this.bandNames = overBands ? this.bandsOf(receiver) : undefined;
      const call = Object.entries(args)
        .filter(([key]) => key !== method.receiver)
        .map(([key, v]) => {
          const graph = childGraph(v);
          const source = graph
            ? (this.namedReducer(graph) ??
              this.callback(graph, key, 'function'))
            : this.value(v, key);
          return `${method.args[key]}=${source}`;
        });
      return {
        src: `${this.node(receiver).src}.${pid}(${call.join(', ')})`,
        prec: ATOM
      };
    }

    this.bandNames = undefined;
    const call = this.keywords(args, [pyString(pid)]);
    const trailing = namespace ? `, namespace=${pyString(namespace)}` : '';
    const cube =
      data ??
      Object.values(args)
        .map(fromNode)
        .find((ref) => ref !== undefined);
    if (cube !== undefined) {
      return {
        src: `${this.node(cube).src}.process(${call}${trailing})`,
        prec: ATOM
      };
    }
    this.conversion.imports.add('DataCube').add('PGNode');
    return { src: `DataCube(PGNode(${call}${trailing}))`, prec: ATOM };
  }

  /** A collection the code loads itself, named after it. */
  private loadCollection(args: Dict): Step {
    const { id, ...rest } = args;
    const name = typeof id === 'string' ? id : undefined;
    if (name !== undefined) this.conversion.collections.add(name);
    this.conversion.loads += 1;
    this.conversion.imports.add('DataCube').add('PGNode');
    const call = [
      '"load_collection"',
      `id=${name === undefined ? this.value(id) : pyString(name)}`,
      ...Object.entries(rest).map(([key, v]) => `${key}=${this.value(v, key)}`)
    ];
    return {
      src: `DataCube(PGNode(${call.join(', ')}))`,
      prec: ATOM,
      name: name?.toLowerCase() ?? 'collection'
    };
  }

  /** A step of a callback, in the shortest form the client supports. */
  private builderStep(node: GraphNode): Step {
    const { process_id: pid, arguments: args, namespace } = node;
    const keys = Object.keys(args);
    const only = (...names: string[]) =>
      keys.length === names.length && names.every((name) => name in args);

    // The client's methods wrap a callback themselves, with parameters this
    // code can't know: a step with a callback goes through `process()`.
    if (!namespace && !Object.values(args).some(childGraph)) {
      const operator = OPERATORS[pid];
      const power = pid === 'power';
      const [left, right] = power ? [args.base, args.p] : [args.x, args.y];
      if (
        operator &&
        only(...(power ? ['base', 'p'] : ['x', 'y'])) &&
        (this.isBuilder(left) || (operator[2] && this.isBuilder(right)))
      ) {
        const [symbol, prec] = operator;
        // `a - (b - c)`, `(a ** b) ** c` and `(a < b) == c` keep their brackets.
        const lhs = this.operand(left, prec, prec === 0 || power);
        const rhs = this.operand(right, prec, prec === 0 || !power);
        return { src: `${lhs} ${symbol} ${rhs}`, prec };
      }

      if (pid === 'array_element' && this.isBuilder(args.data)) {
        const data = this.operand(args.data, ATOM);
        if (only('data', 'index') && Number.isInteger(args.index)) {
          const index = args.index as number;
          const ofData = fromParameter(args.data) === 'data' && index >= 0;
          const band = ofData ? this.bandNames?.[index] : undefined;
          const name = band ?? `b${index}`;
          return { src: `${data}[${index}]`, prec: ATOM, name };
        }
        if (only('data', 'label') && typeof args.label === 'string') {
          const src = `${data}[${pyString(args.label)}]`;
          return { src, prec: ATOM, name: args.label };
        }
      }

      if (pid in LOGIC && only('x', 'y') && this.isBuilder(args.x)) {
        const x = this.operand(args.x, ATOM);
        return { src: `${x}.${LOGIC[pid]}(${this.value(args.y)})`, prec: ATOM };
      }

      const choice = ['value', 'accept', 'reject'];
      if (
        pid === 'if' &&
        'value' in args &&
        'accept' in args &&
        keys.every((key) => choice.includes(key))
      ) {
        this.conversion.imports.add('if_');
        const values = choice
          .filter((key) => key in args)
          .map((key) => this.value(args[key]));
        return { src: `if_(${values.join(', ')})`, prec: ATOM };
      }

      if (pid === 'array_create' && only('data') && Array.isArray(args.data)) {
        this.conversion.imports.add('array_create');
        return { src: `array_create(${this.value(args.data)})`, prec: ATOM };
      }

      const first = (['data', 'x'] as const).find((name) =>
        BUILDER_METHODS[name].has(pid)
      );
      if (first && keys.every(isKeyword) && this.isBuilder(args[first])) {
        const target = this.operand(args[first], ATOM);
        const method = pid === 'not' ? 'not_' : pid;
        const call = this.keywords(args, [], first);
        return { src: `${target}.${method}(${call})`, prec: ATOM };
      }
    }

    this.conversion.imports.add('process');
    const leading = [pyString(pid)];
    if (namespace) leading.push(`namespace=${pyString(namespace)}`);
    return { src: `process(${this.keywords(args, leading)})`, prec: ATOM };
  }

  /** `"max"` for a callback that is only `max(data)`. */
  private namedReducer(graph: Dict): string | undefined {
    const nodes = Object.values(toGraph(graph));
    const [{ process_id: pid, arguments: args, namespace }] = nodes;
    const simple =
      nodes.length === 1 &&
      !namespace &&
      NAMED_REDUCERS.has(pid) &&
      Object.keys(args).length === 1 &&
      fromParameter(args.data) === 'data';
    if (!simple) return undefined;
    this.conversion.processes.add(pid);
    return pyString(pid);
  }

  /**
   * The parameters a callback declares. A callback inside a callback also
   * sees the outer parameters. Without the process specs, a name both could
   * own goes to the outer one, unless the callback would then have none.
   */
  private ownParameters(child: Graph): string[] {
    const found = referencedParameters(child);
    const standard = CALLBACK_PARAMETERS.filter((name) => found.has(name));
    const inner = standard.filter((name) => !this.locals?.includes(name));
    return inner.length > 0 ? inner : standard;
  }

  /** Writes a callback as a function and returns how to pass it. */
  private callback(
    graph: Dict,
    key: string,
    pass: 'function' | 'wrapped'
  ): string {
    const child = toGraph(graph);
    const params = this.ownParameters(child);
    const scope = new Scope(child, this.conversion, params, this);
    // Only a callback of the UDP graph itself gets the bands of a cube.
    if (!this.isCallback) scope.bandNames = this.bandNames;
    const returned = scope.node(scope.result().id).src;
    const body = [...scope.lines, `return ${returned}`];

    let name: string;
    if (!scope.captures) {
      name = this.conversion.functionName(key, params, body);
    } else if (scope.lines.length === 0) {
      name = `lambda ${params.join(', ')}: ${returned}`;
    } else {
      // It uses the values of this callback, so it lives inside it.
      name = this.names.fresh(key);
      this.lines.push(...pyFunction(name, params, body));
    }
    if (pass === 'function') return name;
    this.conversion.imports.add('build_child_callback');
    const list = params.map((p) => JSON.stringify(p)).join(', ');
    return `build_child_callback(${name}, parent_parameters=[${list}])`;
  }

  /** The band labels of the cube a node returns, when the UDP states them. */
  private bandsOf(id: string): string[] | undefined {
    for (
      let node = this.graph[this.resolve(id)];
      node;
      node = this.graph[this.resolve(fromNode(node.arguments.data) ?? '')]
    ) {
      if (node.process_id === 'load_collection') {
        const { bands } = node.arguments;
        return Array.isArray(bands) ? bands.map(String) : undefined;
      }
      if (!KEEPS_BANDS.has(node.process_id)) return undefined;
    }
    return undefined;
  }
}
