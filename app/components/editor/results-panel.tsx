import {
  Button,
  Flex,
  Heading,
  Popover,
  Portal,
  Separator,
  Spinner,
  Stack,
  Tabs,
  Text
} from '@chakra-ui/react';
import {
  Suspense,
  lazy,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { useShallow } from 'zustand/shallow';
import { LuCodeXml, LuDownload, LuMap, LuWorkflow } from 'react-icons/lu';

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
  const { toggleServiceVisibility, setServiceOpacity, setBoundingBox } =
    useEditorStore();

  const [tileStatus, setTileStatus] = useState<TileLoadStatus>({
    pending: 0,
    status: 'idle'
  });
  const [shareService, setShareService] = useState<ServiceInfo | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  // Opened once the popover has closed: its focus return would dismiss a
  // dialog opened earlier.
  const pendingExport = useRef<ServiceInfo | null>(null);

  const mergedGraph = useMergedProcessGraph(services);

  useEffect(() => {
    if (services.length === 0 && tileStatus.status !== 'idle') {
      setTileStatus({ pending: 0, status: 'idle' });
    }
  }, [services.length, tileStatus.status]);

  return (
    <Stack gap={0} flexGrow={1} h='100%' position='relative' asChild>
      <Tabs.Root defaultValue='map' variant='subtle' size='sm' lazyMount>
        <Flex
          gap={4}
          alignItems='center'
          p={4}
          pr={4}
          bg='bg.subtle'
          flexShrink={0}
          overflowX='auto'
        >
          <Tabs.List gap={2} alignItems='center'>
            <Tabs.Trigger value='map'>
              <LuMap /> Map
            </Tabs.Trigger>
            <Tabs.Trigger value='visual'>
              <LuWorkflow /> Visual
            </Tabs.Trigger>
            <Tabs.Trigger value='json'>
              <LuCodeXml /> JSON{' '}
            </Tabs.Trigger>
          </Tabs.List>
          <Separator orientation='vertical' h={4} ml='auto' />
          <Popover.Root
            positioning={{ placement: 'bottom-end' }}
            open={exportOpen}
            lazyMount
            unmountOnExit
            onOpenChange={(details) => setExportOpen(details.open)}
            onExitComplete={() => {
              if (pendingExport.current) setShareService(pendingExport.current);
              pendingExport.current = null;
            }}
          >
            <Popover.Trigger asChild>
              <Button size='sm' variant='outline'>
                Export <LuDownload />
              </Button>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content w='xs' overflow='hidden' bg='bg.subtle'>
                  {/* Same height as the Layers header, which has a close button */}
                  <Flex align='center' py={2} px={4} minH={10}>
                    <Popover.Title fontWeight='bold'>Export</Popover.Title>
                  </Flex>
                  <Popover.Body
                    p={4}
                    bg='bg'
                    borderTopRadius='uni'
                    borderTop='1px solid'
                    borderColor='border'
                  >
                    <Stack gap={2}>
                      <Heading size='xs'>Services</Heading>
                      {services.length === 0 ? (
                        <Text fontSize='sm' color='fg.muted'>
                          Run your script to get layers to export.
                        </Text>
                      ) : (
                        services.map((service) => (
                          <Button
                            key={service.id}
                            size='sm'
                            variant='ghost'
                            justifyContent='start'
                            onClick={() => {
                              pendingExport.current = service;
                              setExportOpen(false);
                            }}
                          >
                            <Text truncate>{service.graphResult.name}</Text>
                          </Button>
                        ))
                      )}
                    </Stack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </Flex>
        <Stack
          flexGrow={1}
          borderTopRadius='uni'
          borderTop='1px solid'
          borderColor='border'
          overflow='hidden'
        >
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
                onOpacityChange={setServiceOpacity}
                onBoundingBoxChange={setBoundingBox}
                onTileStatusChange={setTileStatus}
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
        </Stack>
        {shareService && (
          <ShareDialog
            service={shareService}
            bounds={bounds}
            onClose={() => setShareService(null)}
          />
        )}
      </Tabs.Root>
    </Stack>
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
