/**
 * Mock authentication provider for Playwright integration tests.
 * This bypasses real OIDC authentication and provides a mock auth context
 * when window.__MOCK_AUTH__ is set in the test environment.
 *
 * @see test/integration/fixtures.ts for usage
 */

import { AuthContext, AuthContextProps } from 'react-oidc-context';
import { User } from 'oidc-client-ts';

export interface MockAuthState {
  isAuthenticated: boolean;
  user?: User;
}

interface MockAuthProviderProps {
  children?: React.ReactNode;
}

export function MockAuthProvider({ children }: MockAuthProviderProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockState = (window as any).__MOCK_AUTH__ as MockAuthState;
  // Create a mock auth context with minimal required properties for test mode
  const authContext: AuthContextProps = {
    isLoading: false,
    isAuthenticated: mockState.isAuthenticated || false,
    user: mockState.user,
    error: undefined,
    activeNavigator: undefined,
    // @ts-expect-error - Events interface requires more properties than we need for tests
    events: {
      load: async () => {},
      unload: async () => {},
      addUserLoaded: () => () => {},
      removeUserLoaded: () => {},
      addUserUnloaded: () => () => {},
      removeUserUnloaded: () => {},
      addAccessTokenExpiring: () => () => {},
      removeAccessTokenExpiring: () => {},
      addAccessTokenExpired: () => () => {},
      removeAccessTokenExpired: () => {},
      addSilentRenewError: () => () => {},
      removeSilentRenewError: () => {}
    },
    // @ts-expect-error - Settings interface requires more properties than we need for tests
    settings: {},
    signinRedirect: async () => undefined,
    signinSilent: async () => mockState?.user || (null as unknown as User),
    signinPopup: async () => mockState?.user || (null as unknown as User),
    signinResourceOwnerCredentials: async () =>
      mockState?.user || (null as unknown as User),
    signoutRedirect: async () => undefined,
    signoutPopup: async () => undefined,
    signoutSilent: async () => undefined,
    removeUser: async () => undefined,
    revokeTokens: async () => undefined,
    startSilentRenew: () => {},
    stopSilentRenew: () => {},
    clearStaleState: async () => undefined,
    querySessionStatus: async () => null
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

declare global {
  interface Window {
    __MOCK_AUTH__?: MockAuthState;
  }
}
