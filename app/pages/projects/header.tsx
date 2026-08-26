import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import { LuPlus, LuAward, LuUser } from 'react-icons/lu';
import { NavLink } from 'react-router';

import SmartLink from '$components/common/smart-link';
import { InfoPopoverButton } from '$components/common/info-popover-button';

export function ProjectsHeader() {
  return (
    <Flex
      gap={4}
      justifyContent='space-between'
      alignItems='center'
      px={2}
      py={4}
    >
      <Flex gap={1} alignItems='center'>
        <Heading size='md'>Projects</Heading>
        <InfoPopoverButton storageKey='projects' label='About projects'>
          Projects are the process graphs you build in the editor.
        </InfoPopoverButton>
      </Flex>
      <Flex gap={2}>
        <Button size='sm' variant='ghost' asChild>
          <NavLink to='/projects' end>
            <LuUser /> <Text hideBelow='sm'>My projects</Text>
          </NavLink>
        </Button>
        <Button size='sm' variant='ghost' asChild>
          <NavLink to='/projects/samples'>
            <LuAward /> <Text hideBelow='sm'>Samples</Text>
          </NavLink>
        </Button>
        <Button size='sm' variant='outline' asChild>
          <SmartLink to='/editor'>
            <LuPlus /> <Text hideBelow='sm'>Create</Text>
          </SmartLink>
        </Button>
      </Flex>
    </Flex>
  );
}
