import type { JSONSchema7 } from 'json-schema';

/**
 * JSON Schema (draft-07) used by the openEO API to describe process
 * parameter and return value data types, extended with the openEO-specific
 * `subtype` keyword (e.g. "raster-cube", "process-graph", "bounding-box").
 */
export type OpenEOJsonSchema = JSONSchema7 & { subtype?: string };

/** A single data type, or a list of alternative data types. */
export type OpenEOProcessSchema = OpenEOJsonSchema | OpenEOJsonSchema[];

/** References data expected to be passed from another node in the same process graph. */
export interface ResultReference {
  from_node: string;
}

/** References data expected to come from a parameter of the enclosing process. */
export interface ParameterReference {
  from_parameter: string;
}

/** Embeds a child process graph, e.g. a reducer/callback passed as an argument. */
export interface ProcessGraphArgument {
  process_graph: ProcessGraph;
}

/**
 * The value of a process node argument. Recursively allows scalars, arrays,
 * objects, result/parameter references, and nested (child) process graphs.
 */
export type ProcessArgumentValue =
  | string
  | number
  | boolean
  | null
  | ResultReference
  | ParameterReference
  | ProcessGraphArgument
  | ProcessArgumentValue[]
  | { [key: string]: ProcessArgumentValue };

/** A single node ("step") within a process graph. */
export interface ProcessNode {
  process_id: string;
  namespace?: string | null;
  arguments: Record<string, ProcessArgumentValue>;
  description?: string;
  /** Exactly one node in a process graph MUST set this to true. */
  result?: boolean;
}

/**
 * A process graph: a connected set of executable process nodes, keyed by a
 * unique node ID within the graph.
 */
export type ProcessGraph = Record<string, ProcessNode>;

/** Describes a single parameter accepted by a process. */
export interface ProcessParameter {
  name: string;
  description: string;
  schema: OpenEOProcessSchema;
  optional?: boolean;
  deprecated?: boolean;
  experimental?: boolean;
  default?: unknown;
}

/** Describes the value returned by a process. */
export interface ProcessReturnValue {
  description?: string;
  schema: OpenEOProcessSchema;
}

/** A named exception a process may raise during execution, keyed by error code. */
export interface ProcessException {
  message: string;
  description?: string;
  http?: number;
}

/** A usage example for a process, may be used for documentation or unit tests. */
export interface ProcessExample {
  title?: string;
  description?: string;
  arguments: Record<string, ProcessArgumentValue>;
  returns?: unknown;
}

/** A web link related to a process, e.g. to external documentation. */
export interface ProcessLink {
  rel: string;
  href: string;
  title?: string;
  type?: string;
}

/**
 * An openEO Process: metadata for either a pre-defined process (as returned
 * by GET /processes) or a user-defined process (as returned by/sent to
 * /process_graphs), per the openEO API specification.
 * @see https://api.openeo.org/#tag/Process-Discovery
 */
export interface OpenEOProcess {
  id: string;
  summary?: string;
  description?: string;
  categories?: string[];
  parameters?: ProcessParameter[];
  returns?: ProcessReturnValue;
  deprecated?: boolean;
  experimental?: boolean;
  exceptions?: Record<string, ProcessException>;
  examples?: ProcessExample[];
  links?: ProcessLink[];
  process_graph?: ProcessGraph;
}
