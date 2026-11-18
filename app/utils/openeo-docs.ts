import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, hoverTooltip } from '@codemirror/view';

import {
  OP_MEMBER_NAMES,
  OPENEO_PROCESS_NAMES,
  PUBLIC_GLOBALS,
  PublicGlobal
} from '../algorithms/base/environment';

interface ProcessDoc {
  summary: string;
  params: { name: string; optional: boolean; description: string }[];
  returns: string;
}

let docsPromise: Promise<Record<string, ProcessDoc>> | null = null;

// The docs file is large: load it on first use, in its own chunk.
function loadDocs() {
  docsPromise ??= import('../algorithms/base/openeo-process-docs.json').then(
    (json) => json.processes as Record<string, ProcessDoc>,
    // Allow a retry on the next use, for example after a network error.
    (error) => {
      docsPromise = null;
      throw error;
    }
  );
  return docsPromise;
}

function element(tag: string, className?: string, text?: string) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

/** Appends docstring text, with `code` and **bold** spans. */
function appendText(parent: HTMLElement, text: string) {
  for (const part of text.split(/(`{1,2}[^`]+`{1,2}|\*\*[^*]+\*\*)/)) {
    if (part.startsWith('`')) {
      parent.append(element('code', undefined, part.replace(/`/g, '')));
    } else if (part.startsWith('**')) {
      parent.append(element('strong', undefined, part.slice(2, -2)));
    } else {
      parent.append(part);
    }
  }
}

/** Renders the documentation of op.<name>. */
export function renderProcessDoc(name: string, doc: ProcessDoc): HTMLElement {
  const dom = element('div', 'cm-openeo-doc');

  const signature = doc.params
    .map((param) => (param.optional ? `${param.name}=…` : param.name))
    .join(', ');
  dom.append(
    element('code', 'cm-openeo-doc-signature', `op.${name}(${signature})`)
  );

  const summary = element('p');
  appendText(summary, doc.summary);
  dom.append(summary);

  if (doc.params.length) {
    const list = element('dl');
    for (const param of doc.params) {
      const term = element('dt');
      term.append(element('code', undefined, param.name));
      if (param.optional) term.append(' (optional)');
      const description = element('dd');
      appendText(description, param.description);
      list.append(term, description);
    }
    dom.append(list);
  }

  if (doc.returns) {
    const returns = element('p');
    returns.append(element('strong', undefined, 'Returns: '));
    appendText(returns, doc.returns);
    dom.append(returns);
  }

  // The process id has no trailing underscore: op.if_ is the process "if".
  const link = element('a', undefined, 'openEO documentation ↗');
  link.setAttribute(
    'href',
    `https://processes.openeo.org/#${name.replace(/_$/, '')}`
  );
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  dom.append(link);

  return dom;
}

/** The documentation of op.<name> as a DOM node, for the autocomplete info. */
export async function processDocInfo(name: string) {
  const doc = (await loadDocs())[name];
  return doc ? renderProcessDoc(name, doc) : null;
}

const SKIP_NODES = new Set(['String', 'FormattedString', 'Comment']);

/** Renders the documentation of a code contract global. */
export function renderGlobalDoc(global: PublicGlobal): HTMLElement {
  const dom = element('div', 'cm-openeo-doc');
  dom.append(
    element('code', 'cm-openeo-doc-signature', `${global.name}: ${global.type}`)
  );
  const description = element('p');
  appendText(description, global.description);
  dom.append(description);
  return dom;
}

const globalsByName = new Map(
  PUBLIC_GLOBALS.map((global) => [global.name, global])
);

/**
 * The documented name at a position: an openEO process (op.<name>, or a bare
 * name from processes.py: max_ -> max) or a global from PUBLIC_GLOBALS.
 */
export function symbolAt(state: EditorState, pos: number) {
  const word = state.wordAt(pos);
  if (!word) return null;
  if (SKIP_NODES.has(syntaxTree(state).resolveInner(pos, 1).name)) return null;

  const text = state.sliceDoc(word.from, word.to);
  const before = state.sliceDoc(Math.max(0, word.from - 4), word.from);
  const range = { from: word.from, to: word.to };
  if (/(^|[^\w.])op\.$/.test(before)) {
    return OP_MEMBER_NAMES.includes(text)
      ? { ...range, kind: 'process' as const, name: text }
      : null;
  }
  // Attribute access on some other object.
  if (before.endsWith('.')) return null;
  const global = globalsByName.get(text);
  if (global) return { ...range, kind: 'global' as const, name: text, global };
  const process = OP_MEMBER_NAMES[OPENEO_PROCESS_NAMES.indexOf(text)];
  return process ? { ...range, kind: 'process' as const, name: process } : null;
}

/** Hover tooltips and styles for the openEO processes and the globals. */
export const openeoDocs = [
  hoverTooltip(async (view, pos) => {
    const symbol = symbolAt(view.state, pos);
    if (!symbol) return null;
    const dom =
      symbol.kind === 'global'
        ? renderGlobalDoc(symbol.global)
        : await processDocInfo(symbol.name);
    if (!dom) return null;
    return {
      pos: symbol.from,
      end: symbol.to,
      above: true,
      create: () => ({ dom })
    };
  }),
  EditorView.baseTheme({
    '.cm-openeo-doc': {
      maxWidth: '28rem',
      maxHeight: '20rem',
      overflowY: 'auto',
      padding: '0.5rem 0.75rem',
      fontSize: '0.8125rem',
      lineHeight: '1.4'
    },
    '.cm-openeo-doc p, .cm-openeo-doc dl': { margin: '0.5rem 0' },
    '.cm-openeo-doc dd': { margin: '0 0 0.25rem 1rem' },
    '.cm-openeo-doc-signature': { fontWeight: 'bold' },
    '.cm-openeo-doc a': {
      color: 'var(--chakra-colors-primary-fg)',
      textDecoration: 'none'
    },
    '.cm-openeo-doc a:hover': { textDecoration: 'underline' }
  })
];
