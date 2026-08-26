import { Badge, Card, Flex, Heading, Stack, Text } from '@chakra-ui/react';

import SmartLink from '$components/common/smart-link';
import { findLoadCollectionId } from '$utils/openeo/user-defined-processes';
import type { UserDefinedProcess } from '$types';

interface ProjectCardProps {
  project: UserDefinedProcess;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const collectionId = findLoadCollectionId(project.process_graph);

  return (
    <Card.Root rounded='uni' asChild cursor='pointer'>
      <SmartLink to={`/editor/${project.id}`} unstyled>
        <Card.Body gap={4} p={4}>
          <Stack gap={2} align='start'>
            <Heading size='md' truncate maxW='100%'>
              {project.summary || project.id}
            </Heading>
            {collectionId && (
              <Flex gap={1}>
                <Text fontSize='sm'>Collection:</Text>
                <Badge size='sm' colorPalette='primary'>
                  {collectionId}
                </Badge>
              </Flex>
            )}
          </Stack>
        </Card.Body>
      </SmartLink>
    </Card.Root>
  );
}
