import { Flex, IconButton } from '@chakra-ui/react';
import SmartLink from '$utils/smart-link';

interface EditorHeaderProps {
  sceneName: string;
  collectionId: string;
  temporalRange: [string, string];
  cloudCover: number;
}

export function EditorHeader({
  sceneName,
  collectionId,
  temporalRange,
  cloudCover
}: EditorHeaderProps) {
  return (
    <Flex
      alignItems='center'
      gap={4}
      px={6}
      py={3}
      borderBottomWidth='1px'
      borderColor='gray.200'
      bg='gray.50'
    >
      <IconButton aria-label='Back to scenes' size='sm' variant='ghost' asChild>
        <SmartLink to='/'>
          <svg
            version='1.1'
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 16 16'
          >
            <rect width='16' height='16' id='icon-bound' fill='none' />
            <polygon points='8.414,13.586 3.828,9 16,9 16,7 3.828,7 8.414,2.414 7,1 0,8 7,15' />
          </svg>
        </SmartLink>
      </IconButton>
      <Flex flexDirection='column' flex={1}>
        <Flex fontSize='md' fontWeight='semibold'>
          {sceneName}
        </Flex>
        <Flex fontSize='xs' color='gray.600'>
          {collectionId} Collection, {temporalRange[0]} to {temporalRange[1]}
          {cloudCover && ', Cloud Cover ≤ ' + cloudCover}%
        </Flex>
      </Flex>
    </Flex>
  );
}
