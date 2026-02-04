import { Accordion, Span } from '@chakra-ui/react';
import { ReadOnlyCodeEditor } from './readonly-code-editor';
import loaderPy from '../../algorithms/base/loader.py?raw';

export function LoaderPanel() {
  return (
    <Accordion.Root collapsible maxHeight='100%' minHeight={10} overflow='auto'>
      <Accordion.Item value='loader' bg='bg.subtle' paddingX={2}>
        <Accordion.ItemTrigger>
          <Span flex='1' fontFamily='mono' textStyle='xs' color='fg.subtle'>
            Read Base Loader Script (always applied)
          </Span>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <ReadOnlyCodeEditor code={loaderPy} />
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
}
