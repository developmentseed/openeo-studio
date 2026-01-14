import { Button, Image } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

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
  const {
    isLoading,
    isAuthenticated,
    user,
    signinRedirect,
    removeUser,
    events,
    signinSilent
  } = useAuth();

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
    return (
      <Button
        variant='ghost'
        onClick={(e) => {
          e.preventDefault();
          if (!isLoading) {
            signinRedirect({
              state: window.location.href.replace(window.location.origin, '')
            });
          }
        }}
        layerStyle='handDrawn'
      >
        Login
      </Button>
    );
  }

  // const username =
  //   `${profile.given_name} ${profile.family_name}`.trim() || undefined;

  return (
    <Button
      variant='outline'
      onClick={(e) => {
        e.preventDefault();
        removeUser();
      }}
      layerStyle='handDrawn'
    >
      Logout{' '}
      <Image
        width={8}
        src={`https://www.gravatar.com/avatar/${userEmailHash}?d=initials`}
        alt='User image'
        className='profile-image'
        layerStyle='handDrawn'
      />
    </Button>
  );
}
