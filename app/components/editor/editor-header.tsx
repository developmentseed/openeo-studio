import { Flex, Heading, Separator, Tabs } from '@chakra-ui/react';
import { LuCode, LuSettings2, LuSparkle } from 'react-icons/lu';
import { useAuth } from 'react-oidc-context';

import { EditorExecute } from '$components/editor/editor-execute';
import { EditorOptionsMenu } from '$components/editor/editor-options-menu';
import { useEditorStore } from '$stores/editor-store';

export interface EditorHeaderProps {
  onExecuteClick: () => void;
  isExecuting: boolean;
  isReady: boolean;
  hasPendingChanges: boolean;
  onDeleteClick: () => void;
  isDeleteBusy: boolean;
  isDeleteDisabled: boolean;
}

export function EditorHeader({
  onExecuteClick,
  isExecuting,
  isReady,
  hasPendingChanges,
  onDeleteClick,
  isDeleteBusy,
  isDeleteDisabled
}: EditorHeaderProps) {
  const sceneName = useEditorStore((state) => state.sceneName);
  const { isAuthenticated } = useAuth();

  const isExecuteDisabled =
    !isReady ||
    isExecuting ||
    !isAuthenticated ||
    !sceneName.trim() ||
    !hasPendingChanges;

  return (
    <Flex
      gap={4}
      justifyContent='space-between'
      alignItems='center'
      p={4}
      bg='bg.subtle'
      overflowX='auto'
      flexShrink={0}
    >
      <Heading size='md' minW='5rem' truncate>
        {sceneName}
      </Heading>

      <Tabs.List gap={2} alignItems='center'>
        <Tabs.Trigger value='configuration'>
          <LuSettings2 /> Configuration
        </Tabs.Trigger>
        <Tabs.Trigger value='code'>
          <LuCode /> Python
        </Tabs.Trigger>
        <Separator orientation='vertical' h={4} />
        <Tabs.Trigger value='assistant'>
          <LuSparkle /> Assistant
        </Tabs.Trigger>
        <EditorOptionsMenu
          onDeleteClick={onDeleteClick}
          isDeleteDisabled={isDeleteDisabled}
          isDeleteLoading={isDeleteBusy}
        />
        <EditorExecute
          onExecuteClick={onExecuteClick}
          isLoading={isExecuting}
          disabled={isExecuteDisabled}
          hasPendingChanges={hasPendingChanges}
        />
      </Tabs.List>
    </Flex>
  );
}
