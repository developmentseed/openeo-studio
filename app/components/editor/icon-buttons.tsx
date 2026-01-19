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

export function InfoIconButton() {
  return (
    <IconButton
      size='2xs'
      variant='ghost'
      colorPalette='gray'
      aria-label='Info'
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
        <path d='M7,12h2V7H7V12z M8,4C7.448,4,7,4.448,7,5s0.448,1,1,1c0.552,0,1-0.448,1-1S8.552,4,8,4z M8,0C3.582,0,0,3.582,0,8 c0,4.418,3.582,8,8,8s8-3.582,8-8C16,3.582,12.418,0,8,0z M12.243,12.243C11.109,13.376,9.603,14,8,14s-3.109-0.624-4.243-1.757 C2.624,11.109,2,9.603,2,8s0.624-3.109,1.757-4.243C4.891,2.624,6.397,2,8,2s3.109,0.624,4.243,1.757C13.376,4.891,14,6.397,14,8 C14,9.603,13.376,11.109,12.243,12.243z' />
      </svg>
    </IconButton>
  );
}
