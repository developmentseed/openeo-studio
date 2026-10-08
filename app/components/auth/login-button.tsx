import { Button, ButtonProps, IconButton } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';
import { LuLogIn } from 'react-icons/lu';

import { useIsAuthDisabled } from '$components/auth/disabled-auth-provider';

export interface LoginButtonProps extends ButtonProps {
  compact?: boolean;
  hideIfAuthenticated?: boolean;
}

export function LoginButton(props: LoginButtonProps) {
  const {
    size = 'sm',
    variant = 'outline',
    compact,
    hideIfAuthenticated,
    ...rest
  } = props;
  const { signinRedirect, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const isAuthDisabled = useIsAuthDisabled();

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    signinRedirect({
      state: { returnTo: location.pathname }
    });
  };

  if (isAuthDisabled || (isAuthenticated && hideIfAuthenticated)) {
    return null;
  }

  if (compact) {
    return (
      <IconButton
        size={size}
        variant={variant}
        {...rest}
        onClick={handleLogin}
        disabled={isLoading}
      >
        <LuLogIn />
      </IconButton>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      {...rest}
      onClick={handleLogin}
      disabled={isLoading}
    >
      Login
      <LuLogIn />
    </Button>
  );
}
