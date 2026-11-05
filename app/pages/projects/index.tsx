import { Box, Button, Flex, SimpleGrid, Stack } from '@chakra-ui/react';
import { LuFolder, LuFolderX, LuLibrary, LuPlus } from 'react-icons/lu';

import { ProjectsHeader } from './header';
import { useProjects } from '$stores/projects-store';
import { ProjectCardSkeleton } from '$components/projects/project-card-skeleton';
import { ProjectCard } from '$components/projects/project-card';
import SmartLink from '$components/common/smart-link';
import { EmptyState } from '$components/common/empty-state';
import { useNewProject } from '$components/catalogue/use-open-entry';

const SKELETON_COUNT = 6;

export function ProjectsPage() {
  const { projects, isLoading, error } = useProjects();
  const { newProject, dialog } = useNewProject();

  return (
    <Box flex={1}>
      <Stack h='100%' gap={2}>
        <ProjectsHeader />
        <Flex px={2} h='100%' justifyContent='stretch'>
          {error ? (
            <Flex w='100%' align='center' justify='center'>
              <EmptyState
                variant='error'
                icon={<LuFolderX size='4rem' />}
                title='Error loading projects'
                description={error.message}
              />
            </Flex>
          ) : isLoading ? (
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap={4}
              alignSelf='start'
              width='100%'
            >
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
            </SimpleGrid>
          ) : projects.length === 0 ? (
            <Flex w='100%' align='center' justify='center'>
              <EmptyState
                icon={<LuFolder size='4rem' />}
                title='You have no projects'
                description='Create a new project or browse the catalogue'
                actions={
                  <>
                    <Button size='sm' variant='subtle' onClick={newProject}>
                      <LuPlus /> Create
                    </Button>
                    <Button size='sm' variant='subtle' asChild>
                      <SmartLink to='/projects/catalogue'>
                        <LuLibrary /> Catalogue
                      </SmartLink>
                    </Button>
                  </>
                }
              />
            </Flex>
          ) : (
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap={4}
              alignSelf='start'
              width='100%'
            >
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </SimpleGrid>
          )}
        </Flex>
      </Stack>
      {dialog}
    </Box>
  );
}
