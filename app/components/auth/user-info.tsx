import { Button, Image } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { LoginButton } from '$components/auth/login-button';

async function hash(string: string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

export function UserInfo() {
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
    return <LoginButton />;
  }

  // const username =
  //   `${profile.given_name} ${profile.family_name}`.trim() || undefined;

  return (
    <Button
      variant='outline'
      size='sm'
      paddingLeft={1.5}
      onClick={(e) => {
        e.preventDefault();
        removeUser();
      }}
    >
      <Image
        width={6}
        height={6}
        borderRadius='xs'
        src={`https://www.gravatar.com/avatar/${userEmailHash}?d=initials`}
        alt='User image'
      />
      Logout
      <svg
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 16 16'
      >
        <rect width='16' height='16' id='icon-bound' fill='none' />
        <path d='M14,14l0,-12l-6,0l0,-2l8,0l0,16l-8,0l0,-2l6,0Zm-9.002,-0.998l-4.998,-5.002l5,-5l1.416,1.416l-2.588,2.584l8.172,0l0,2l-8.172,0l2.586,2.586l-1.416,1.416Z' />
      </svg>
    </Button>
  );
}
