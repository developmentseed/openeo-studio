import { test as base, Page } from '@playwright/test';

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
            iss: 'http://localhost:9000/mock-oidc',
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
