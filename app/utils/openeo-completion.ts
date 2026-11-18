import {
  Completion,
  CompletionContext,
  CompletionResult,
  ifNotIn
} from '@codemirror/autocomplete';
import { pythonLanguage } from '@codemirror/lang-python';

import {
  LOADER_GLOBALS,
  OP_MEMBER_NAMES,
  PUBLIC_GLOBALS
} from '../algorithms/base/environment';
import { processDocInfo } from './openeo-docs';

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
  detail: 'openEO process',
  info: () => processDocInfo(label)
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
