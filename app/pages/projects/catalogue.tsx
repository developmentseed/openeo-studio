import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Flex,
  Input,
  SimpleGrid,
  Stack
} from '@chakra-ui/react';

import { catalogue } from '$config/catalogue';
import { useCatalogue } from '$components/catalogue/use-catalogue';
import { useOpenEntry } from '$components/catalogue/use-open-entry';
import { entryHref } from '$utils/catalogue/links';
import { ProjectCardSkeleton } from '$components/projects/project-card-skeleton';
import { ProjectsHeader } from './header';
import { SceneCard } from './scene-card';
import { BlankCard } from './blank-card';

const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_COUNT = 6;

const sourceLabel = (sourceId: string) =>
  catalogue.sources.find((s) => s.id === sourceId)?.label ?? sourceId;

export function ProjectsCataloguePage() {
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [sourceId, setSourceId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setText(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { entries, errors, isLoading, hasMore, loadMore, retry } = useCatalogue(
    { text, sourceIds: sourceId ? [sourceId] : undefined }
  );
  const { openEntry, pendingRef, dialog } = useOpenEntry();

  return (
    <Box flex={1}>
      <Stack gap={4}>
        <ProjectsHeader />
        <Stack px={4} gap={4}>
          <Flex gap={2} wrap='wrap' alignItems='center'>
            <Input
              size='sm'
              maxW='20rem'
              placeholder='Search the catalogue'
              aria-label='Search the catalogue'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Flex gap={1} role='group' aria-label='Filter by source'>
              {[{ id: null, label: 'All' }, ...catalogue.sources].map(
                (source) => (
                  <Button
                    key={source.id ?? 'all'}
                    size='sm'
                    variant={sourceId === source.id ? 'subtle' : 'ghost'}
                    aria-pressed={sourceId === source.id}
                    onClick={() => setSourceId(source.id)}
                  >
                    {source.label}
                  </Button>
                )
              )}
            </Flex>
          </Flex>

          {errors.map(({ sourceId: failed }) => (
            <Alert.Root key={failed} status='warning' size='sm'>
              <Alert.Indicator />
              <Alert.Title flex={1}>
                Couldn&apos;t load {sourceLabel(failed)}
              </Alert.Title>
              <Button size='xs' variant='outline' onClick={() => retry(failed)}>
                Retry
              </Button>
            </Alert.Root>
          ))}

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {entries.map(({ sourceId: from, entry }) => (
              <SceneCard
                key={`${from}:${entry.id}`}
                name={entry.name}
                description={entry.description}
                thumbnail={entry.thumbnail}
                collectionId={entry.collectionId}
                badges={[sourceLabel(from), ...(entry.tags ?? [])]}
                href={entryHref(entry.open)}
                isBusy={pendingRef === entry.open.ref}
                onOpen={() => openEntry(entry.open)}
              />
            ))}
            {/* Sources still loading */}
            {isLoading &&
              Array.from(
                { length: entries.length ? 3 : SKELETON_COUNT },
                (_, index) => <ProjectCardSkeleton key={`skeleton-${index}`} />
              )}
            <BlankCard />
          </SimpleGrid>

          {hasMore && !isLoading && (
            <Flex justify='center' pb={4}>
              <Button size='sm' variant='outline' onClick={loadMore}>
                Load more
              </Button>
            </Flex>
          )}
        </Stack>
      </Stack>
      {dialog}
    </Box>
  );
}
