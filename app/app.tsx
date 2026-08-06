import { useEffect, useMemo, useRef } from 'react';
import { Flex, Heading, Spinner, Stack } from '@chakra-ui/react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { useAuth } from 'react-oidc-context';

import { useServiceCleanup } from '$components/services/use-service-cleanup';
import { AppHeader } from '$components/layout/app-header';
import { RequireAuth } from '$components/auth/require-auth';
import { LandingPage } from '$pages/landing-page';
import { EditorPage } from '$pages/editor-page';
import { DocsPage } from '$pages/docs-page';
import { SharePage } from '$pages/share';
import { ProjectsPage } from '$pages/projects';
import { ProjectsSamplesPage } from '$pages/projects/samples';
import { ServicesPage } from '$pages/services';
import UhOh404 from '$pages/uhoh/404';
import { VisualGraphSandboxPage } from '$pages/sandbox/visual-graph';

export default function App() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  const location = useLocation();

  // Clean up orphaned ephemeral services from previous sessions on startup
  useServiceCleanup();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[ROUTE] Navigation occurred', {
      pathname: location.pathname,
      search: location.search,
      timestamp: new Date().toISOString()
    });
  }, [location]);

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
      <Flex minH='100vh' p={2} gap={2} bg='bg.subtle'>
        <AppHeader />

        <Stack flex={1} alignItems='center' justifyContent='center'>
          <Spinner size='lg' />
          <Heading size='xl'>Signing you in…</Heading>
        </Stack>
      </Flex>
    );
  }

  return (
    <Flex minH='100vh' p={2} gap={2} bg='bg.subtle'>
      <AppHeader />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/docs' element={<DocsPage />} />
        {import.meta.env.DEV && (
          <Route
            path='/sandbox/visual-graph'
            element={<VisualGraphSandboxPage />}
          />
        )}
        <Route element={<RequireAuth />}>
          <Route path='/projects' element={<ProjectsPage />} />
          <Route path='/projects/samples' element={<ProjectsSamplesPage />} />
          <Route path='/services' element={<ServicesPage />} />
          <Route path='/editor' element={<EditorPage />} />
          <Route path='/editor/:sceneId' element={<EditorPage />} />
          <Route path='/share/:serviceId' element={<SharePage />} />
        </Route>
        <Route path='*' element={<UhOh404 />} />
      </Routes>
    </Flex>
  );
}
