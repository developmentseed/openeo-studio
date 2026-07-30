import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { lintGutter } from '@codemirror/lint';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';

import { ruffLinter } from './ruff-linter';
import { useColorModeValue } from '$utils/color-mode';

interface ReadOnlyCodeEditorProps {
  code: string;
}

const themeCompartment = new Compartment();

export function ReadOnlyCodeEditor({ code }: ReadOnlyCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const themeColorMode = useColorModeValue(githubLight, githubDark);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      doc: code,
      extensions: [
        basicSetup,
        EditorView.editable.of(false),
        EditorView.theme({
          '&': {
            height: '100%'
          },
          '&, .cm-scroller': {
            fontFamily: '"Fira Code"',
            fontSize: 'small'
          },
          '.cm-content, .cm-line': {
            width: '100%',
            backgroundColor: 'var(--chakra-colors-bg-subtle)'
          },
          '.cm-gutters': {
            backgroundColor: 'var(--chakra-colors-bg-subtle)'
          }
        }),
        EditorView.lineWrapping,
        themeCompartment.of(themeColorMode),
        python(),
        closeBrackets(),
        autocompletion(),
        lintGutter(),
        ruffLinter({ ignoreCodes: ['F401'] })
      ]
    });

    editorViewRef.current = view;
    editorRef.current.appendChild(view.dom);

    return () => {
      if (editorRef.current && view.dom.parentElement === editorRef.current) {
        editorRef.current.removeChild(view.dom);
      }
      view.destroy();
      editorViewRef.current = null;
    };
  }, [code]);

  // Sync editor theme with color mode changes
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.reconfigure(themeColorMode)
    });
  }, [themeColorMode]);

  return (
    <div
      ref={editorRef}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'auto'
      }}
    />
  );
}
