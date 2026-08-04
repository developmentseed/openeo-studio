import { useEffect, useState } from 'react';
import { IconButton, Image, Portal, Tooltip } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import { LoginButton, LoginButtonProps } from '$components/auth/login-button';

async function hash(string: string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

export function UserInfo(props: LoginButtonProps) {
  const { isLoading, isAuthenticated, user, removeUser, events, signinSilent } =
    useAuth();

  const profile = user?.profile;

  const [userEmailHash, setUserEmailHash] = useState<string>('');
  useEffect(() => {
    if (profile?.email) {
      hash(profile.email).then(setUserEmailHash);
    }
  }, [profile?.email]);

  useEffect(() => {
    // the `return` is important - addAccessTokenExpiring() returns a cleanup function
    return events.addAccessTokenExpiring(() => {
      signinSilent();
    });
  }, [events, signinSilent]);

  if (!isAuthenticated || !profile || isLoading) {
    return <LoginButton {...props} />;
  }

  // const username =
  //   `${profile.given_name} ${profile.family_name}`.trim() || undefined;

  return (
    <Tooltip.Root positioning={{ placement: 'right' }} openDelay={100}>
      <Tooltip.Trigger asChild>
        <IconButton
          variant='plain'
          size='sm'
          onClick={(e) => {
            e.preventDefault();
            removeUser();
          }}
          overflow='hidden'
        >
          <Image
            boxSize='100%'
            src={`https://www.gravatar.com/avatar/${userEmailHash}?d=initials`}
            alt='User image'
          />
        </IconButton>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>
            <Tooltip.Arrow />
            Logout
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
