import { Flex, Heading, Separator, Tabs } from '@chakra-ui/react';
import { LuCode, LuSettings2, LuSparkle } from 'react-icons/lu';

import { EditorExecute } from '$components/editor/editor-execute';
import { useEditorStore } from '$stores/editor-store';

export interface EditorHeaderProps {
  executeCode: () => Promise<void>;
  isExecuting: boolean;
  isReady: boolean;
  hasCodeChanged: boolean;
  hasConfigChanged: boolean;
}

export function EditorHeader({
  executeCode,
  isExecuting,
  isReady,
  hasCodeChanged,
  hasConfigChanged
}: EditorHeaderProps) {
  const sceneName = useEditorStore((state) => state.sceneName);

  return (
    <Flex
      gap={4}
      justifyContent='space-between'
      alignItems='center'
      p={4}
      bg='white'
      borderBottomWidth='1px'
      borderColor='neutral.200'
      overflowX='auto'
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
        <EditorExecute
          executeCode={executeCode}
          isExecuting={isExecuting}
          isReady={isReady}
          hasCodeChanged={hasCodeChanged}
          hasConfigChanged={hasConfigChanged}
        />
      </Tabs.List>
    </Flex>
  );
}
