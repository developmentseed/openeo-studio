import { useState } from 'react';
import { Button, Collapsible, Flex, Table } from '@chakra-ui/react';
import type { StacItem } from 'stac-ts';

interface StacPropertiesProps {
  item: StacItem;
}

export function StacProperties({ item }: StacPropertiesProps) {
  const [showProperties, setShowProperties] = useState(false);

  if (!item.properties || Object.keys(item.properties).length === 0) {
    return null;
  }

  return (
    <Collapsible.Root
      mt={2}
      layerStyle='handDrawn'
      open={showProperties}
      onOpenChange={(e) => setShowProperties(e.open)}
    >
      <Collapsible.Trigger asChild>
        <Button
          variant='outline'
          size='xs'
          width='full'
          justifyContent='space-between'
        >
          {showProperties ? '▼' : '▶'} All properties (
          {Object.keys(item.properties).length})
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Flex maxH='200px' overflowY='auto'>
          <Table.Root size='sm' variant='outline' backgroundColor='bg.subtle'>
            <Table.Body>
              {Object.entries(item.properties).map(([key, value]) => (
                <Table.Row key={key}>
                  <Table.Cell
                    fontWeight='medium'
                    fontSize='xs'
                    maxW='150px'
                    minW='100px'
                    wordBreak='break-word'
                  >
                    {key}
                  </Table.Cell>
                  <Table.Cell fontSize='xs' wordBreak='break-all'>
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
