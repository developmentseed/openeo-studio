import { Card, Stack, Skeleton, SkeletonText } from '@chakra-ui/react';

export function ProjectCardSkeleton() {
  return (
    <Card.Root rounded='uni'>
      <Card.Body gap={4} p={4}>
        <Stack gap={2}>
          <Skeleton height='1.5rem' width='60%' />
          <SkeletonText noOfLines={2} />
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
