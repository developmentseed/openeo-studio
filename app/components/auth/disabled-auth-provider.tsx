import { createContext, ReactNode, useContext } from 'react';
import { AuthContext, AuthContextProps } from 'react-oidc-context';

const noop = async () => undefined;
const noopUnsubscribe = () => () => {};

// The auth context when the backend has no OpenID Connect provider. Nobody can
// log in. Components that use `useAuth()` see a signed-out user.
const disabledAuthContext = {
  isLoading: false,
  isAuthenticated: false,
  user: undefined,
  error: undefined,
  activeNavigator: undefined,
  settings: {},
  events: {
    load: noop,
    unload: noop,
    addUserLoaded: noopUnsubscribe,
    removeUserLoaded: () => {},
    addUserUnloaded: noopUnsubscribe,
    removeUserUnloaded: () => {},
    addAccessTokenExpiring: noopUnsubscribe,
    removeAccessTokenExpiring: () => {},
    addAccessTokenExpired: noopUnsubscribe,
    removeAccessTokenExpired: () => {},
    addSilentRenewError: noopUnsubscribe,
    removeSilentRenewError: () => {},
    addUserSignedIn: noopUnsubscribe,
    removeUserSignedIn: () => {},
    addUserSignedOut: noopUnsubscribe,
    removeUserSignedOut: () => {},
    addUserSessionChanged: noopUnsubscribe,
    removeUserSessionChanged: () => {}
  },
  signinRedirect: noop,
  signinSilent: async () => null,
  signinPopup: async () => {
    throw new Error('Login is not available on this openEO backend.');
  },
  signinResourceOwnerCredentials: async () => {
    throw new Error('Login is not available on this openEO backend.');
  },
  signoutRedirect: noop,
  signoutPopup: noop,
  signoutSilent: noop,
  removeUser: noop,
  revokeTokens: noop,
  startSilentRenew: () => {},
  stopSilentRenew: () => {},
  clearStaleState: noop,
  querySessionStatus: async () => null
} as unknown as AuthContextProps;

const AuthDisabledContext = createContext(false);

/** True when the backend has no OpenID Connect provider. */
export function useIsAuthDisabled(): boolean {
  return useContext(AuthDisabledContext);
}

export function DisabledAuthProvider({ children }: { children?: ReactNode }) {
  return (
    <AuthDisabledContext.Provider value>
      <AuthContext.Provider value={disabledAuthContext}>
        {children}
      </AuthContext.Provider>
    </AuthDisabledContext.Provider>
  );
}
