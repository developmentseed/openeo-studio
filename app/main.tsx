import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { StacApiProvider } from '@developmentseed/stac-react';
import { BrowserRouter } from 'react-router';

import { PyodideProvider } from '$contexts/pyodide-context';

import system from './styles/theme';

import App from './app';
import ErrorBoundary from '$pages/uhoh/boundary';

const publicUrl = import.meta.env.VITE_BASE_URL || '';
const authAuthority = import.meta.env.VITE_AUTH_AUTHORITY || '';
const authClientId = import.meta.env.VITE_AUTH_CLIENT_ID || '';

const baseName = new URL(
  publicUrl.startsWith('http')
    ? publicUrl
    : `https://ds.io/${publicUrl.replace(/^\//, '')}`
).pathname;

const authRedirectUri = `${window.location.protocol}//${window.location.host}${baseName}`;

const oidcConfig: AuthProviderProps = {
  authority: authAuthority,
  client_id: authClientId,
  redirect_uri: authRedirectUri,
  onSigninCallback: () => {
    window.history.replaceState({}, '', '/');
  },
  onRemoveUser: () => {
    window.history.replaceState({}, '', '/');
  }
};

// Root component.
function Root() {
  useEffect(() => {
    // Hide the welcome banner.
    const banner = document.querySelector('#welcome-banner')!;
    banner.classList.add('dismissed');
    setTimeout(() => banner.remove(), 500);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider {...oidcConfig}>
        <ChakraProvider value={system}>
          <ErrorBoundary>
            <StacApiProvider apiUrl='https://api.explorer.eopf.copernicus.eu/openeo'>
              <PyodideProvider>
                <App />
              </PyodideProvider>
            </StacApiProvider>
          </ErrorBoundary>
        </ChakraProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

const rootNode = document.querySelector('#app-container')!;
const root = createRoot(rootNode);
root.render(<Root />);
