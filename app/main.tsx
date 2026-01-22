import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { StacApiProvider } from '@developmentseed/stac-react';
import { BrowserRouter } from 'react-router';
import { WebStorageStateStore } from 'oidc-client-ts';

import { PyodideProvider } from '$contexts/pyodide-context';

import system from './styles/theme';

import App from './app';

const authAuthority = import.meta.env.VITE_AUTH_AUTHORITY || '';
const authClientId = import.meta.env.VITE_AUTH_CLIENT_ID || '';
const authRedirectUri = import.meta.env.VITE_AUTH_REDIRECT_URI || '';

const oidcConfig: AuthProviderProps = {
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  authority: authAuthority,
  client_id: authClientId,
  redirect_uri: authRedirectUri
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
          <StacApiProvider apiUrl='https://api.explorer.eopf.copernicus.eu/openeo'>
            <PyodideProvider>
              <App />
            </PyodideProvider>
          </StacApiProvider>
        </ChakraProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

const rootNode = document.querySelector('#app-container')!;
const root = createRoot(rootNode);
root.render(<Root />);
