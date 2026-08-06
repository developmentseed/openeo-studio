import { useEffect, useRef, useState } from 'react';
import { Code, Tabs, Text } from '@chakra-ui/react';
import { useShallow } from 'zustand/shallow';
import { useNavigate } from 'react-router';

import { useEditorStore } from '$stores/editor-store';
import { useAlertDialog } from '$components/common/use-alert-dialog';
import { useConfirmDialog } from '$components/common/use-confirm-dialog';
import { isSampleScene, shouldNavigateAfterSave } from '$config/sample-scenes';
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
  const navigate = useNavigate();
  const selectedConfig = useEditorStore(
    useShallow((state) => state.selectedConfig)
  );
  const { setSceneId, sceneId, isDirty, setServices } = useEditorStore();

  const editor = useCodeEditor();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { alert, dialog: alertDialog } = useAlertDialog();

  const [activeTab, setActiveTab] = useState<EditorTabId>(defaultTab);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const {
    createServices,
    saveProjectAndServices,
    isExecuting,
    isReady: isExecutionReady,
    errorMessage
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
    createServices();
  }, [autoExecuteOnReady, isExecutionReady, createServices]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (errorMessage) {
      setIsErrorDismissed(false);
    }
  }, [errorMessage]);

  const navigateAfterSaveIfNeeded = (id: string) => {
    if (!shouldNavigateAfterSave(sceneId)) return;
    setSceneId(id);
    navigate(`/editor/${id}`, { replace: true });
  };

  const handleSaveClick = async () => {
    if (isSampleScene(sceneId)) {
      const confirmed = await confirm({
        title: 'Save to your account',
        body: (
          <Text fontSize='sm' color='fg.muted'>
            This is a sample project and is not on your account yet. Saving will
            add it as a project you can reopen later.
          </Text>
        ),
        confirmLabel: 'Save',
        cancelLabel: 'Cancel'
      });
      if (!confirmed) return;
    }

    const result = await saveProjectAndServices();
    if (result.status === 'no-graph') {
      await alert({
        title: 'Nothing to save',
        body: (
          <Text fontSize='sm' color='fg.muted' whiteSpace='pre-wrap'>
            Your code did not produce any layers to save.
            <br />
            Review your code and add a layer using{' '}
            <Code>add_graph_to_map(graph, name)</Code>.
          </Text>
        ),
        okLabel: 'Got it'
      });
      return;
    }
    if (result.status === 'saved') {
      navigateAfterSaveIfNeeded(result.id);
    }
  };

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
        onExecuteClick={handleSaveClick}
        isExecuting={isExecuting}
        isReady={isExecutionReady}
        hasPendingChanges={isDirty}
        onDeleteClick={onDeleteClick}
        isDeleteBusy={isDeleteBusy}
        isDeleteDisabled={isDeleteDisabled || isSampleScene(sceneId)}
      />

      <Tabs.Content value='configuration' flex={1} overflow='auto' p={4}>
        <ConfigurationTab />
      </Tabs.Content>

      <Tabs.Content
        value='code'
        flex={1}
        display='flex'
        flexDirection='column'
        p={0}
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

      {confirmDialog}
      {alertDialog}
    </Tabs.Root>
  );
}
