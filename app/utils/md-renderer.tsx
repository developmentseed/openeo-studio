import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Blockquote,
  Button,
  Heading,
  Link,
  List,
  Table,
  Text,
  chakra
} from '@chakra-ui/react';
import { ReadOnlyCodeEditor } from '$components/editor/readonly-code-editor';

const mdPlugins = [remarkGfm];

async function copyCodeToClipboard(button: HTMLButtonElement, text: string) {
  const originalLabel = button.textContent || 'Copy';

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Copy failed';
  }

  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = originalLabel;
    button.disabled = false;
  }, 1200);
}

const mdComponents: Components = {
  p: (props) => <Text lineHeight='tall' mb={4} {...props} />,
  h1: (props) => <Heading as='h1' size='xl' {...props} />,
  h2: (props) => <Heading as='h2' size='lg' {...props} />,
  h3: (props) => <Heading as='h3' size='md' {...props} />,
  h4: (props) => <Heading as='h4' size='sm' {...props} />,
  h5: (props) => <Heading as='h5' size='xs' {...props} />,
  h6: (props) => <Heading as='h6' size='xs' {...props} />,
  ul: (props) => <List.Root pl={6} mb={4} {...props} />,
  ol: (props) => <List.Root as='ol' pl={6} mb={4} {...props} />,
  li: List.Item,
  a: (props) => (
    <Link color='primary.600' textDecoration='underline' {...props} />
  ),
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    if (match) {
      return (
        <Box
          mb={4}
          borderRadius='md'
          overflow='hidden'
          bg='bg.subtle'
          position='relative'
        >
          <Button
            size='xs'
            position='absolute'
            top={2}
            right={2}
            zIndex={1}
            variant='surface'
            onClick={(event) => copyCodeToClipboard(event.currentTarget, code)}
          >
            Copy
          </Button>
          {match[1] === 'python' ? (
            <ReadOnlyCodeEditor code={code} />
          ) : (
            <chakra.pre
              p={4}
              overflow='auto'
              borderRadius='md'
              fontSize='13px'
              whiteSpace='pre'
              fontFamily='Fira Code, monospace'
            >
              {code}
            </chakra.pre>
          )}
        </Box>
      );
    }

    return (
      <chakra.code
        bg='gray.100'
        px={1.5}
        py={0.5}
        borderRadius='sm'
        fontSize='sm'
        {...props}
      >
        {children}
      </chakra.code>
    );
  },
  table: (props) => <Table.Root variant='line' {...props} />,
  thead: Table.Header,
  tbody: Table.Body,
  tfoot: Table.Footer,
  tr: Table.Row,
  th: Table.Cell,
  td: Table.Cell,
  blockquote: (props) => (
    <Blockquote.Root>
      <Blockquote.Content {...props} />
    </Blockquote.Root>
  )
};

export function MarkdownRenderer(props: React.ComponentProps<typeof Markdown>) {
  return (
    <Box width='100%' fontSize='md' color='foreground.700'>
      <Markdown
        remarkPlugins={mdPlugins}
        components={mdComponents}
        {...props}
      />
    </Box>
  );
}
