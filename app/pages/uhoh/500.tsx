import { Button, Flex } from '@chakra-ui/react';
import { LuHouse } from 'react-icons/lu';

import { ErrorState } from '$components/common/error-state';
import SmartLink from '$components/common/smart-link';
import { APP_TITLE } from '$config/constants';

export default function UhOh500(props: { error?: Error }) {
  const { error } = props;

  return (
    <Flex
      as='main'
      flex='1'
      align='center'
      justify='center'
      px={{ base: 4, md: 8 }}
      py={{ base: 12, md: 20 }}
    >
      <title>{`${APP_TITLE} - Critical error`}</title>

      <ErrorState
        label='Critical error'
        title='Something went wrong'
        message='Studio stopped because of an unexpected error. Reload the page to try again, or go back to the homepage.'
        details={
          error?.message
            ? [{ label: 'Error', value: error.message, code: true }]
            : undefined
        }
        actions={
          <Button variant='outline' asChild>
            <SmartLink to='/' textDecoration='none'>
              <LuHouse />
              Homepage
            </SmartLink>
          </Button>
        }
      />
    </Flex>
  );
}
