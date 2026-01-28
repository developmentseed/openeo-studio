import { Button, ButtonProps } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useLocation } from 'react-router';

interface LoginButtonProps {
  size?: ButtonProps['size'];
}

export function LoginButton({ size = 'sm' }: LoginButtonProps) {
  const { signinRedirect, signinSilent, isLoading } = useAuth();
  const location = useLocation();

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      // Try silent signin first (uses iframe, no page navigation)
      await signinSilent();
    } catch {
      // If silent signin fails, fall back to redirect
      signinRedirect({
        state: { returnTo: location.pathname }
      });
    }
  };

  return (
    <Button
      variant='outline'
      size={size}
      onClick={handleLogin}
      disabled={isLoading}
    >
      Login{' '}
      <svg
        version='1.1'
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 16 16'
        fill='currentColor'
      >
        <rect width='16' height='16' id='icon-bound' fill='none' />
        <path d='M14,14l0,-12l-6,0l0,-2l8,0l0,16l-8,0l0,-2l6,0Zm-6.998,-0.998l4.998,-5.002l-5,-5l-1.416,1.416l2.588,2.584l-8.172,0l0,2l8.172,0l-2.586,2.586l1.416,1.416Z' />
      </svg>
    </Button>
  );
}
