import { Flex, IconButton, Button } from '@chakra-ui/react';
import SmartLink from '$utils/smart-link';

interface EditorHeaderProps {
  sceneName: string;
  collectionId: string;
  temporalRange: [string, string];
  cloudCover: number;
  onConfigOpen: () => void;
}

export function EditorHeader({
  sceneName,
  collectionId,
  temporalRange,
  cloudCover,
  onConfigOpen
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
      <Button
        size='sm'
        variant='outline'
        layerStyle='handDrawn'
        onClick={onConfigOpen}
      >
        Update Configuration
        <svg
          version='1.1'
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 16 16'
        >
          <rect width='16' height='16' id='icon-bound' fill='none' />
          <path d='M14.8,7.5l-1.4-0.3c-0.1-0.3-0.2-0.6-0.3-0.9l0.8-1.2c0.2-0.3,0.2-0.7-0.1-1l-0.7-0.7c-0.3-0.3-0.7-0.3-1-0.1l-1.2,0.8c-0.3-0.1-0.6-0.2-0.9-0.3L9.5,1.2C9.4,0.9,9.2,0.7,8.9,0.6L8,0.5C7.7,0.5,7.4,0.6,7.3,0.9L7,2.3c-0.3,0.1-0.6,0.2-0.9,0.3L5,1.8c-0.3-0.2-0.7-0.2-1,0.1L3.3,2.6C3,2.9,3,3.3,3.2,3.6l0.8,1.2c-0.1,0.3-0.2,0.6-0.3,0.9l-1.4,0.3c-0.3,0.1-0.6,0.3-0.6,0.6L1.5,8c0,0.3,0.2,0.6,0.5,0.7l1.4,0.3c0.1,0.3,0.2,0.6,0.3,0.9l-0.8,1.2c-0.2,0.3-0.2,0.7,0.1,1l0.7,0.7c0.3,0.3,0.7,0.3,1,0.1l1.2-0.8c0.3,0.1,0.6,0.2,0.9,0.3l0.3,1.4c0.1,0.3,0.3,0.6,0.6,0.6L9,14.5c0.3,0,0.6-0.2,0.7-0.5l0.3-1.4c0.3-0.1,0.6-0.2,0.9-0.3l1.2,0.8c0.3,0.2,0.7,0.2,1-0.1l0.7-0.7c0.3-0.3,0.3-0.7,0.1-1l-0.8-1.2c0.1-0.3,0.2-0.6,0.3-0.9l1.4-0.3c0.3-0.1,0.6-0.3,0.6-0.6L15.5,7C15.5,6.7,15.3,6.4,14.8,7.5z M8,10.5c-1.4,0-2.5-1.1-2.5-2.5S6.6,5.5,8,5.5s2.5,1.1,2.5,2.5S9.4,10.5,8,10.5z' />
        </svg>
      </Button>
    </Flex>
  );
}
