import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Stack,
  Text,
  VStack
} from '@chakra-ui/react';

import { ProjectsHeader } from './header';
import { useProjects } from '$stores/projects-store';
import { ProjectCardSkeleton } from '$components/projects/project-card-skeleton';
import { ProjectCard } from '$components/projects/project-card';
import SmartLink from '$utils/smart-link';
import { LuAward, LuFolder, LuFolderX, LuPlus } from 'react-icons/lu';

const SKELETON_COUNT = 6;

export function ProjectsPage() {
  const { projects, isLoading, error } = useProjects();

  return (
    <Box flex={1}>
      <Stack h='100%' gap={2}>
        <ProjectsHeader />
        <Flex px={2} h='100%' justifyContent='stretch'>
          {error ? (
            <Flex w='100%' align='center' justify='center'>
              <ErrorProjects error={error} />
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
              <NoProjects />
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
    </Box>
  );
}

function NoProjects() {
  return (
    <Box
      borderWidth='2px'
      borderStyle='dashed'
      borderColor='border'
      borderRadius='uni'
      bg='bg'
      p={6}
      boxSize='100%'
      maxH='40rem'
      maxW='80rem'
    >
      <VStack gap={2} justify='center' height='100%'>
        <LuFolder size='4rem' />
        <VStack gap={2}>
          <Text fontWeight='semibold' fontSize='lg'>
            You have no projects
          </Text>
          <Text fontSize='sm' textAlign='center'>
            Create a new project or browse the samples
          </Text>
          <Flex gap={4} mt={4}>
            <Button size='sm' variant='subtle' asChild>
              <SmartLink to='/editor'>
                <LuPlus /> Create
              </SmartLink>
            </Button>
            <Button size='sm' variant='subtle' asChild>
              <SmartLink to='/projects/samples'>
                <LuAward /> Samples
              </SmartLink>
            </Button>
          </Flex>
        </VStack>
      </VStack>
    </Box>
  );
}

function ErrorProjects({ error }: { error: Error }) {
  return (
    <Box
      borderWidth='2px'
      borderStyle='dashed'
      borderColor='border.error'
      borderRadius='lg'
      bg='white'
      p={6}
      boxSize='100%'
      maxH='40rem'
      maxW='80rem'
    >
      <VStack gap={2} justify='center' height='100%'>
        <LuFolderX size='4rem' />
        <VStack gap={2} color='error.700'>
          <Text fontWeight='semibold' fontSize='lg'>
            Error loading projects
          </Text>
          <Text fontSize='sm' textAlign='center'>
            {error.message}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
