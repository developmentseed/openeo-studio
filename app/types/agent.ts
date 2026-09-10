/**
 * Types for the openEO Studio agent contract.
 *
 * The contract has three parts:
 *  - the Studio state document, an openEO view of the project that the
 *    agent reads;
 *  - the proposal, the only way for the agent to change the project;
 *  - the AG-UI events that Studio reads from the agent.
 *
 * The design chapter is in ESA-APEx/apex_design,
 * `propagation/openeo_studio_agent.qmd`.
 */

import type { ProcessParameter } from './openeo-process';

/** Version of this contract. Studio sends it in every run. */
export const AGENT_CONTRACT_VERSION = '1.0';

/* -------------------------------------------------------------------------- */
/* Studio state document                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A spatial extent in openEO format.
 * openEO uses an object, not the [west, south, east, north] array that the
 * editor store holds.
 */
export interface SpatialExtent {
  west: number;
  south: number;
  east: number;
  north: number;
  /** EPSG code. openEO uses 4326 when the field is absent. */
  crs?: number;
}

/**
 * A temporal extent in openEO format. Each limit is an RFC 3339 string.
 * `null` means an open limit. The editor store uses an empty string instead.
 */
export type TemporalExtent = [string | null, string | null];

/** Where the project comes from. This replaces the old scene concept. */
export interface ProjectOrigin {
  kind: 'blank' | 'catalogue' | 'user';
  /** The catalogue provider, for example `json`, `apex`, or `openeo-udp`. */
  providerId?: string;
  /** The identifier of the item in that provider. */
  sourceRef?: string;
}

export interface StudioProject {
  /** The user-defined process id. It is null while the project is not saved. */
  id: string | null;
  title: string;
  origin: ProjectOrigin;
  /**
   * True when the project holds work that Studio did not save to the backend
   * yet. The agent reads this before it proposes to replace the whole
   * project. Studio calls this `isDirty` internally.
   */
  hasUnsavedChanges: boolean;
  revision: number;
}

export interface StudioLayer {
  id: string;
  name: string;
  visible: boolean;
}

/** One message from the code editor linter. */
export interface LintDiagnostic {
  line: number;
  column: number;
  code?: string;
  message: string;
  severity: 'error' | 'warning';
}

/** The result of a failed run. */
export interface ExecutionDiagnostic {
  message: string;
  /** The full Python traceback, when there is one. */
  traceback?: string;
  at: string;
}

/** One error from the openEO `/validation` endpoint. */
export interface ValidationDiagnostic {
  code?: string;
  message?: string;
  path?: string;
}

export interface StudioDiagnostics {
  execution: ExecutionDiagnostic | null;
  validation: ValidationDiagnostic[];
  lint: LintDiagnostic[];
}

/**
 * The backend that Studio is connected to.
 *
 * The document holds the address only. The agent reads the collections and
 * the processes from the backend itself, so Studio does not copy them here.
 */
export interface StudioBackend {
  openeoApiUrl: string;
}

/**
 * The state object that Studio sends to the agent in every run.
 * It is a projection of the project, in openEO terms. It is not a copy of the
 * editor store.
 */
export interface StudioStateDocument {
  contractVersion: string;
  project: StudioProject;
  /** The collection that the project reads. */
  collectionId: string;
  parameters: ProcessParameter[];
  code: {
    userCode: string;
  };
  layers: StudioLayer[];
  /**
   * Present for the error triggers only. A traceback is large, and a normal
   * question does not need it. There is no tool to read it: the trigger
   * controls the decision.
   */
  diagnostics?: StudioDiagnostics;
  backend: StudioBackend;
  /**
   * The catalogue providers that this deployment enables, for example
   * `json` or `apex`. The agent can propose an item from these providers
   * only. Studio refuses an item from any other provider.
   */
  sources: string[];
}

/* -------------------------------------------------------------------------- */
/* Proposals                                                                  */
/* -------------------------------------------------------------------------- */

/** One RFC 6902 operation. Studio accepts a small subset of the paths. */
export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace';
  /** A JSON Pointer, for example `/parameters/time/default`. */
  path: string;
  value?: unknown;
}

export type ProposalStatus =
  | 'pending'
  | 'applying'
  | 'accepted'
  | 'rejected'
  | 'superseded'
  | 'failed';

export type ProposalKind =
  | 'collection'
  | 'parameters'
  | 'code'
  | 'project'
  | 'catalogueItem';

