import { ReactNode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { StacApiProvider } from '@developmentseed/stac-react';
import { BrowserRouter } from 'react-router';
import { WebStorageStateStore } from 'oidc-client-ts';

import ErrorBoundary from '$pages/uhoh/boundary';

import { Toaster } from '$components/layout/toaster';
import { appConfig } from '$config/runtime';
import {
  clearOidcProvidersCache,
  fetchOidcProviders,
  OidcResolution,
  resolveOidcSettings,
  setOidcResolution
} from '$config/oidc';
import { PyodideProvider } from '$contexts/pyodide-context';
import { AuthMonitor } from '$components/auth/auth-monitor';
import { AuthConfigError } from '$components/auth/auth-config-error';
import { DisabledAuthProvider } from '$components/auth/disabled-auth-provider';
import { setupReloadDetector } from '$utils/reload-detector';
import { monitorSessionStorage } from '$utils/storage-monitor';
import { ColorModeProvider } from '$contexts/color-mode';
// Mock auth provider for Playwright tests - only used when window.__MOCK_AUTH__ is set
import { MockAuthProvider } from '../test/integration/__mocks__/auth-provider';

import system from './styles/theme';

import App from './app';

if (import.meta.env.DEV) {
  setupReloadDetector();
}

// Authority, client, redirect URI and scope come from resolveAuth().
const oidcConfig = {
  userStore: new WebStorageStateStore({ store: window.localStorage }),
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
} satisfies Partial<AuthProviderProps>;

function AuthWrapper(props: {
  resolution: OidcResolution;
  children: ReactNode;
}) {
  const { resolution, children } = props;

  /* Use mock auth provider in test mode (when window.__MOCK_AUTH__ is set)
   * See: test/integration/__mocks__/auth-provider.tsx and test/integration/__fixtures__/index.ts
   */
  if (window.__MOCK_AUTH__) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  if (resolution.status !== 'ok') {
    return <DisabledAuthProvider>{children}</DisabledAuthProvider>;
  }

  return (
    <AuthProvider {...oidcConfig} {...resolution.settings}>
      <AuthMonitor />
      {children}
    </AuthProvider>
  );
}

// Root component.
function Root(props: { resolution: OidcResolution }) {
  const { resolution } = props;

  if (import.meta.env.DEV) {
    monitorSessionStorage();
  }

  useEffect(() => {
    dispatchEvent(new Event('app-ready'));
  }, []);

  return (
    <BrowserRouter basename={appConfig.pathPrefix || undefined}>
      <ErrorBoundary>
        <AuthWrapper resolution={resolution}>
          <ColorModeProvider>
            <ChakraProvider value={system}>
              <StacApiProvider apiUrl={appConfig.openeoApiUrl}>
                <PyodideProvider>
                  <App />
                </PyodideProvider>
              </StacApiProvider>
              <Toaster />
            </ChakraProvider>
          </ColorModeProvider>
        </AuthWrapper>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

/**
 * Gets the OIDC configuration from the openEO backend
 * (`GET /credentials/oidc`). The AUTH_* runtime values win when they are set.
 */
async function resolveAuth(): Promise<OidcResolution> {
  // Playwright tests use a mock auth provider and do not need a backend.
  if (window.__MOCK_AUTH__) return { status: 'disabled' };

  const providers = await fetchOidcProviders(appConfig.openeoApiUrl);
  const resolution = resolveOidcSettings(
    providers,
    {
      authority: appConfig.authAuthority,
      clientId: appConfig.authClientId,
      redirectUri: appConfig.authRedirectUri
    },
    { origin: window.location.origin, pathPrefix: appConfig.pathPrefix }
  );

  if (resolution.status === 'error') {
    // Fetch again on the next page load: the backend config can be fixed.
    clearOidcProvidersCache(appConfig.openeoApiUrl);
  } else if (providers.status === 'error') {
    // eslint-disable-next-line no-console
    console.warn(
      '[AUTH] Cannot get /credentials/oidc. Using AUTH_* values only.',
      providers.message
    );
  }

  // eslint-disable-next-line no-console
  console.log('[AUTH] OIDC configuration', resolution);
  return resolution;
}

async function bootstrap() {
  const rootNode = document.querySelector('#app-container')!;
  const root = createRoot(rootNode);

  const resolution = await resolveAuth();
  setOidcResolution(resolution);

  if (resolution.status === 'error') {
    root.render(
      <ColorModeProvider>
        <ChakraProvider value={system}>
          <AuthConfigError {...resolution} apiUrl={appConfig.openeoApiUrl} />
        </ChakraProvider>
      </ColorModeProvider>
    );
    return;
  }

  root.render(<Root resolution={resolution} />);
}

bootstrap();
