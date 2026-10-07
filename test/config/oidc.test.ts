import {
  fetchOidcProviders,
  matchRedirectUrl,
  OidcProvider,
  OidcProvidersResult,
  resolveOidcSettings,
  selectDefaultClient,
  toScope
} from '$config/oidc';

const ENTRA_CLIENT = '4c866cbc-a39d-4eff-b598-73e23309b51c';
const ENTRA_AUTHORITY = 'https://login.microsoftonline.com/common/v2.0';

const location = { origin: 'https://studio.example.com', pathPrefix: '' };
const prefixedLocation = {
  origin: 'https://studio.example.com',
  pathPrefix: '/studio'
};

function entraProvider(redirectUrls: string[]): OidcProvider {
  return {
    id: 'oidc',
    issuer: ENTRA_AUTHORITY,
    scopes: [
      'openid',
      'profile',
      'email',
      'offline_access',
      `api://${ENTRA_CLIENT}/openeo`
    ],
    default_clients: [
      {
        id: ENTRA_CLIENT,
        grant_types: [
          'authorization_code+pkce',
          'urn:ietf:params:oauth:grant-type:device_code+pkce',
          'refresh_token'
        ],
        redirect_urls: redirectUrls
      }
    ]
  };
}

function ok(...providers: OidcProvider[]): OidcProvidersResult {
  return { status: 'ok', data: { providers } };
}

describe('matchRedirectUrl', () => {
  const client = (redirect_urls?: string[]) => ({
    id: 'c',
    grant_types: ['authorization_code+pkce'],
    redirect_urls
  });

  it('matches the app root with or without a trailing slash', () => {
    expect(
      matchRedirectUrl(client(['https://studio.example.com']), location)
    ).toBe('https://studio.example.com');
    expect(
      matchRedirectUrl(client(['https://studio.example.com/']), location)
    ).toBe('https://studio.example.com/');
  });

  it('prefers the app root to a different URL in the app', () => {
    expect(
      matchRedirectUrl(
        client([
          'https://studio.example.com/callback',
          'https://studio.example.com/'
        ]),
        location
      )
    ).toBe('https://studio.example.com/');
  });

  it('accepts a URL in the app when the root is not registered', () => {
    expect(
      matchRedirectUrl(
        client(['https://studio.example.com/studio/callback']),
        prefixedLocation
      )
    ).toBe('https://studio.example.com/studio/callback');
  });

  it('does not match a different origin, port or path prefix', () => {
    expect(
      matchRedirectUrl(
        client([
          'https://other.example.com/',
          'https://studio.example.com:8443/',
          'https://studio.example.com.evil.com/'
        ]),
        location
      )
    ).toBeUndefined();
    expect(
      matchRedirectUrl(
        client([
          'https://studio.example.com/',
          'https://studio.example.com/studio-other/'
        ]),
        prefixedLocation
      )
    ).toBeUndefined();
  });

  it('returns undefined when the client has no redirect URLs', () => {
    expect(matchRedirectUrl(client(undefined), location)).toBeUndefined();
  });
});

describe('selectDefaultClient', () => {
  it('ignores a client without the authorization_code+pkce grant type', () => {
    const provider: OidcProvider = {
      id: 'p',
      issuer: 'https://idp',
      default_clients: [
        {
          id: 'device-only',
          grant_types: ['urn:ietf:params:oauth:grant-type:device_code+pkce'],
          redirect_urls: ['https://studio.example.com/']
        },
        {
          id: 'browser',
          grant_types: ['authorization_code+pkce'],
          redirect_urls: ['https://studio.example.com/']
        }
      ]
    };
    expect(selectDefaultClient(provider, location)?.client.id).toBe('browser');
  });

  it('ignores a client without a redirect URL for this app', () => {
    const provider: OidcProvider = {
      id: 'p',
      issuer: 'https://idp',
      default_clients: [
        {
          id: 'editor',
          grant_types: ['authorization_code+pkce'],
          redirect_urls: ['https://editor.openeo.org/']
        },
        {
          id: 'studio',
          grant_types: ['authorization_code+pkce'],
          redirect_urls: ['https://studio.example.com/']
        }
      ]
    };
    expect(selectDefaultClient(provider, location)).toEqual({
      client: provider.default_clients![1],
      redirectUrl: 'https://studio.example.com/'
    });
  });

  it('returns undefined when the provider has no default clients', () => {
    expect(
      selectDefaultClient({ id: 'p', issuer: 'https://idp' }, location)
    ).toBeUndefined();
  });
});

