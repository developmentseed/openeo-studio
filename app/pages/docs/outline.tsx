import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Link, List, Text } from '@chakra-ui/react';

import { DocHeading } from './headings';

// Distance from the viewport top at which a heading becomes the current one.
const ACTIVE_OFFSET = 96;

const expandedPanel = {
  _before: { opacity: 1 }
};

const expandedLabel = {
  maxW: 'xs',
  opacity: 1
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToHeading(id: string, smooth = true) {
  document.getElementById(id)?.scrollIntoView({
    behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
    block: 'start'
  });
}

// Input that means the reader is scrolling on their own.
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];

/**
 * Tracks which heading the reader is in: the last heading that scrolled past
 * the top of the viewport, or the last one when the page is scrolled to the
 * bottom.
 * A heading that was navigated to stays active until the reader scrolls,
 * because headings near the end of a page can't reach the top.
 */
function useActiveHeading(headings: DocHeading[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pinnedId = useRef<string | null>(null);

  const pin = useCallback((id: string) => {
    pinnedId.current = id;
    setActiveId(id);
  }, []);

  useEffect(() => {
    let frame = 0;

    const hashId = decodeURIComponent(window.location.hash.slice(1));
    pinnedId.current = headings.some((h) => h.id === hashId) ? hashId : null;

    const update = () => {
      frame = 0;
      if (pinnedId.current) {
        setActiveId(pinnedId.current);
        return;
      }

      const { scrollHeight } = document.documentElement;
      const atBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >= scrollHeight - 2;

      let current = headings[0]?.id ?? null;
      if (atBottom) {
        current = headings[headings.length - 1]?.id ?? null;
      } else {
        for (const heading of headings) {
          const el = document.getElementById(heading.id);
          if (!el) continue;
          if (el.getBoundingClientRect().top > ACTIVE_OFFSET) break;
          current = heading.id;
        }
      }
      setActiveId(current);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const unpin = () => {
      pinnedId.current = null;
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    USER_SCROLL_EVENTS.forEach((type) =>
      window.addEventListener(type, unpin, { passive: true })
    );
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      USER_SCROLL_EVENTS.forEach((type) =>
        window.removeEventListener(type, unpin)
      );
      cancelAnimationFrame(frame);
    };
  }, [headings]);

  return { activeId, pin };
}

interface DocOutlineProps {
  headings: DocHeading[];
}

/**
 * Lateral document outline, fixed to the right of the page and vertically
 * centered. Collapsed it shows one dash per heading, with the current section
 * highlighted. Hovering or focusing it reveals the titles.
 */
export function DocOutline({ headings }: DocOutlineProps) {
  const { activeId, pin } = useActiveHeading(headings);

  if (!headings.length) return null;

  const topLevel = Math.min(...headings.map((h) => h.level));

  const onClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    pin(id);
    scrollToHeading(id);
    // Update the url without going through the router so that the page does
    // not jump to the heading before the smooth scroll.
    window.history.replaceState(window.history.state, '', `#${id}`);
  };

  return (
    <Box
      as='nav'
      aria-label='On this page'
      flexShrink={0}
      w={10}
      zIndex={100}
      hideBelow='lg'
    >
      <Box
        className='group'
        position='fixed'
        top='50%'
        right={4}
        transform='translateY(-50%)'
        zIndex={1}
        w='max-content'
        p={2}
        // Backdrop behind the expanded titles. It extends past the panel and
        // fades out on the top, bottom and left edges so it blends into the
        // page. The right edge stays solid against the side of the viewport.
        _before={{
          content: '""',
          position: 'absolute',
          inset: '-3rem -1rem -3rem -6rem',
          zIndex: -1,
          bg: 'bg.subtle',
          maskImage:
            'linear-gradient(to right, transparent, black 6rem), linear-gradient(to bottom, transparent, black 3rem, black calc(100% - 3rem), transparent)',
          maskComposite: 'intersect',
          opacity: 0,
          transition: 'opacity 160ms',
          pointerEvents: 'none'
        }}
        _hover={expandedPanel}
        _focusWithin={expandedPanel}
      >
        <List.Root unstyled maxH='calc(100vh - 4rem)' overflowY='auto' p={1}>
          {headings.map((heading) => {
            const isActive = heading.id === activeId;
            const isNested = heading.level > topLevel;

            return (
              <List.Item key={heading.id}>
                <Link
                  href={`#${heading.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={(e) => onClick(e, heading.id)}
                  display='flex'
                  flexDirection='row-reverse'
                  justifyContent='space-between'
                  alignItems='center'
                  gap={3}
                  minH={7}
                  pl={2}
                  borderRadius='sm'
                  fontSize='sm'
                  fontWeight={isActive ? 'semibold' : 'normal'}
                  color={isActive ? 'fg' : 'fg.muted'}
                  transition='color 160ms'
                  _hover={{ color: 'fg', textDecor: 'none' }}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'primary.focusRing'
                  }}
                >
                  <Box
                    as='span'
                    flexShrink={0}
                    h='2px'
                    w={isNested ? 3 : 5}
                    borderRadius='full'
                    bg={isActive ? 'primary.solid' : 'border.emphasized'}
                    transition='background-color 160ms'
                  />
                  <Text
                    as='span'
                    ml={isNested ? 4 : 0}
                    truncate
                    maxW={0}
                    opacity={0}
                    transition='opacity 160ms'
                    _groupHover={expandedLabel}
                    _groupFocusWithin={expandedLabel}
                  >
                    {heading.text}
                  </Text>
                </Link>
              </List.Item>
            );
          })}
        </List.Root>
      </Box>
    </Box>
  );
}
