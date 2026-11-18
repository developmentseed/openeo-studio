import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router';

import { DOC_PAGES, getDocPath } from './docs-config';

export function DocsHeader() {
  return (
    <Flex
      gap={4}
      justifyContent='space-between'
      alignItems='center'
      px={2}
      py={4}
    >
      <Heading size='md'>Documentation</Heading>
      <Flex as='nav' aria-label='Documentation pages' gap={2}>
        {DOC_PAGES.map((doc) => (
          <Button key={doc.id} size='sm' variant='ghost' asChild>
            <NavLink to={getDocPath(doc)} aria-label={doc.title} end>
              <Text hideBelow='lg'>{doc.title}</Text>
            </NavLink>
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