/**
 * A reference to one item of a catalogue provider.
 *
 * The agent sends a reference, not a copy. Studio reads the item through the
 * same provider that a user browses, so the result is the project that the
 * user gets when the user opens the item directly.
 */
export interface CatalogueItemRef {
  providerId: string;
  sourceRef: string;
}

/**
 * `risk` controls the display only. It does not control the approval.
 * The user must approve every proposal.
 */
export type ProposalRisk = 'low' | 'medium' | 'high';

export interface Proposal {
  id: string;
  threadId: string;
  runId: string;
  /** The tool call that waits for the decision of the user. */
  toolCallId: string;
  origin: TriggerKind;
  kind: ProposalKind;
  /** One line. The user interface shows this text. */
  rationale: string;
  /** The project revision used for the calculation. */
  baseRevision: number;
  /**
   * The change, as Studio calculated it. The agent sends arguments only.
   * Studio builds this patch and the preview that the user sees.
   */
  patch: JsonPatchOperation[];
  /** The two versions of the code, for a proposal of kind `code`. */
  preview?: { before: string; after: string };
  /** The item to open, for a proposal of kind `catalogueItem`. */
  reference?: CatalogueItemRef;
  risk: ProposalRisk;
  status: ProposalStatus;
  createdAt: string;
  resolvedAt?: string;
  failure?: { code: string; message: string };
}

export type ToolDecisionKind =
  | 'accepted'
  | 'rejected'
  | 'superseded'
  | 'invalid';

/** Studio sends this object back to the agent in an AG-UI ToolMessage. */
export interface ToolDecision {
  decision: ToolDecisionKind;
  proposalId: string;
  /** Why the proposal did not apply. */
  reason?: string;
  /** The new project revision, when the user accepted the proposal. */
  appliedRevision: number | null;
}

/* -------------------------------------------------------------------------- */
/* Triggers                                                                   */
/* -------------------------------------------------------------------------- */

export type TriggerKind =
  | 'user.prompt'
  | 'editor.executionError'
  | 'editor.validationError'
  | 'editor.lintDiagnostic'
  | 'home.kickstart';

export const TRIGGER_KINDS: TriggerKind[] = [
  'user.prompt',
  'editor.executionError',
  'editor.validationError',
  'editor.lintDiagnostic',
  'home.kickstart'
];

export interface TriggerDescriptor {
  kind: TriggerKind;
  /** An APEx operator sets this value in the deployment configuration. */
  enabled: boolean;
  /**
   * A trigger always needs an action from the user. A trigger must never
   * start a run on its own. The value is constant, but it is explicit here
   * because it is a rule of the contract.
   */
  activation: 'user-gesture';
  /**
   * The paths that Studio adds to the state document for this trigger.
   * Studio always sends the rest of the document. It adds these paths only
   * when the trigger needs them, because they can be large.
   */
  stateScope: string[];
}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export type AgentSessionStatus = 'idle' | 'running' | 'awaiting_user' | 'error';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* AG-UI events                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The AG-UI events that Studio reads. The agent can send more events.
 * Studio ignores the events that it does not know.
 */
export type AgentEvent =
  | { type: 'RUN_STARTED'; threadId: string; runId: string }
  | { type: 'RUN_FINISHED'; threadId: string; runId: string }
  | { type: 'RUN_ERROR'; message: string; code?: string }
  | { type: 'TEXT_MESSAGE_START'; messageId: string; role: 'assistant' }
  | { type: 'TEXT_MESSAGE_CONTENT'; messageId: string; delta: string }
  | { type: 'TEXT_MESSAGE_END'; messageId: string }
  | {
      type: 'TOOL_CALL_START';
      toolCallId: string;
      toolCallName: string;
      parentMessageId?: string;
    }
  | { type: 'TOOL_CALL_ARGS'; toolCallId: string; delta: string }
  | { type: 'TOOL_CALL_END'; toolCallId: string }
  | {
      type: 'TOOL_CALL_RESULT';
      messageId: string;
      toolCallId: string;
      content: string;
    }
  | { type: 'STATE_SNAPSHOT'; snapshot: unknown }
  | { type: 'STATE_DELTA'; delta: JsonPatchOperation[] };

/** The description that the agent publishes at /.well-known/agent-card. */
export interface AgentCard {
  protocol: string;
  contractVersions: string[];
  capabilities?: string[];
  models?: string[];
}
