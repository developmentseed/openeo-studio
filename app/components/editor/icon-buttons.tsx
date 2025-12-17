import { IconButton } from '@chakra-ui/react';

interface CollapseIconButtonProps {
  isOpen: boolean;
}

export function CollapseIconButton({ isOpen }: CollapseIconButtonProps) {
  return (
    <IconButton
      aria-label={isOpen ? 'Collapse' : 'Expand'}
      size='xs'
      variant='ghost'
    >
      {isOpen ? (
        <svg
          version='1.1'
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 16 16'
        >
          <rect width='16' height='16' id='icon-bound' fill='none' />
          <polygon points='14.586,3.586 8,10.172 1.414,3.586 0,5 8,13 16,5' />
        </svg>
      ) : (
        <svg
          version='1.1'
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 16 16'
        >
          <rect width='16' height='16' id='icon-bound' fill='none' />
          <polygon points='3.586,1.414 10.172,8 3.586,14.586 5,16 13,8 5,0' />
        </svg>
      )}
    </IconButton>
  );
}

interface RemoveIconButtonProps {
  onClick: () => void;
}

export function RemoveIconButton({ onClick }: RemoveIconButtonProps) {
  return (
    <IconButton
      size='2xs'
      variant='ghost'
      colorPalette='gray'
      onClick={onClick}
      aria-label='Remove band'
      color='gray.400'
      _hover={{ color: 'gray.600' }}
    >
      <svg
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 16 16'
      >
        <rect width='16' height='16' id='icon-bound' fill='none' />
        <polygon
          fill='currentColor'
          points='14.707,2.707 13.293,1.293 8,6.586 2.707,1.293 1.293,2.707 6.586,8 1.293,13.293 2.707,14.707 8,9.414 
	13.293,14.707 14.707,13.293 9.414,8 '
        />
      </svg>
    </IconButton>
  );
}
