import { Page } from '@playwright/test';

/** * TODO: Implement proper authenticated user mocking
 *
 * Currently only unauthenticated state can be reliably mocked.
 * react-oidc-context loads user state synchronously from localStorage
 * during provider initialization, before test scripts can inject state.
 *
 * To fix this, we need either:
 * 1. Actual OIDC provider setup (authority + clientId) in test environment
 * 2. Mock the entire oidc-client-ts library internals
 * 3. Provide an alternate auth context provider for testing
 *
 */

/** * Mock authentication state in localStorage to simulate logged-in user
 *
 * Uses addInitScript to set localStorage before the React app mounts.
 * The key must match what WebStorageStateStore uses: `oidc.user:{authority}:{clientId}`
 * With empty authority/clientId, the key is `oidc.user::`
 */
export async function mockAuthenticatedUser(page: Page) {
  // Set localStorage before any page navigation
  await page.addInitScript(() => {
    const mockUser = JSON.stringify({
      id_token: 'mock_id_token',
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      scope: 'openid profile email',
      profile: {
        sub: 'mock-user-id',
        iss: 'http://localhost:9000',
        aud: 'test-client',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User'
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      state: null,
      session_state: null
    });

    // WebStorageStateStore key format: oidc.user:{authority}:{clientId}
    // With empty values, key is: oidc.user::
    localStorage.setItem('oidc.user::', mockUser);
  });

  // Also set it again after page load to be sure
  await page.goto('/');
  await page.evaluate(() => {
    const mockUser = JSON.stringify({
      id_token: 'mock_id_token',
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      scope: 'openid profile email',
      profile: {
        sub: 'mock-user-id',
        iss: 'http://localhost:9000',
        aud: 'test-client',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User'
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      state: null,
      session_state: null
    });
    localStorage.setItem('oidc.user::', mockUser);
  });
}

/**
 * Mock unauthenticated state (clear auth from localStorage)
 */
export async function mockUnauthenticatedUser(page: Page) {
  await page.addInitScript(() => {
    // Clear all OIDC-related localStorage entries
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('oidc')) {
        keys.push(key);
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
  });
}

/**
 * Mock STAC API responses
 */
export async function mockStacAPI(page: Page) {
  await page.route('**/api.explorer.eopf.copernicus.eu/**', (route) => {
    const url = route.request().url();

    if (url.includes('/collections/')) {
      // Mock collection response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'sentinel-2-l2a',
          type: 'Collection',
          stac_version: '1.0.0',
          description: 'Mock Sentinel-2 collection'
        })
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock OAuth silent signin success
 */
export async function mockSilentSigninSuccess(page: Page) {
  await page.route('**/*', (route) => {
    if (route.request().resourceType() === 'iframe') {
      // Mock successful silent signin in iframe
      route.fulfill({
        status: 200,
        body: '<html><body>Silent signin success</body></html>'
      });
    } else {
      route.continue();
    }
  });
}
