import { Button, ButtonProps, IconButton } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';
import { LuLogIn } from 'react-icons/lu';

export interface LoginButtonProps extends ButtonProps {
  compact?: boolean;
  hideIfAuthenticated?: boolean;
}

export function LoginButton(props: LoginButtonProps) {
  const { size = 'sm', compact, hideIfAuthenticated, ...rest } = props;
  const { signinRedirect, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    signinRedirect({
      state: { returnTo: location.pathname }
    });
  };

  if (isAuthenticated && hideIfAuthenticated) {
    return null;
  }

  if (compact) {
    return (
      <IconButton
        size={size}
        {...rest}
        onClick={handleLogin}
        disabled={isLoading}
      >
        <LuLogIn />
      </IconButton>
    );
  }

  return (
    <Button size={size} {...rest} onClick={handleLogin} disabled={isLoading}>
      Login
      <LuLogIn />
    </Button>
  );
}
