import { EditorView } from '@codemirror/view';
import { Compartment, type Extension } from '@codemirror/state';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';

/** Shared Fira Code theme used by editable and read-only CodeMirror views. */
export function firaCodeTheme(
  overrides: Record<string, Record<string, string>> = {}
): Extension {
  return EditorView.theme({
    '&': {
      height: '100%'
    },
    '&, .cm-scroller': {
      fontFamily: '"Fira Code"'
    },
    '.cm-content, .cm-line': {
      width: '100%'
    },
    ...overrides
  });
}

export function createThemeCompartment() {
  return new Compartment();
}

export { githubDark, githubLight };
