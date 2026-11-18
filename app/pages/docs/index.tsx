import { ReactNode, useEffect, useMemo } from 'react';
import { Box, Flex, Heading, Stack } from '@chakra-ui/react';
import { Components, ExtraProps } from 'react-markdown';
import { useLocation, useParams } from 'react-router';
import { kebabCase } from 'lodash-es';

import { APP_TITLE } from '$config/constants';
import { MarkdownRenderer } from '$components/common/md-renderer';
import UhOh404 from '$pages/uhoh/404';

import { DocsHeader } from './header';
import { findDocPage } from './docs-config';
import { DocHeading, extractHeadings, getNodeText } from './headings';
import { DocOutline, scrollToHeading } from './outline';

/**
 * Headings get the id of their outline entry, matched by source line, so the
 * outline can link to them.
 */
function headingComponents(headings: DocHeading[]): Components {
  const idByLine = new Map(headings.map((h) => [h.line, h.id]));
  const headingId = (node: ExtraProps['node'], children: ReactNode) =>
    idByLine.get(node?.position?.start.line ?? -1) ??
    kebabCase(getNodeText(children));

  return {
    h2: ({ node, children, ...props }) => (
      <Heading
        as='h2'
        size='lg'
        id={headingId(node, children)}
        mt={10}
        mb={3}
        scrollMarginTop={8}
        {...props}
      >
        {children}
      </Heading>
    ),
    h3: ({ node, children, ...props }) => (
      <Heading
        as='h3'
        size='md'
        id={headingId(node, children)}
        mt={8}
        mb={3}
        scrollMarginTop={8}
        {...props}
      >
        {children}
      </Heading>
    )
  };
}

export function DocsPage() {
  const { docId } = useParams<{ docId: string }>();
  const { hash } = useLocation();
  const doc = findDocPage(docId);

  const headings = useMemo(
    () => (doc ? extractHeadings(doc.content) : []),
    [doc]
  );
  const components = useMemo(() => headingComponents(headings), [headings]);

  // Go to the heading in the url or to the top when the page changes.
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (id && document.getElementById(id)) {
      scrollToHeading(id, false);
    } else {
      window.scrollTo(0, 0);
    }
  }, [doc, hash]);

  if (!doc) return <UhOh404 />;

  return (
    <Box flex={1} minW={0}>
      <title>{`${APP_TITLE} - ${doc.title}`}</title>
      <Stack gap={2}>
        <DocsHeader />
        <Flex px={2} pb={16} gap={8}>
          <Box flex={1} minW={0}>
            <Box as='article' maxW='3xl' mx='auto'>
              <Heading as='h1' size='3xl' mb={6}>
                {doc.title}
              </Heading>
              <MarkdownRenderer components={components}>
                {doc.content}
              </MarkdownRenderer>
            </Box>
          </Box>
          <DocOutline headings={headings} />
        </Flex>
      </Stack>
    </Box>
  );
}
