import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { lintGutter } from '@codemirror/lint';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark';

import { EXAMPLE_CODE } from '$utils/code-runner';
import { ruffLinter } from './ruff-linter';

// Create a CodeEditor context.
const CodeEditorContext = createContext<{
  editor: EditorView | null;
}>({
  editor: null
});

export function useCodeEditor() {
  return useContext(CodeEditorContext).editor;
}

interface RootProps {
  children: React.ReactNode;
  initialCode?: string;
}

function Root({ children, initialCode = EXAMPLE_CODE }: RootProps) {
  const [editor, setEditor] = useState<EditorView | null>(null);

  useEffect(() => {
    const view = new EditorView({
      doc: initialCode,
      extensions: [
        basicSetup,
        EditorView.theme({
          '&, .cm-scroller': {
            fontFamily: '"Fira Code"'
          }
        }),
        vsCodeDark,
        python(),
        closeBrackets(),
        autocompletion(),
        lintGutter(),
        ruffLinter()
      ]
    });
    setEditor(view);

    return () => {
      view.destroy();
      setEditor(null);
    };
  }, []);

  return <CodeEditorContext value={{ editor }}>{children}</CodeEditorContext>;
}

function View() {
  const editorRef = useRef<HTMLDivElement>(null);
  const editor = useCodeEditor();

  useEffect(() => {
    if (editor && editorRef.current) {
      editorRef.current.appendChild(editor.dom);

      return () => {
        editorRef.current?.removeChild(editor.dom);
      };
    }
  }, [editor]);

  return <div ref={editorRef} />;
}

export const CodeEditor = {
  Root,
  View
};
