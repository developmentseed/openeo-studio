import { useEffect, useMemo, useRef } from 'react';
import { Flex, Heading, Spinner, VStack } from '@chakra-ui/react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useAuth } from 'react-oidc-context';

import { AppHeader } from '$components/layout/app-header';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';
import { DocsPage } from '$pages/docs-page';

export default function App() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  const isAuthCallback = useMemo(() => {
    const search = window.location.search;
    const authInProgress =
      window.sessionStorage.getItem('authInProgress') === '1';
    return (
      authInProgress || search.includes('code=') || search.includes('state=')
    );
  }, []);

  // After auth completes, navigate to stored path and clear flags
  useEffect(() => {
    if (!isAuthCallback || hasNavigated.current) return;

    if (!isLoading) {
      const returnTo = window.sessionStorage.getItem('postAuthPath');
      // Clear the in-progress flag as soon as we act on the callback
      window.sessionStorage.removeItem('authInProgress');

      if (isAuthenticated) {
        hasNavigated.current = true;
        if (returnTo) {
          window.sessionStorage.removeItem('postAuthPath');
          navigate(returnTo, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        // Auth failed: return home
        hasNavigated.current = true;
        navigate('/', { replace: true });
      }
    }
  }, [isAuthCallback, isAuthenticated, isLoading, navigate]);

  // Show loading during auth callback processing to prevent landing-page flash
  if (isAuthCallback && !hasNavigated.current) {
    return (
      <Flex flexDirection='column' height='100vh'>
        <AppHeader />
        <VStack
          as='main'
          h='100%'
          gap={4}
          alignItems='center'
          justifyContent='center'
        >
          <Heading size='xl'>Signing you in…</Heading>
          <Spinner size='lg' />
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex flexDirection='column' height='100vh'>
      <AppHeader />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/docs' element={<DocsPage />} />
        <Route path='/editor' element={<EditorPage />} />
        <Route path='/editor/:sceneId' element={<EditorPage />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Flex>
  );
}
