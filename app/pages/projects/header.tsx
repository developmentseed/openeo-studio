import { Button, Flex, Heading } from '@chakra-ui/react';
import { LuPlus, LuAward, LuUser } from 'react-icons/lu';
import { NavLink } from 'react-router';

import SmartLink from '$utils/smart-link';

export function ProjectsHeader() {
  return (
    <Flex
      gap={4}
      justifyContent='space-between'
      alignItems='center'
      px={2}
      py={4}
    >
      <Heading size='md'>Browse</Heading>
      <Flex gap={2}>
        <Button size='sm' variant='ghost' asChild>
          <NavLink to='/projects' end>
            <LuUser /> My projects
          </NavLink>
        </Button>
        <Button size='sm' variant='ghost' asChild>
          <NavLink to='/projects/samples'>
            <LuAward /> Samples
          </NavLink>
        </Button>
        <Button size='sm' variant='outline' asChild>
          <SmartLink to='/editor'>
            <LuPlus /> Create
          </SmartLink>
        </Button>
      </Flex>
    </Flex>
  );
}
