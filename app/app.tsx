import { useEffect } from 'react';
import { Flex, Spinner } from '@chakra-ui/react';
import { Route, Routes, useNavigate } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { AppHeader } from '$components/layout/app-header';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';

export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Handle post-auth navigation
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const postAuthPath = window.sessionStorage.getItem('postAuthPath');
      if (postAuthPath) {
        window.sessionStorage.removeItem('postAuthPath');
        navigate(postAuthPath, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Don't render routes if we're about to redirect after auth
  const postAuthPath = window.sessionStorage.getItem('postAuthPath');
  if (isLoading || (isAuthenticated && postAuthPath)) {
    return (
      <Flex flexDirection='column' height='100vh'>
        <AppHeader />
        <Flex flex={1} alignItems='center' justifyContent='center'>
          <Spinner size='xl' />
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/editor/:sceneId' element={<EditorPage />} />
      </Routes>
    </Flex>
  );
}