describe('toScope', () => {
  it('joins the scopes', () => {
    expect(toScope(['openid', 'profile', `api://${ENTRA_CLIENT}/openeo`])).toBe(
      `openid profile api://${ENTRA_CLIENT}/openeo`
    );
  });

  it('adds openid when it is not there', () => {
    expect(toScope(['email'])).toBe('openid email');
  });

  it('uses openid when there are no scopes', () => {
    expect(toScope(undefined)).toBe('openid');
    expect(toScope([])).toBe('openid');
  });
});

describe('resolveOidcSettings', () => {
  it('uses the backend issuer, scopes and default client', () => {
    expect(
      resolveOidcSettings(
        ok(entraProvider(['https://studio.example.com/'])),
        {},
        location
      )
    ).toEqual({
      status: 'ok',
      providerId: 'oidc',
      settings: {
        authority: ENTRA_AUTHORITY,
        client_id: ENTRA_CLIENT,
        redirect_uri: 'https://studio.example.com/',
        scope: `openid profile email offline_access api://${ENTRA_CLIENT}/openeo`
      }
    });
  });

  it('uses the first provider that has a client for this app', () => {
    const other: OidcProvider = {
      id: 'egi',
      issuer: 'https://egi',
      default_clients: [
        {
          id: 'x',
          grant_types: ['authorization_code+pkce'],
          redirect_urls: ['https://editor.openeo.org/']
        }
      ]
    };
    const entra = {
      ...entraProvider(['https://studio.example.com/']),
      id: 'entra'
    };
    const result = resolveOidcSettings(ok(other, entra), {}, location);
    expect(result.status === 'ok' && result.providerId).toBe('entra');
  });

  it('lets each AUTH_* override win over the backend value', () => {
    const backend = ok(entraProvider(['https://studio.example.com/']));

    const authority = resolveOidcSettings(
      backend,
      { authority: 'https://login.microsoftonline.com/my-tenant/v2.0' },
      location
    );
    expect(authority.status === 'ok' && authority.settings).toEqual({
      authority: 'https://login.microsoftonline.com/my-tenant/v2.0',
      client_id: ENTRA_CLIENT,
      redirect_uri: 'https://studio.example.com/',
      scope: `openid profile email offline_access api://${ENTRA_CLIENT}/openeo`
    });

    const client = resolveOidcSettings(
      backend,
      { clientId: 'my-client', redirectUri: 'https://studio.example.com/cb' },
      location
    );
    expect(client.status === 'ok' && client.settings).toMatchObject({
      authority: ENTRA_AUTHORITY,
      client_id: 'my-client',
      redirect_uri: 'https://studio.example.com/cb'
    });
  });

  it('uses the client id override when no backend client matches', () => {
    const result = resolveOidcSettings(
      ok(entraProvider(['https://editor.openeo.org/'])),
      { clientId: 'my-client' },
      location
    );
    expect(result).toEqual({
      status: 'ok',
      providerId: 'oidc',
      settings: {
        authority: ENTRA_AUTHORITY,
        client_id: 'my-client',
        redirect_uri: 'https://studio.example.com/',
        scope: `openid profile email offline_access api://${ENTRA_CLIENT}/openeo`
      }
    });
  });

  it('prefers the provider whose issuer is the authority override', () => {
    const a = { ...entraProvider(['https://studio.example.com/']), id: 'a' };
    const b = {
      ...entraProvider(['https://studio.example.com/']),
      id: 'b',
      issuer: 'https://idp-b/'
    };
    const result = resolveOidcSettings(
      ok(a, b),
      { authority: 'https://idp-b' },
      location
    );
    expect(result.status === 'ok' && result.providerId).toBe('b');
  });

  it('gives a no-client error when no client matches this app', () => {
    const result = resolveOidcSettings(
      ok(entraProvider(['https://editor.openeo.org/'])),
      {},
      location
    );
    expect(result).toMatchObject({ status: 'error', reason: 'no-client' });
    expect(result.status === 'error' && result.details?.[0]).toContain(
      'https://editor.openeo.org/'
    );
  });

  it('disables login when the backend has no OIDC and there are no overrides', () => {
    expect(resolveOidcSettings({ status: 'none' }, {}, location)).toEqual({
      status: 'disabled'
    });
  });

  it('uses the full override when the backend has no OIDC or cannot be reached', () => {
    const expected = {
      status: 'ok',
      providerId: 'oidc',
      settings: {
        authority: 'https://idp',
        client_id: 'c',
        redirect_uri: 'https://studio.example.com/studio/',
        scope: 'openid'
      }
    };
    const overrides = { authority: 'https://idp', clientId: 'c' };
    expect(
      resolveOidcSettings({ status: 'none' }, overrides, prefixedLocation)
    ).toEqual(expected);
    expect(
      resolveOidcSettings(
        { status: 'error', message: 'down' },
        overrides,
        prefixedLocation
      )
    ).toEqual(expected);
  });

  it('gives an unreachable error when the backend cannot be reached', () => {
    expect(
      resolveOidcSettings({ status: 'error', message: 'down' }, {}, location)
    ).toMatchObject({
      status: 'error',
      reason: 'unreachable',
      details: ['down']
    });
  });

  it('gives an incomplete error for a partial override without backend OIDC', () => {
    expect(
      resolveOidcSettings({ status: 'none' }, { clientId: 'c' }, location)
    ).toMatchObject({ status: 'error', reason: 'incomplete' });
  });
});

