import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { Compartment, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';

import { useColorModeValue } from '$contexts/color-mode';

type EditorLanguage = 'python' | 'json';

interface ReadOnlyCodeEditorProps {
  code: string;
  language?: EditorLanguage;
}

const themeCompartment = new Compartment();

// Python gets the ruff linter; JSON is highlighted without any linting so a
// process graph does not get flagged as invalid Python.
function languageExtensions(language: EditorLanguage): Extension[] {
  if (language === 'json') {
    return [json()];
  }
  return [python()];
}

export function ReadOnlyCodeEditor({
  code,
  language = 'python'
}: ReadOnlyCodeEditorProps) {
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
            fontFamily: '"Fira Code"'
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
        closeBrackets(),
        autocompletion(),
        ...languageExtensions(language)
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
  }, [code, language]);

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
