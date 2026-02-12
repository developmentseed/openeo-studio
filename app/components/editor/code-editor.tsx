import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { lintGutter } from '@codemirror/lint';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { githubLight } from '@uiw/codemirror-theme-github';

import { EXAMPLE_CODE } from '$utils/code-runner';
import { useEditorStore } from '$stores/editor-store';
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

  const code = useEditorStore((state) => state.code);
  const { setCode, setHasCodeChanged } = useEditorStore();

  const initialDocRef = useRef<string | null>(null);
  if (initialDocRef.current === null) {
    initialDocRef.current = code || initialCode;
  }

  useEffect(() => {
    const initialDoc = initialDocRef.current || '';
    // Create update listener plugin to track changes with debouncing
    const updateListener = ViewPlugin.fromClass(
      class {
        debounceTimer: NodeJS.Timeout | null = null;
        destroyed = false;

        update(update: ViewUpdate) {
          if (this.destroyed || !update.docChanged) return;

          const newCode = update.state.doc.toString();

          // Clear previous timer
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }

          // Debounce the setCode call (300ms)
          this.debounceTimer = setTimeout(() => {
            if (!this.destroyed) {
              setCode(newCode);
            }
            this.debounceTimer = null;
          }, 300);
        }

        destroy() {
          this.destroyed = true;
          // Clean up timer on plugin destroy
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }
        }
      }
    );

    const view = new EditorView({
      doc: initialDoc,
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

    if (!code && initialDoc) {
      setCode(initialDoc);
      setHasCodeChanged(false);
    }

    return () => {
      view.destroy();
      setEditor(null);
    };
  }, [setCode, setHasCodeChanged]);

  // Sync external code changes to editor (e.g. from scene hydration)
  useEffect(() => {
    if (!editor) return;
    const currentCode = editor.state.doc.toString();
    if (code === currentCode) return;
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: code
      }
    });
  }, [code, editor]);

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
