import { useRef, useState } from 'react';
import { Flex, IconButton, Input } from '@chakra-ui/react';
import { LuSearch, LuX } from 'react-icons/lu';

interface CatalogueSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function CatalogueSearch({ value, onChange }: CatalogueSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearAndClose = () => {
    onChange('');
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <Flex alignItems='center'>
      <Flex position='relative' mr={isOpen ? 1 : 0} transition='margin 0.2s'>
        <Input
          ref={inputRef}
          size='sm'
          transition='all 0.2s'
          // Hidden, not unmounted, so the collapse can animate
          {...(isOpen
            ? { w: { base: '8rem', md: '14rem' }, pe: 8 }
            : {
                w: 0,
                minW: 0,
                px: 0,
                borderWidth: 0,
                opacity: 0,
                visibility: 'hidden'
              })}
          placeholder='Search the catalogue'
          aria-label='Search the catalogue'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onTransitionEnd={(e) => {
            if (isOpen && e.propertyName === 'width') e.currentTarget.focus();
          }}
          onBlur={() => {
            if (!value) setIsOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') clearAndClose();
          }}
        />
        {value && (
          <IconButton
            size='2xs'
            variant='ghost'
            position='absolute'
            right={1}
            top='50%'
            transform='translateY(-50%)'
            transition='opacity 0.2s, visibility 0.2s'
            opacity={isOpen ? 1 : 0}
            visibility={isOpen ? 'visible' : 'hidden'}
            aria-label='Clear search'
            // Escape is the keyboard path; tabbing here would collapse an empty field
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearAndClose}
          >
            <LuX />
          </IconButton>
        )}
      </Flex>
      <IconButton
        ref={buttonRef}
        size='sm'
        variant='ghost'
        aria-label='Search the catalogue'
        aria-expanded={isOpen}
        // Keeps focus in the input, so its blur doesn't collapse it
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <LuSearch />
      </IconButton>
    </Flex>
  );
}
