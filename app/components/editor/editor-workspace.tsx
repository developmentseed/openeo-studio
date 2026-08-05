import { useEffect, useRef, useState } from 'react';
import { Code, Tabs, Text } from '@chakra-ui/react';
import { useShallow } from 'zustand/shallow';

import { useEditorStore } from '$stores/editor-store';
import { InfoDialog } from '$components/common/info-dialog';
import { useCodeEditor } from './code-editor';
import { useCodeExecution } from './use-code-execution';
import { ConfigurationTab } from './configuration-tab';
import { CodeTab } from './code-tab';
import { AssistantTab } from './assistant-tab';
import { ExecutionErrorAlert } from './execution-error-alert';
import { EditorHeader } from './editor-header';
import { useDeleteProject } from './use-delete-project';

export type EditorTabId = 'configuration' | 'code' | 'assistant';

interface EditorWorkspaceProps {
  defaultTab: EditorTabId;
  autoExecuteOnReady?: boolean;
}

export function EditorWorkspace({
  defaultTab,
  autoExecuteOnReady = false
}: EditorWorkspaceProps) {
  const selectedConfig = useEditorStore(
    useShallow((state) => state.selectedConfig)
  );
  const isDirty = useEditorStore((state) => state.isDirty);
  const { setServices } = useEditorStore();

  const editor = useCodeEditor();

  const [activeTab, setActiveTab] = useState<EditorTabId>(defaultTab);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const {
    executeCode,
    isExecuting,
    isReady: isExecutionReady,
    errorMessage,
    showNoGraphNotice,
    dismissNoGraphNotice
  } = useCodeExecution(setServices, editor, selectedConfig);

  const {
    onDeleteClick,
    isBusy: isDeleteBusy,
    disabled: isDeleteDisabled
  } = useDeleteProject();

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
        onExecuteClick={executeCode}
        isExecuting={isExecuting}
        isReady={isExecutionReady}
        hasPendingChanges={isDirty}
        onDeleteClick={onDeleteClick}
        isDeleteBusy={isDeleteBusy}
        isDeleteDisabled={isDeleteDisabled}
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

      <InfoDialog
        open={showNoGraphNotice}
        title='Nothing to save'
        okLabel='Got it'
        onClose={dismissNoGraphNotice}
      >
        <Text fontSize='sm' color='fg.muted' whiteSpace='pre-wrap'>
          Your code did not produce any layers to save.
          <br />
          Review your code and add a layer using{' '}
          <Code>add_graph_to_map(graph, name)</Code>.
        </Text>
      </InfoDialog>
    </Tabs.Root>
  );
}
