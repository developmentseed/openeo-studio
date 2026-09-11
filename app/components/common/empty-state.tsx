import { Box, Flex, type BoxProps, VStack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  variant?: 'default' | 'error';
  actions?: ReactNode;
  maxH?: BoxProps['maxH'];
  maxW?: BoxProps['maxW'];
}

export function EmptyState({
  icon,
  title,
  description,
  variant = 'default',
  actions,
  maxH = '40rem',
  maxW = '80rem'
}: EmptyStateProps) {
  const isError = variant === 'error';

  return (
    <Box
      borderWidth='2px'
      borderStyle='dashed'
      borderColor={isError ? 'border.error' : 'border'}
      borderRadius='uni'
      bg={isError ? 'white' : 'bg'}
      p={6}
      boxSize='100%'
      maxH={maxH}
      maxW={maxW}
    >
      <VStack gap={2} justify='center' height='100%'>
        {icon}
        <VStack gap={2} color={isError ? 'error.700' : undefined}>
          <Text fontWeight='semibold' fontSize='lg'>
            {title}
          </Text>
          {description && (
            <Text fontSize='sm' textAlign='center'>
              {description}
            </Text>
          )}
        </VStack>
        {actions && (
          <Flex gap={4} mt={4}>
            {actions}
          </Flex>
        )}
      </VStack>
    </Box>
  );
}
