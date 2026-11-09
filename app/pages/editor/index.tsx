import { useEffect, useMemo, useRef, useState } from 'react';
import { Flex, Spinner, Splitter } from '@chakra-ui/react';
import { useCollection } from '@developmentseed/stac-react';
import { useLocation, useParams, useSearchParams } from 'react-router';
import { StacCollection } from 'stac-ts';
import { useShallow } from 'zustand/shallow';

import { ResultsPanel } from '$components/editor/results-panel';
import { EditorWorkspace } from '$components/editor/editor-workspace';
import { useLoadProject } from '$components/editor/use-load-project';
import { CodeEditor } from '$components/editor/code-editor';
import { useOpenEntry } from '$components/catalogue/use-open-entry';
import { useEditorStore } from '$stores/editor-store';
import {
  IncompatibleProjectError,
  isNotFound
} from '$utils/catalogue/catalogue';
import { linkFromParams } from '$utils/catalogue/links';
import { NotFound } from '$utils/errors';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const link = useMemo(() => linkFromParams(searchParams), [searchParams]);

  const { collectionId, temporalRange, code, autoRun, contentVersion } =
    useEditorStore(
      useShallow((state) => ({
        collectionId: state.selectedConfig.collectionId,
        temporalRange: state.selectedConfig.temporalRange,
        code: state.code,
        autoRun: state.autoRun,
        contentVersion: state.contentVersion
      }))
    );

  // Actions don't cause re-renders
  const { setDefaultTemporalRange } = useEditorStore();

  // A link (?sample_id=, ?project_url=) loads once, then the URL becomes
  // /editor.
  const { openEntry, dialog: openEntryDialog } = useOpenEntry();
  const [isOpeningLink, setIsOpeningLink] = useState(!!link);
  const openedLinkRef = useRef<string | null>(null);
  useEffect(() => {
    if (!link) return;
    const linkKey = `${link.loader}:${link.ref}`;
    if (openedLinkRef.current === linkKey) return;
    openedLinkRef.current = linkKey;
    setIsOpeningLink(true);
    openEntry(link, { replace: true, fromLink: true }).finally(() =>
      setIsOpeningLink(false)
    );
  }, [link, openEntry]);

  const { collection: collectionRaw } = useCollection(collectionId);
  const collection = collectionRaw as unknown as StacCollection | null;

  // With no temporal range yet, default to the collection's last month
  useEffect(() => {
    if (collection?.extent?.temporal?.interval) {
      const intervals = collection.extent.temporal.interval;
      if (intervals.length > 0 && intervals[0].length >= 2) {
        const [, end] = intervals[0];
        if (end) {
          // Convert ISO datetime to date-only format (YYYY-MM-DD)
          const endDate = new Date(end);
          // Set start date to one month before end date
          const startDate = new Date(endDate);
          startDate.setMonth(startDate.getMonth() - 1);

          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          if (!temporalRange[0] && !temporalRange[1]) {
            setDefaultTemporalRange([startDateStr, endDateStr]);
          }
        }
      }
    }
  }, [collection, temporalRange, setDefaultTemporalRange]);

  const {
    isLoading: isLoadingProject,
    error: loadError,
    dialog: loadProjectDialog
  } = useLoadProject(projectId);

  const notFoundMessage = (location.state as { notFound?: string } | null)
    ?.notFound;

  if (notFoundMessage) {
    throw new NotFound(notFoundMessage);
  }

  if (loadError instanceof IncompatibleProjectError) {
    throw loadError;
  }

  if (isNotFound(loadError)) {
    throw new NotFound(`Project not found: ${projectId}`);
  }

  // Anything else (network, 5xx) goes to the error page as is.
  if (loadError) {
    throw loadError;
  }

  if (isLoadingProject || isOpeningLink) {
    return (
      <Flex flex={1} alignItems='center' justifyContent='center'>
        <Spinner size='lg' />
        {openEntryDialog}
        {loadProjectDialog}
      </Flex>
    );
  }

  return (
    <Flex flexDirection='column' flex={1} maxH='calc(100vh - 1rem)' minW={0}>
      <Splitter.Root
        defaultSize={[50, 50]}
        panels={[
          { id: 'editor', minSize: 20 },
          { id: 'map', minSize: 20 }
        ]}
        gap={2}
      >
        <Splitter.Panel
          id='editor'
          borderWidth='1px'
          borderColor='border'
          borderRadius='uni'
          display='flex'
        >
          {/* Remounts whenever the content is replaced, so the initial doc
              and the one-shot auto-run follow the new content. */}
          <CodeEditor.Root key={contentVersion} initialCode=''>
            <EditorWorkspace autoExecuteOnReady={autoRun && !!code.trim()} />
          </CodeEditor.Root>
        </Splitter.Panel>

        <Splitter.ResizeTrigger id='editor:map' />

        <Splitter.Panel
          id='map'
          borderWidth='1px'
          borderColor='border'
          borderRadius='uni'
        >
          <ResultsPanel />
        </Splitter.Panel>
      </Splitter.Root>
    </Flex>
  );
}
