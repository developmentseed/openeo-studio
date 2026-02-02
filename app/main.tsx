import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { StacApiProvider } from '@developmentseed/stac-react';
import { BrowserRouter } from 'react-router';
import { WebStorageStateStore } from 'oidc-client-ts';

import { PyodideProvider } from '$contexts/pyodide-context';
import { AuthMonitor } from '$utils/auth-monitor';
import { setupReloadDetector } from './utils/reload-detector';
import { monitorSessionStorage } from './utils/storage-monitor';
// Mock auth provider for Playwright tests - only used when window.__MOCK_AUTH__ is set
import { MockAuthProvider } from '../test/integration/__mocks__/auth-provider';

import system from './styles/theme';

import App from './app';

if (import.meta.env.DEV) {
  setupReloadDetector();
}

const authAuthority = import.meta.env.VITE_AUTH_AUTHORITY || '';
const authClientId = import.meta.env.VITE_AUTH_CLIENT_ID || '';
const authRedirectUri = import.meta.env.VITE_AUTH_REDIRECT_URI || '';

const oidcConfig: AuthProviderProps = {
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  authority: authAuthority,
  client_id: authClientId,
  redirect_uri: authRedirectUri,
  onSigninCallback: (user) => {
    // eslint-disable-next-line no-console
    console.log('[AUTH] onSigninCallback triggered', {
      timestamp: new Date().toISOString(),
      user: user?.profile?.email,
      state: user?.state,
      url: window.location.href
    });

    // Mark that we are handling an auth callback so the app can avoid rendering
    // intermediate routes that cause a flash.
    window.sessionStorage.setItem('authInProgress', '1');

    // Extract the return path from OIDC state
    const returnTo = (user?.state as { returnTo?: string })?.returnTo;
    if (returnTo && returnTo !== '/') {
      // eslint-disable-next-line no-console
      console.log('[AUTH] Setting postAuthPath:', returnTo);
      window.sessionStorage.setItem('postAuthPath', returnTo);
    }

    // eslint-disable-next-line no-console
    console.log('[AUTH] Cleaning up URL');
    window.history.replaceState({}, '', window.location.pathname);
  },

  // Add more logging hooks
  onRemoveUser: () => {
    // eslint-disable-next-line no-console
    console.log('[AUTH] User removed', new Date().toISOString());
  },

  // Enable silent renew
  automaticSilentRenew: true
};

// Root component.
function Root() {
  if (import.meta.env.DEV) {
    monitorSessionStorage();
  }

  useEffect(() => {
    // Hide the welcome banner.
    const banner = document.querySelector('#welcome-banner')!;
    banner.classList.add('dismissed');
    setTimeout(() => banner.remove(), 500);
  }, []);

  /* Use mock auth provider in test mode (when window.__MOCK_AUTH__ is set)
   * See: test/integration/__mocks__/auth-provider.tsx and test/integration/__fixtures__/index.ts
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AuthWrapper: React.ComponentType<any> = window.__MOCK_AUTH__
    ? MockAuthProvider
    : AuthProvider;

  // Only pass oidcConfig if we're using the real AuthProvider
  const authProps = window.__MOCK_AUTH__ ? {} : oidcConfig;

  return (
    <BrowserRouter>
      <AuthWrapper {...authProps}>
        {!window.__MOCK_AUTH__ && <AuthMonitor />}
        <ChakraProvider value={system}>
          <StacApiProvider apiUrl='https://api.explorer.eopf.copernicus.eu/openeo'>
            <PyodideProvider>
              <App />
            </PyodideProvider>
          </StacApiProvider>
        </ChakraProvider>
      </AuthWrapper>
    </BrowserRouter>
  );
}

const rootNode = document.querySelector('#app-container')!;
const root = createRoot(rootNode);
root.render(<Root />);
