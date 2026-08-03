import { Flex, Stack, Tabs, Text } from '@chakra-ui/react';
import { useEffect, useMemo, useState, memo } from 'react';
import { useShallow } from 'zustand/shallow';

import type { ServiceInfo } from '$types';
import { useEditorStore } from '$stores/editor-store';
import { mergeProcessGraphs } from '$utils/process-graphs';
import { MapViewer } from '$components/map/map-viewer';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';
import { ShareDialog } from '$components/map/share-dialog';
import { ReadOnlyCodeEditor } from '$components/editor/readonly-code-editor';
import { LuCodeXml } from 'react-icons/lu';

function MapPanelComponent() {
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

  useEffect(() => {
    if (services.length === 0 && tileStatus.status !== 'idle') {
      setTileStatus({ pending: 0, status: 'idle' });
    }
  }, [services.length, tileStatus.status]);

  return (
    <Flex flexGrow={1} h='100%' position='relative'>
      <Tabs.Root defaultValue='map' variant='enclosed' w='100%'>
        <Tabs.List
          className='chakra-theme dark'
          colorPalette='neutral'
          colorScheme='dark'
          position='absolute'
          top={4}
          right={4}
          zIndex={9999}
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
        <Tabs.Content value='json' display='flex' h='100%' p={0}>
          <OutputJson services={services} />
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

export const MapPanel = memo(MapPanelComponent);

function OutputJson({ services }: { services: ServiceInfo[] }) {
  const mergedGraphJson = useMemo(() => {
    if (services.length === 0) return null;
    try {
      const merged = mergeProcessGraphs(
        services.map((service) => service.graphResult.process_graph)
      );
      return JSON.stringify(merged, null, 2);
    } catch {
      return null;
    }
  }, [services]);

  return mergedGraphJson ? (
    <ReadOnlyCodeEditor code={mergedGraphJson} language='json' />
  ) : (
    <Stack flexGrow={1} align='center' justify='center' p={8} gap={4}>
      <LuCodeXml size='4rem' />
      <Text color='fg' textAlign='center'>
        There is no output to display.
        <br />
        Save your project to see the process graph.
      </Text>
    </Stack>
  );
}
