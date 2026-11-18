import { test as base, Page } from '@playwright/test';

const SENTINEL_2_L2A = {
  id: 'sentinel-2-l2a',
  type: 'Collection',
  summaries: {
    bands: [
      'b02',
      'b03',
      'b04',
      'b05',
      'b06',
      'b07',
      'b08',
      'b8a',
      'b11',
      'b12'
    ].map((band) => ({ name: `reflectance|bands=${band}`, description: band }))
  }
};

/**
 * Opens a bundled sample from the landing page. Samples load into /editor;
 * only saved projects have their own URL.
 */
export async function openSample(page: Page, name: RegExp) {
  await page.goto('/');
  await page.getByRole('link').filter({ hasText: name }).first().click();
  await page.waitForURL('/editor');
  // Navigation commits in a transition, so wait for the editor itself.
  await page.getByRole('tab', { name: /python/i }).waitFor();
}

// Extend base test with authentication fixtures
export const test = base.extend<{
  authenticatedPage: Page;
  page: Page;
}>({
  // Override default page fixture to mock Pyodide for all tests
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      // Mock Pyodide to prevent WebAssembly memory allocation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).loadPyodide = async () => ({
        runPythonAsync: async () => undefined,
        FS: {
          writeFile: () => {},
          readFile: () => new Uint8Array()
        },
        loadPackage: async () => {},
        pyimport: () => ({})
      });
    });
    // Mock the backend OIDC configuration so that the tests do not depend on
    // a live openEO backend. The client accepts the Playwright app URL.
    await page.route('**/credentials/oidc', (route) =>
      route.fulfill({
        json: {
          providers: [
            {
              id: 'oidc',
              issuer: 'http://localhost:9100/mock-oidc',
              title: 'Mock OIDC',
              scopes: ['openid', 'profile', 'email'],
              default_clients: [
                {
                  id: 'test-client-id',
                  grant_types: ['authorization_code+pkce'],
                  redirect_urls: ['http://localhost:9100/']
                }
              ]
            }
          ]
        }
      })
    );
    // The bundled samples use the EOPF backend's band names. Serve that
    // collection so the catalogue compatibility check passes offline.
    await page.route('**/collections/sentinel-2-l2a', (route) =>
      route.fulfill({ json: SENTINEL_2_L2A })
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },

  authenticatedPage: async ({ page }, use) => {
    // Inject mock auth state before the app loads
    await page.addInitScript(() => {
      const mockAuth = {
        isAuthenticated: true,
        user: {
          id_token: 'mock-id-token',
          session_state: null,
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          scope: 'openid profile email',
          profile: {
            iss: 'http://localhost:9100/mock-oidc',
            sub: '123',
            aud: 'test-client-id',
            exp: 1800000000,
            iat: 1700000000,
            email: 'test@example.com',
            email_verified: true,
            name: 'Playwright Tester'
          },
          expires_at: 1800000000
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__MOCK_AUTH__ = mockAuth;
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  }
});

export { expect } from '@playwright/test';
