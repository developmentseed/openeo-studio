import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Blockquote,
  Heading,
  Link,
  List,
  Table,
  Text,
  chakra
} from '@chakra-ui/react';

const mdPlugins = [remarkGfm];
const mdComponents: Components = {
  p: Text,
  h1: (props) => <Heading as='h1' size='xl' {...props} />,
  h2: (props) => <Heading as='h2' size='lg' {...props} />,
  h3: (props) => <Heading as='h3' size='md' {...props} />,
  h4: (props) => <Heading as='h4' size='sm' {...props} />,
  h5: (props) => <Heading as='h5' size='xs' {...props} />,
  h6: (props) => <Heading as='h6' size='xs' {...props} />,
  ul: (props) => <List.Root pl={4} {...props} />,
  ol: (props) => <List.Root as='ol' pl={4} {...props} />,
  li: List.Item,
  a: (props) => <Link color='info.600' {...props} />,
  pre: (props) => <chakra.pre {...props} overflow='hidden' />,
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
    <Markdown remarkPlugins={mdPlugins} components={mdComponents} {...props} />
  );
}
