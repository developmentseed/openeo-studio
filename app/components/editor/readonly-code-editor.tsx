import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { lintGutter } from '@codemirror/lint';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { githubLight } from '@uiw/codemirror-theme-github';

import { ruffLinter } from './ruff-linter';

interface ReadOnlyCodeEditorProps {
  code: string;
}

export function ReadOnlyCodeEditor({ code }: ReadOnlyCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

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
        githubLight,
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
