import { Flex, Spinner, Stack, Tabs, Text } from '@chakra-ui/react';
import {
  Suspense,
  lazy,
  memo,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useShallow } from 'zustand/shallow';
import { LuCodeXml, LuWorkflow } from 'react-icons/lu';

import type { ServiceInfo } from '$types';
import type { ProcessGraph } from '$types/openeo-process';
import { useEditorStore } from '$stores/editor-store';
import { MapViewer } from '$components/map/map-viewer';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';
import { ShareDialog } from '$components/map/share-dialog';
import { ReadOnlyCodeEditor } from '$components/editor/readonly-code-editor';

import { useMergedProcessGraph } from './use-merged-process-graph';

// React Flow and dagre are only ever needed by the visual tab.
const ProcessGraphViewer = lazy(() =>
  import('$components/process-graph').then((m) => ({
    default: m.ProcessGraphViewer
  }))
);

function ResultsPanelComponent() {
  const { bounds, sceneId, services } = useEditorStore(
    useShallow((state) => ({
      bounds: state.selectedConfig.boundingBox,
      sceneId: state.sceneId,
      services: state.services
    }))
  );
  const { toggleServiceVisibility, setBoundingBox } = useEditorStore();

  const [tileStatus, setTileStatus] = useState<TileLoadStatus>({
    pending: 0,
    status: 'idle'
  });
  const [shareService, setShareService] = useState<ServiceInfo | null>(null);

  const mergedGraph = useMergedProcessGraph(services);

  useEffect(() => {
    if (services.length === 0 && tileStatus.status !== 'idle') {
      setTileStatus({ pending: 0, status: 'idle' });
    }
  }, [services.length, tileStatus.status]);

  return (
    <Flex flexGrow={1} h='100%' position='relative'>
      <Tabs.Root defaultValue='map' variant='enclosed' w='100%' lazyMount>
        <Tabs.List
          className='chakra-theme dark'
          colorPalette='neutral'
          colorScheme='dark'
          position='absolute'
          top={4}
          right={4}
          zIndex={1}
        >
          <Tabs.Trigger value='map'>Map</Tabs.Trigger>
          <Tabs.Trigger value='visual'>Visual</Tabs.Trigger>
          <Tabs.Trigger value='json'>JSON </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value='map' display='flex' h='100%' p={0}>
          <Flex
            flexGrow={1}
            css={{
              '& .maplibregl-canvas-container': {
                position: 'relative',
                h: '100%',
                borderRadius: 'uni',
                overflow: 'hidden'
              }
            }}
          >
            <MapViewer
              bounds={bounds}
              sceneId={sceneId}
              services={services}
              onToggleLayer={toggleServiceVisibility}
              onBoundingBoxChange={setBoundingBox}
              onTileStatusChange={setTileStatus}
              onServicePublish={setShareService}
            />
          </Flex>
          {services.length > 0 && <TileStatusAlert status={tileStatus} />}
        </Tabs.Content>
        <Tabs.Content value='visual' display='flex' h='100%' p={0}>
          <OutputVisual graph={mergedGraph} />
        </Tabs.Content>
        <Tabs.Content value='json' display='flex' h='100%' p={0}>
          <OutputJson graph={mergedGraph} />
        </Tabs.Content>
      </Tabs.Root>
      {shareService && (
        <ShareDialog
          service={shareService}
          bounds={bounds}
          onClose={() => setShareService(null)}
        />
      )}
    </Flex>
  );
}

export const ResultsPanel = memo(ResultsPanelComponent);

function NoOutput({ icon, hint }: { icon: ReactNode; hint: string }) {
  return (
    <Stack flexGrow={1} align='center' justify='center' p={8} gap={4}>
      {icon}
      <Text color='fg' textAlign='center'>
        There is nothing to display.
        <br />
        {hint}
      </Text>
    </Stack>
  );
}

function OutputVisual({ graph }: { graph: ProcessGraph | null }) {
  if (!graph) {
    return (
      <NoOutput
        icon={<LuWorkflow size='4rem' />}
        hint='Save your project to see the process graph.'
      />
    );
  }

  return (
    <Suspense
      fallback={
        <Flex flexGrow={1} align='center' justify='center'>
          <Spinner size='lg' />
        </Flex>
      }
    >
      <ProcessGraphViewer graph={graph} />
    </Suspense>
  );
}

function OutputJson({ graph }: { graph: ProcessGraph | null }) {
  const graphJson = useMemo(
    () => (graph ? JSON.stringify(graph, null, 2) : null),
    [graph]
  );

  return graphJson ? (
    <ReadOnlyCodeEditor code={graphJson} language='json' />
  ) : (
    <NoOutput
      icon={<LuCodeXml size='4rem' />}
      hint='Save your project to see the process graph.'
    />
  );
}
