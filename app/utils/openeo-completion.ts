import {
  Completion,
  CompletionContext,
  CompletionResult,
  ifNotIn
} from '@codemirror/autocomplete';
import { pythonLanguage } from '@codemirror/lang-python';

import {
  LOADER_GLOBALS,
  OPENEO_PROCESS_NAMES,
  PUBLIC_GLOBALS
} from '../algorithms/base/environment';

const PYTHON_KEYWORDS = new Set(['and', 'or', 'not', 'if', 'in', 'is']);

// The OPENEO_PROCESS_NAMES contains the openEO processes as if they were used
// as bare: example max_, round_, if_. When using as part of the op. module,
// only names that are Python keywords (op.if_, op.and_) keep the
// underscore, therefore we must remove it from the others. max_ => op.max
export const OP_MEMBER_NAMES = OPENEO_PROCESS_NAMES.map((name) => {
  const base = name.replace(/_$/, '');
  return PYTHON_KEYWORDS.has(base) ? name : base;
});

const publicByName = new Map(
  PUBLIC_GLOBALS.map((global) => [global.name, global])
);

const globalOptions: Completion[] = LOADER_GLOBALS.map((label) => {
  const global = publicByName.get(label);
  return {
    label,
    type: global?.type === 'function' ? 'function' : 'variable',
    detail: global?.type,
    info: global?.description,
    // Rank the documented names above the internal ones.
    boost: global ? 1 : 0
  };
});

const opOptions: Completion[] = OP_MEMBER_NAMES.map((label) => ({
  label,
  type: 'function',
  detail: 'openEO process'
}));

export function openeoCompletionSource(
  context: CompletionContext
): CompletionResult | null {
  const member = context.matchBefore(/(?<![\w.])op\.\w*$/);
  if (member) {
    return { from: member.from + 3, options: opOptions, validFor: /^\w*$/ };
  }

  const word = context.matchBefore(/\w*$/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  // Attribute access on some other object: not a global.
  if (context.state.sliceDoc(word.from - 1, word.from) === '.') return null;
  return { from: word.from, options: globalOptions, validFor: /^\w*$/ };
}

/** Completes the code contract names: the globals and op.<process>. */
export const openeoCompletion = pythonLanguage.data.of({
  autocomplete: ifNotIn(
    ['String', 'FormattedString', 'Comment'],
    openeoCompletionSource
  )
});
