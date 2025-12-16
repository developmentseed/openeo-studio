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

interface MoveUpIconButtonProps {
  onClick: () => void;
}

export function MoveUpIconButton({ onClick }: MoveUpIconButtonProps) {
  return (
    <IconButton
      size='xs'
      variant='ghost'
      onClick={onClick}
      aria-label='Move up'
    >
      <svg
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 16 16'
      >
        <rect width='16' height='16' id='icon-bound' fill='none' />
        <polygon points='2.414,8.414 7,3.828 7,16 9,16 9,3.828 13.586,8.414 15,7 8,0 1,7' />
      </svg>
    </IconButton>
  );
}

interface MoveDownIconButtonProps {
  onClick: () => void;
}

export function MoveDownIconButton({ onClick }: MoveDownIconButtonProps) {
  return (
    <IconButton
      size='xs'
      variant='ghost'
      onClick={onClick}
      aria-label='Move down'
    >
      <svg
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 16 16'
      >
        <rect width='16' height='16' id='icon-bound' fill='none' />
        <polygon points='13.586,7.586 9,12.172 9,0 7,0 7,12.172 2.414,7.586 1,9 8,16 15,9' />
      </svg>
    </IconButton>
  );
}

interface RemoveIconButtonProps {
  onClick: () => void;
}

export function RemoveIconButton({ onClick }: RemoveIconButtonProps) {
  return (
    <IconButton
      size='xs'
      variant='ghost'
      colorPalette='red'
      onClick={onClick}
      aria-label='Remove band'
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
          points='14.707,2.707 13.293,1.293 8,6.586 2.707,1.293 1.293,2.707 6.586,8 1.293,13.293 2.707,14.707 8,9.414 
	13.293,14.707 14.707,13.293 9.414,8 '
        />
      </svg>
    </IconButton>
  );
}
