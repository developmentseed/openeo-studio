import { useEffect, useRef, useState } from 'react';
import { Tabs } from '@chakra-ui/react';
import { useShallow } from 'zustand/shallow';

import { useEditorStore } from '$stores/editor-store';
import { useCodeEditor } from './code-editor';
import { useCodeExecution } from './use-code-execution';
import { ConfigurationTab } from './configuration-tab';
import { CodeTab } from './code-tab';
import { AssistantTab } from './assistant-tab';
import { ExecutionErrorAlert } from './execution-error-alert';
import { EditorHeader } from './editor-header';

export type EditorTabId = 'configuration' | 'code' | 'assistant';

interface EditorWorkspaceProps {
  defaultTab: EditorTabId;
  autoExecuteOnReady?: boolean;
}

function isEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function EditorWorkspace({
  defaultTab,
  autoExecuteOnReady = false
}: EditorWorkspaceProps) {
  const selectedConfig = useEditorStore(
    useShallow((state) => state.selectedConfig)
  );
  const previousConfig = useEditorStore(
    useShallow((state) => state.previousConfig)
  );
  const { setServices } = useEditorStore();

  const hasConfigChanged = !isEqual(
    [
      selectedConfig.collectionId,
      selectedConfig.cloudCover,
      selectedConfig.temporalRange,
      selectedConfig.selectedBands,
      selectedConfig.boundingBox
    ],
    [
      previousConfig.collectionId,
      previousConfig.cloudCover,
      previousConfig.temporalRange,
      previousConfig.selectedBands,
      previousConfig.boundingBox
    ]
  );

  const editor = useCodeEditor();

  const [activeTab, setActiveTab] = useState<EditorTabId>(defaultTab);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const {
    executeCode,
    isExecuting,
    isReady: isExecutionReady,
    errorMessage,
    hasCodeChanged
  } = useCodeExecution(setServices, editor, selectedConfig);

  const hasAutoExecutedRef = useRef(false);
  useEffect(() => {
    if (!autoExecuteOnReady) return;
    if (hasAutoExecutedRef.current) return;
    if (!isExecutionReady) return;

    hasAutoExecutedRef.current = true;
    executeCode();
  }, [autoExecuteOnReady, isExecutionReady, executeCode]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (errorMessage) {
      setIsErrorDismissed(false);
    }
  }, [errorMessage]);

  return (
    <Tabs.Root
      variant='subtle'
      size='sm'
      display='flex'
      flex={1}
      flexDirection='column'
      minHeight={0}
      minW={0}
      position='relative'
      value={activeTab}
      onValueChange={({ value }) => setActiveTab(value as EditorTabId)}
    >
      <EditorHeader
        executeCode={executeCode}
        isExecuting={isExecuting}
        isReady={isExecutionReady}
        hasCodeChanged={hasCodeChanged}
        hasConfigChanged={hasConfigChanged}
      />

      <Tabs.Content value='configuration' flex={1} overflow='auto' p={4}>
        <ConfigurationTab />
      </Tabs.Content>

      <Tabs.Content
        value='code'
        flex={1}
        display='flex'
        flexDirection='column'
        px={4}
        py={0}
        minHeight={0}
        overflow='hidden'
      >
        <CodeTab />
      </Tabs.Content>

      <Tabs.Content value='assistant' flex={1} overflow='auto' p={4}>
        <AssistantTab />
      </Tabs.Content>

      {errorMessage && !isErrorDismissed && (
        <ExecutionErrorAlert
          message={errorMessage}
          onDismiss={() => setIsErrorDismissed(true)}
        />
      )}
    </Tabs.Root>
  );
}
