import { Button, ButtonProps, IconButton } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';
import { LuLogIn } from 'react-icons/lu';

export interface LoginButtonProps extends ButtonProps {
  compact?: boolean;
}

export function LoginButton(props: LoginButtonProps) {
  const { size = 'sm', rounded = 'md', compact, ...rest } = props;
  const { signinRedirect, isLoading } = useAuth();
  const location = useLocation();

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    signinRedirect({
      state: { returnTo: location.pathname }
    });
  };

  if (compact) {
    return (
      <IconButton
        rounded={rounded}
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
    <Button
      rounded={rounded}
      size={size}
      {...rest}
      onClick={handleLogin}
      disabled={isLoading}
    >
      Login
      <LuLogIn />
    </Button>
  );
}
