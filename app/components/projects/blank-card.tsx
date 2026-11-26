import {
  Card,
  Stack,
  Heading,
  Text,
  LinkBox,
  LinkOverlay,
  Button,
  Flex
} from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useNewProject } from '$components/catalogue/use-open-entry';

export function BlankCard({ onCreate }: { onCreate?: () => void }) {
  const { newProject, dialog } = useNewProject();

  return (
    <>
      <Card.Root
        asChild
        transition='all 0.2s'
        rounded='uni'
        border='none'
        boxShadow='inset 0 0 0 1px {colors.border}'
        shadow='md'
        _hover={{
          transform: 'translateY(-4px)',
          shadow: 'lg'
        }}
      >
        <LinkBox>
          <Card.Body gap={0} p={0} rounded='uni' overflow='hidden'>
            <Flex align='center' justify='center' aspectRatio={2 / 1} mt={-4}>
              <LuPlus size='4rem' />
            </Flex>

            {/* Entry info */}
            <Stack
              gap={2}
              p={8}
              bg='bg'
              rounded='uni'
              boxShadow='inset 0 0 0 1px {colors.border}'
              h='100%'
            >
              <Heading size='md'>
                {/* Stretches over the whole card, so the card is one button */}
                <LinkOverlay asChild>
                  <Button
                    unstyled
                    cursor='pointer'
                    onClick={onCreate ?? newProject}
                  >
                    Blank Project
                  </Button>
                </LinkOverlay>
              </Heading>
              <Text fontSize='sm'>
                Configure your own data source and create a custom analysis.
              </Text>
            </Stack>
          </Card.Body>
        </LinkBox>
      </Card.Root>

      {dialog}
    </>
  );
}
