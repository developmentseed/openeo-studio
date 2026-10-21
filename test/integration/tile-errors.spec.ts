import { expect } from '@playwright/test';
import { test } from './__fixtures__';

const SERVICE_ID = 'tile-error-test';

test.describe('Tile errors', () => {
  test('shows Processing, then the backend error with advice', async ({
    authenticatedPage: page
  }) => {
    // An empty base style: the tests have no MapTiler key, and the map
    // does not load without a style.
    await page.route('https://api.maptiler.com/**', (route) =>
      route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: { version: 8, sources: {}, layers: [] }
      })
    );

    // The service of the share page. Only the API path, not services.ts.
    await page.route(
      (url) => url.pathname.endsWith(`/services/${SERVICE_ID}`),
      (route) =>
        route.fulfill({
          json: {
            id: SERVICE_ID,
            url: 'https://tiles.test/{z}/{x}/{y}',
            title: 'Tile error test',
            type: 'XYZ',
            enabled: true,
            configuration: { extent: [12.35, 41.8, 12.6, 41.98] }
          }
        })
    );

    // Every tile fails as titiler-openeo does when there are too many items.
    await page.route('https://tiles.test/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: {
          code: 'ItemsLimitExceeded',
          message:
            'Number of items in the workflow pipeline exceeds maximum allowed: 21 (max allowed: 20)'
        }
      });
    });

    await page.goto(`/share/${SERVICE_ID}`);

    await expect(page.getByText('Processing…')).toBeVisible({
      timeout: 15000
    });
    await expect(page.getByText(/ItemsLimitExceeded/)).toBeVisible({
      timeout: 15000
    });
    await expect(page.getByText(/Use a shorter date range/)).toBeVisible();
    await expect(page.getByText(/max allowed: 20/)).toBeVisible();
    await expect(page.getByText('Processing…')).toBeHidden();
  });
});
