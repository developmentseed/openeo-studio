import { useEffect, useMemo, useRef, useState } from 'react';
import { Code, Stack, Tabs, Text } from '@chakra-ui/react';
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
import { AssistantTab, type AskAssistant } from './assistant-tab';
import { appConfig } from '$config/runtime';
import { ExecutionErrorAlert } from './execution-error-alert';
import { EditorHeader } from './editor-header';
import { useDeleteProject } from './use-delete-project';
import { useCollectionQueryables } from './use-collection-queryables';

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
  const { setSceneId, sceneId, isDirty, setServices, setPropertyFilters } =
    useEditorStore();

  // Drop the filters on properties that are not queryables of the
  // collection: the STAC API would remove every item. Execution uses the
  // valid filters directly, so it does not depend on the store update.
  const { queryables, isLoading: isQueryablesLoading } =
    useCollectionQueryables(selectedConfig.collectionId);
  const executionConfig = useMemo(() => {
    const propertyFilters = selectedConfig.propertyFilters ?? [];
    if (!queryables) return selectedConfig;
    const validFilters = propertyFilters.filter(
      (filter) => filter.property in queryables
    );
    return validFilters.length === propertyFilters.length
      ? selectedConfig
      : { ...selectedConfig, propertyFilters: validFilters };
  }, [queryables, selectedConfig]);
  useEffect(() => {
    if (executionConfig !== selectedConfig) {
      setPropertyFilters(executionConfig.propertyFilters);
    }
  }, [executionConfig, selectedConfig, setPropertyFilters]);

  const editor = useCodeEditor();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { alert, dialog: alertDialog } = useAlertDialog();

  const [activeTab, setActiveTab] = useState<EditorTabId>(defaultTab);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [ask, setAsk] = useState<AskAssistant>();
  // Set when the assistant's change is accepted; the save waits for the render that carries the
  // accepted configuration, which the execution hook reads from props.
  const [saveAfterAccept, setSaveAfterAccept] = useState(false);
  const {
    createServices,
    saveProjectAndServices,
    isExecuting,
    isReady: isRuntimeReady,
    errorMessage
  } = useCodeExecution(setServices, editor, executionConfig);
  // Wait for the queryables: a run must not use unsupported filters.
  const isExecutionReady = isRuntimeReady && !isQueryablesLoading;

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
    // The route first. The blank page resets the store when it sees an id
    // there, so an id arriving before the route moves would be taken as a
    // return to the blank project.
    navigate(`/editor/${id}`, { replace: true });
    setSceneId(id);
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

  useEffect(() => {
    // Saving runs the code first: wait until it can run.
    if (!saveAfterAccept || !isRuntimeReady || isExecuting) return;
    setSaveAfterAccept(false);
    handleSaveClick();
  }, [saveAfterAccept, isRuntimeReady, isExecuting]);

  return (
    <Stack
      gap={0}
      flexGrow={1}
      h='100%'
      position='relative'
      minW={0}
      minH={0}
      asChild
    >
      <Tabs.Root
        variant='subtle'
        size='sm'
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
        <Stack
          flexGrow={1}
          borderTopRadius='uni'
          borderTop='1px solid'
          borderColor='border'
          overflow='hidden'
        >
          <Tabs.Content
            value='configuration'
            flex={1}
            overflow='auto'
            p={4}
            bg='bg'
          >
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

          <Tabs.Content
            value='assistant'
            flex={1}
            overflow='auto'
            p={4}
            bg='bg'
          >
            <AssistantTab
              ask={ask}
              onAccepted={() => setSaveAfterAccept(true)}
            />
          </Tabs.Content>
        </Stack>

        {errorMessage && !isErrorDismissed && (
          <ExecutionErrorAlert
            message={errorMessage}
            onDismiss={() => setIsErrorDismissed(true)}
            onAsk={
              appConfig.agentUrl
                ? () => {
                    setAsk({
                      text: `My code failed to run. Why, and how do I fix it?\n\n${useEditorStore.getState().lastRun?.error ?? errorMessage}`,
                      at: Date.now()
                    });
                    setActiveTab('assistant');
                    setIsErrorDismissed(true);
                  }
                : undefined
            }
          />
        )}

        {confirmDialog}
        {alertDialog}
      </Tabs.Root>
    </Stack>
  );
}
