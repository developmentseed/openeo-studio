import { Card, Stack, Heading, Text } from '@chakra-ui/react';
import type { UserDefinedProcess } from '$types';

interface ProjectCardProps {
  project: UserDefinedProcess;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card.Root rounded='uni'>
      <Card.Body gap={4} p={8}>
        <Stack gap={2}>
          <Heading size='md'>{project.id}</Heading>
          <Text fontSize='sm'>{project.summary}</Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
