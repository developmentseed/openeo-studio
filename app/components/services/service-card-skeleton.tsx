import { Card, Flex, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';

export function ServiceCardSkeleton() {
  return (
    <Card.Root rounded='uni'>
      <Card.Body gap={4} p={4}>
        <Stack gap={2}>
          <Skeleton height='1.5rem' width='60%' />
          <SkeletonText noOfLines={1} />
          <Skeleton height='1.5rem' width='40%' />
          <Flex gap={2} wrap='wrap'>
            <Skeleton height='1.75rem' width='6rem' />
            <Skeleton height='1.75rem' width='6rem' />
            <Skeleton height='1.75rem' width='4rem' />
          </Flex>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