describe('fetchOidcProviders', () => {
  const apiUrl = 'https://api.example.com/openeo/';

  function response(status: number, body?: unknown): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: '',
      json: async () => body
    } as Response;
  }

  beforeAll(() => {
    // jsdom has no AbortSignal.timeout().
    if (!AbortSignal.timeout) {
      AbortSignal.timeout = () => new AbortController().signal;
    }
  });

  beforeEach(() => window.sessionStorage.clear());

  it('gets the providers and keeps them in sessionStorage', async () => {
    const data = {
      providers: [entraProvider(['https://studio.example.com/'])]
    };
    const fetchFn = jest.fn(async () => response(200, data));

    expect(await fetchOidcProviders(apiUrl, fetchFn)).toEqual({
      status: 'ok',
      data
    });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/openeo/credentials/oidc',
      expect.anything()
    );

    // Second call (for example the OIDC callback): no fetch.
    expect(await fetchOidcProviders(apiUrl, fetchFn)).toEqual({
      status: 'ok',
      data
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('gives none for a backend without OIDC', async () => {
    expect(await fetchOidcProviders(apiUrl, async () => response(404))).toEqual(
      { status: 'none' }
    );
    expect(
      await fetchOidcProviders(apiUrl, async () =>
        response(200, { providers: [] })
      )
    ).toEqual({ status: 'none' });
  });

  it('gives an error when the backend cannot be reached', async () => {
    const result = await fetchOidcProviders(apiUrl, async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(result).toMatchObject({ status: 'error' });
    expect(result.status === 'error' && result.message).toContain(
      'Failed to fetch'
    );
  });

  it('gives an error for a server error or a response that is not valid', async () => {
    expect(
      await fetchOidcProviders(apiUrl, async () => response(500))
    ).toMatchObject({ status: 'error' });
    expect(
      await fetchOidcProviders(apiUrl, async () => response(200, { foo: 1 }))
    ).toMatchObject({ status: 'error' });
    expect(window.sessionStorage.length).toBe(0);
  });
});
