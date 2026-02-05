import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { lintGutter } from '@codemirror/lint';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { githubLight } from '@uiw/codemirror-theme-github';

import { EXAMPLE_CODE } from '$utils/code-runner';
import { ruffLinter } from './ruff-linter';

// Create a CodeEditor context.
const CodeEditorContext = createContext<{
  editor: EditorView | null;
  hasCodeChanged: boolean;
  setHasCodeChanged: (changed: boolean) => void;
}>({
  editor: null,
  hasCodeChanged: false,
  setHasCodeChanged: () => {}
});

export function useCodeEditor() {
  return useContext(CodeEditorContext).editor;
}

export function useHasCodeChanged() {
  const { hasCodeChanged, setHasCodeChanged } = useContext(CodeEditorContext);
  return { hasCodeChanged, setHasCodeChanged };
}

interface RootProps {
  children: React.ReactNode;
  initialCode?: string;
}

function Root({ children, initialCode = EXAMPLE_CODE }: RootProps) {
  const [editor, setEditor] = useState<EditorView | null>(null);
  const [hasCodeChanged, setHasCodeChanged] = useState(false);

  useEffect(() => {
    // Create update listener plugin to track changes
    const updateListener = ViewPlugin.fromClass(
      class {
        update(update: ViewUpdate) {
          if (update.docChanged) {
            setHasCodeChanged(true);
          }
        }
      }
    );

    const view = new EditorView({
      doc: initialCode,
      extensions: [
        basicSetup,
        EditorView.theme({
          '&': {
            height: '100%'
          },
          '&, .cm-scroller': {
            fontFamily: '"Fira Code"'
          },
          '.cm-content, .cm-line': {
            width: '100%'
          }
        }),
        EditorView.lineWrapping,
        githubLight,
        python(),
        closeBrackets(),
        autocompletion(),
        lintGutter(),
        ruffLinter(),
        updateListener
      ]
    });
    setEditor(view);

    return () => {
      view.destroy();
      setEditor(null);
    };
  }, []);

  return (
    <CodeEditorContext value={{ editor, hasCodeChanged, setHasCodeChanged }}>
      {children}
    </CodeEditorContext>
  );
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

export const CodeEditor = {
  Root,
  View
};
