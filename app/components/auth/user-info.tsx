import { useEffect, useState } from 'react';
import { IconButton, Image } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';

import { LoginButton, LoginButtonProps } from '$components/auth/login-button';
import { Tip } from '$components/tooltip';

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
  const { isAuthenticated, user, removeUser } = useAuth();

  const profile = user?.profile;

  const [userEmailHash, setUserEmailHash] = useState<string>('');
  useEffect(() => {
    if (profile?.email) {
      hash(profile.email).then(setUserEmailHash);
    }
  }, [profile?.email]);

  if (!isAuthenticated || !profile) {
    return <LoginButton {...props} />;
  }

  return (
    <Tip content='Logout' placement='right'>
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
    </Tip>
  );
}
