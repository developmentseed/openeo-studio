import { useRef, useState } from 'react';
import {
  Dialog,
  Heading,
  IconButton,
  Portal,
  SimpleGrid
} from '@chakra-ui/react';

import { SAMPLE_SCENES } from '$config/sample-scenes';
import {
  useNewProject,
  useOpenEntry
} from '$components/catalogue/use-open-entry';
import { entryHref } from '$utils/catalogue/links';
import { sampleToEntry } from '$utils/catalogue/sources/samples';
import { seededPick } from '$utils/seeded-pick';
import { BlankCard } from './blank-card';
import { SceneCard } from './scene-card';
import { LuX } from 'react-icons/lu';

const SAMPLE_COUNT = 2;
const HOUR_MS = 60 * 60 * 1000;

/**
 * The "Create new project" dialog: start blank or from a sample. The samples
 * shown are seeded by the current hour, so they change hourly, not per open.
 */
export function useCreateProject() {
  const [open, setOpen] = useState(false);
  // Runs once the dialog has closed: a discard prompt opened while it is
  // still closing gets dismissed along with it.
  const afterClose = useRef<(() => void) | null>(null);
  const closeThen = (action: () => void) => {
    afterClose.current = action;
    setOpen(false);
  };
  const { newProject, dialog: newProjectDialog } = useNewProject();
  const { openEntry, dialog: openEntryDialog } = useOpenEntry();

  const samples = seededPick(
    SAMPLE_SCENES,
    SAMPLE_COUNT,
    Math.floor(Date.now() / HOUR_MS)
  ).map(sampleToEntry);

  const dialog = (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(details) => setOpen(details.open)}
        onExitComplete={() => {
          afterClose.current?.();
          afterClose.current = null;
        }}
        placement='center'
        variant='framed'
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW='5xl'>
              <Dialog.Header>
                <Dialog.Title asChild unstyled>
                  <Heading size='md'>Create new project</Heading>
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton variant='ghost' size='xs' colorPalette='basi'>
                    <LuX />
                  </IconButton>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <Heading size='lg' mb={4}>
                  From scratch or grab a sample
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                  <BlankCard onCreate={() => closeThen(newProject)} />
                  {samples.map((entry) => (
                    <SceneCard
                      key={entry.id}
                      name={entry.name}
                      description={entry.description}
                      thumbnail={entry.thumbnail}
                      collectionId={entry.collectionId}
                      href={entryHref(entry.open)}
                      onOpen={() => closeThen(() => openEntry(entry.open))}
                    />
                  ))}
                </SimpleGrid>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      {newProjectDialog}
      {openEntryDialog}
    </>
  );

  return { createProject: () => setOpen(true), dialog };
}
