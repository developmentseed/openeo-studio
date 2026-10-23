/**
 * The Assistant tab's side of AG-UI.
 *
 * The project goes to the agent as AG-UI `state` under `studio`, so its tools
 * read it by reference and the model never has to read the code to check it
 * or write it out to change it. A change comes back as the arguments of a
 * `propose_code_edit` call: line ranges of the code sent with that run, and
 * what replaces them.
 */

import { HttpAgent } from '@ag-ui/client';

import type { EditorConfigValues } from '$config/default-editor-config';
import { authHeader } from '$utils/api';
import { cloudCoverOf } from '$utils/property-filters';
import type { GraphResult, ServiceInfo } from '$types';
import {
  AGENT_CONTRACT_VERSION,
  type AgentEvent,
  type StudioStateDocument
} from '$types/agent';
import type { OpenEOJsonSchema, ProcessParameter } from '$types/openeo-process';

/** Lines `start_line`..`end_line` (1-based, inclusive) become `replace`. */
export interface CodeEdit {
  start_line: number;
  /** `start_line - 1` inserts before `start_line`. */
  end_line: number;
  replace: string;
}

/**
 * The code with every edit applied, or null when an edit is out of range or
 * overlaps another. Every line number refers to `code` as given.
 */
export function applyEdits(code: string, edits: CodeEdit[]): string | null {
  // The edits are the model's JSON: a missing or fractional line number
  // would pass the range checks below and splice in the wrong place.
  const wellFormed = (edit: CodeEdit) =>
    Number.isInteger(edit.start_line) &&
    Number.isInteger(edit.end_line) &&
    typeof edit.replace === 'string';
  if (!edits.every(wellFormed)) return null;
  const lines = code.split('\n');
  const trailing = code.endsWith('\n');
  if (trailing) lines.pop();
  const ordered = [...edits].sort((a, b) => a.start_line - b.start_line);
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].start_line <= ordered[i - 1].end_line) return null;
  }
  for (const edit of ordered.reverse()) {
    if (edit.start_line < 1 || edit.start_line > lines.length + 1) return null;
    if (edit.end_line < edit.start_line - 1 || edit.end_line > lines.length) {
      return null;
    }
    lines.splice(
      edit.start_line - 1,
      edit.end_line - edit.start_line + 1,
      ...(edit.replace ? edit.replace.replace(/\n$/, '').split('\n') : [])
    );
  }
  return lines.join('\n') + (trailing ? '\n' : '');
}

interface RunInput {
  /** The agent's root, for example `http://localhost:8765`. */
  url: string;
  threadId: string;
  message: string;
  state: Record<string, unknown>;
  /** The user's access token. The deployed agent sits behind the same
   * sign-in as the backend, so it gets the header the backend does. */
  token?: string;
}

/**
 * A value a tool stored in the thread's session state, read from the agent's
 * state route. A tool stores what is too large for the conversation there, so
 * Studio reads it directly and the model never carries it.
 */
export async function readState<T>(
  url: string,
  threadId: string,
  key: string,
  token?: string
): Promise<T> {
  const response = await fetch(`${url}/threads/${threadId}/state/${key}`, {
    headers: token ? { Authorization: authHeader(token) } : {}
  });
  if (!response.ok) {
    throw new Error(`The assistant's state answered ${response.status}.`);
  }
  return ((await response.json()) as { value: T }).value;
}

/**
 * Post one run with `@ag-ui/client` and call `onEvent` for each event as it
 * arrives. The agent keeps the conversation, so a run carries only the new
 * question and the project's state.
 */
export async function runAgent(
  { url, threadId, message, state, token }: RunInput,
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  const agent = new HttpAgent({
    url: `${url}/runs`,
    headers: token ? { Authorization: authHeader(token) } : {},
    threadId,
    initialState: state,
    initialMessages: [
      { id: crypto.randomUUID(), role: 'user', content: message }
    ]
  });
  await agent.runAgent(undefined, {
    onEvent: ({ event }) => onEvent(event as unknown as AgentEvent)
  });
}

/** One band name, in openEO's terms; JSON Schema's own `items` type has no
 * `subtype`, so it is declared with the openEO one. */
const BAND_NAME: OpenEOJsonSchema = { type: 'string', subtype: 'band-name' };

/**
 * The configuration as the parameters `app/algorithms/base/loader.py`
 * declares: the same names, and the shapes of their openEO subtypes. The
 * inverse of `deriveConfigFromProject`. One exception: the agent contract
 * knows the cloud cover filter only, as `cloud_cover_max`, where the loader
 * declares one parameter per property filter.
 */
export function projectParameters(
  config: EditorConfigValues
): ProcessParameter[] {
  const box = config.boundingBox;
  return [
    {
      name: 'time',
      description: 'The dates to load, start and end.',
      schema: { type: 'array', subtype: 'temporal-interval' },
      optional: true,
      default: config.temporalRange
    },
    {
      name: 'bounding_box',
      description: 'The area to load, in degrees.',
      schema: { type: 'object', subtype: 'bounding-box' },
      optional: true,
      ...(box && {
        default: { west: box[0], south: box[1], east: box[2], north: box[3] }
      })
    },
    {
      name: 'bands',
      description: 'The bands to load, in order.',
      schema: { type: 'array', items: BAND_NAME },
      optional: true,
      default: config.selectedBands
    },
    {
      name: 'cloud_cover_max',
      description: 'The highest cloud cover to load, in percent.',
      schema: { type: 'number', minimum: 0, maximum: 100 },
      optional: true,
      default: cloudCoverOf(config.propertyFilters)
    }
  ];
}

/**
 * What this client adds to the contract's state document: the graphs the last
 * run made, which the agent traces and validates. See
 * docs/adr/0005-agent-integration-gaps.md.
 */
export type StudioState = StudioStateDocument & { graphs: GraphResult[] };

interface ProjectSnapshot {
  sceneId: string | null;
  sceneName: string;
  isSample: boolean;
  isDirty: boolean;
  revision: number;
  config: EditorConfigValues;
  code: string;
  services: ServiceInfo[];
  lastRun: { graphs: GraphResult[]; error: string | null; at?: string } | null;
  openeoApiUrl: string;
}

/** The project in the contract's terms, for one run. */
export function studioDocument(project: ProjectSnapshot): StudioState {
  const { lastRun } = project;
  return {
    contractVersion: AGENT_CONTRACT_VERSION,
    project: {
      id: project.isSample ? null : project.sceneId,
      title: project.sceneName,
      origin: project.isSample
        ? { kind: 'catalogue', providerId: 'json', sourceRef: project.sceneId! }
        : { kind: project.sceneId ? 'user' : 'blank' },
      hasUnsavedChanges: project.isDirty,
      revision: project.revision
    },
    collectionId: project.config.collectionId,
    parameters: projectParameters(project.config),
    code: { userCode: project.code },
    layers: project.services.map((service) => ({
      id: service.id,
      name: service.graphResult.name,
      visible: service.visible
    })),
    diagnostics: {
      execution: lastRun?.error
        ? { message: lastRun.error, at: lastRun.at ?? new Date().toISOString() }
        : null,
      validation: [],
      lint: []
    },
    backend: { openeoApiUrl: project.openeoApiUrl },
    sources: [],
    applyMode: 'ask',
    graphs: lastRun?.graphs ?? []
  };
}

/** An edit replacing every line of `code` with `replace`. */
export function replaceAll(code: string, replace: string): CodeEdit {
  const lines = code.split('\n').length - (code.endsWith('\n') ? 1 : 0);
  return { start_line: 1, end_line: Math.max(lines, 1), replace };
}
