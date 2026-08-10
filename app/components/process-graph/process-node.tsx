import { memo } from 'react';
import { Box, Flex, Popover, Portal, Text } from '@chakra-ui/react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { LuCheck, LuMaximize2, LuX } from 'react-icons/lu';

import type { ArgumentView, ProcessNodeView } from './graph-model';
import { NODE_WIDTH } from './layout';

export type ProcessNodeData = ProcessNodeView & {
  onOpenSubgraph: (arg: ArgumentView) => void;
} & Record<string, unknown>;

export type ProcessNodeType = Node<ProcessNodeData, 'process'>;

/** Row value whose untruncated JSON is available in a popover. */
function ExpandableValue({ arg }: { arg: ArgumentView }) {
  return (
    <Popover.Root positioning={{ placement: 'right-start' }}>
      <Popover.Trigger asChild>
        <Text
          as='button'
          className='nodrag'
          fontSize='xs'
          color='fg.muted'
          textDecoration='underline'
          textDecorationStyle='dotted'
          truncate
        >
          {arg.display}
        </Text>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW='sm'>
            <Popover.Arrow />
            <Popover.Body>
              <Text fontSize='md' fontWeight='semibold' mb={1}>
                {arg.name}
              </Text>
              <Box
                as='pre'
                fontFamily='mono'
                fontSize='sm'
                whiteSpace='pre-wrap'
                wordBreak='break-word'
                maxH='16rem'
                overflow='auto'
              >
                {arg.full}
              </Box>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

function ArgumentRow({
  arg,
  onOpenSubgraph
}: {
  arg: ArgumentView;
  onOpenSubgraph: (arg: ArgumentView) => void;
}) {
  return (
    <Flex
      justifyContent='space-between'
      alignItems='center'
      gap={2}
      px={2}
      py={0.5}
      minW={0}
    >
      <Flex alignItems='center' gap={1} minW={0}>
        {arg.wired && (
          <Box
            boxSize={1.5}
            borderRadius='full'
            bg='fg.muted'
            flexShrink={0}
            aria-hidden
          />
        )}
        <Text fontSize='xs' truncate>
          {arg.name}
        </Text>
      </Flex>

      {arg.kind === 'subgraph' && arg.subgraph && (
        <Text
          as='button'
          className='nodrag'
          fontSize='2xs'
          fontWeight='semibold'
          bg='primary.solid'
          color='primary.contrast'
          borderRadius='full'
          px={2}
          flexShrink={0}
          display='inline-flex'
          alignItems='center'
          gap={1}
          onClick={() => onOpenSubgraph(arg)}
        >
          <LuMaximize2 /> {arg.subgraph.nodeCount}{' '}
          {arg.subgraph.nodeCount === 1 ? 'node' : 'nodes'}
        </Text>
      )}

      {arg.kind !== 'subgraph' &&
        (arg.glyph || arg.display !== '') &&
        (arg.glyph ? (
          <Box
            as='span'
            color='fg.muted'
            flexShrink={0}
            aria-label={arg.display}
            title={arg.display}
          >
            {arg.glyph === 'check' ? <LuCheck size={16} /> : <LuX size={16} />}
          </Box>
        ) : arg.full ? (
          <ExpandableValue arg={arg} />
        ) : (
          <Text fontSize='xs' color='fg.muted' truncate>
            {arg.display}
          </Text>
        ))}
    </Flex>
  );
}

function borderColorFor(data: ProcessNodeData, selected?: boolean): string {
  if (selected) return 'primary.solid';
  if (data.isCollection) return 'primary.emphasized';
  if (data.isResult) return 'success.solid';
  return 'border.emphasized';
}

function ProcessNodeComponent({ data, selected }: NodeProps<ProcessNodeType>) {
  const wired = data.args.filter((arg) => arg.wired);

  return (
    <Box
      w={`${NODE_WIDTH}px`}
      bg='bg.panel'
      borderWidth='2px'
      borderRadius='sm'
      borderColor={borderColorFor(data, selected)}
      overflow='hidden'
      fontFamily='body'
    >
      {wired.map((arg, index) => (
        <Handle
          key={arg.name}
          type='target'
          position={Position.Top}
          id={arg.name}
          style={{ left: `${((index + 1) / (wired.length + 1)) * 100}%` }}
        />
      ))}

      <Flex
        bg={data.isCollection ? 'primary.subtle' : 'bg.emphasized'}
        px={2}
        py={1}
        gap={1}
        justifyContent='space-between'
        alignItems='baseline'
      >
        <Text fontSize='xs' fontWeight='bold' truncate>
          {data.title}
          {data.namespace ? `@${data.namespace}` : ''}
        </Text>
        <Text fontSize='2xs' color='fg.subtle' flexShrink={0}>
          {data.id}
        </Text>
      </Flex>

      {data.args.map((arg) => (
        <ArgumentRow
          key={arg.name}
          arg={arg}
          onOpenSubgraph={data.onOpenSubgraph}
        />
      ))}

      {data.description && (
        <Text
          fontSize='2xs'
          color='fg.muted'
          px={2}
          py={1}
          borderTopWidth='1px'
          borderColor='border.muted'
        >
          {data.description}
        </Text>
      )}

      <Flex
        justifyContent='flex-end'
        px={2}
        py='2px'
        borderTopWidth='1px'
        borderColor='border.muted'
      >
        <Text fontSize='2xs' color='fg.subtle'>
          {data.isResult ? 'Result' : 'output'}
        </Text>
      </Flex>

      {!data.isResult && (
        <Handle type='source' position={Position.Bottom} id='output' />
      )}
    </Box>
  );
}

export const ProcessNode = memo(ProcessNodeComponent);

/**
 * Passed to ReactFlow as `nodeTypes`. Declared at module scope because React
 * Flow warns when the object identity changes between renders.
 */
export const NODE_TYPES = { process: ProcessNode };
