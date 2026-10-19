import { expect } from '@playwright/test';
import { test } from './__fixtures__';

/** base64url of UTF-8 JSON, as an agent makes it. */
function encode(sample: object): string {
  return Buffer.from(JSON.stringify(sample)).toString('base64url');
}

const SAMPLE = {
  name: 'NDVI Rome from a link',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-07-01', '2025-07-15'],
  bands: ['reflectance|bands=b04', 'reflectance|bands=b08'],
  boundingBox: [12.35, 41.8, 12.6, 41.98],
  cloudCover: 20,
  code: '# prefill marker\nadd_graph_to_map(reduced.save_result("PNG"), "x")\n'
};

test.describe('Prefill link', () => {
  test('loads the sample, shows a warning, and does not run it', async ({
    authenticatedPage: page
  }) => {
    const serviceCalls: string[] = [];
    // Only the openEO API path, not the dev server modules (services.ts).
    const isServicesApi = (url: URL) =>
      /\/services(\/[^/.]+)?$/.test(url.pathname);
    await page.route(isServicesApi, async (route) => {
      if (route.request().method() !== 'GET') {
        serviceCalls.push(route.request().method());
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ services: [] })
      });
    });

    await page.goto(`/editor?sample=${encode(SAMPLE)}`);

    await expect(
      page.getByRole('heading', { name: /NDVI Rome from a link/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('This sample comes from the link')
    ).toBeVisible();
    await expect(
      page.locator('.cm-content[contenteditable="true"]')
    ).toContainText('prefill marker');

    // The query is removed, so a reload keeps the edits of the user.
    await expect(page).toHaveURL(/\/editor$/);

    // Give a possible auto-run the time to start.
    await page.waitForTimeout(3000);
    expect(serviceCalls).toEqual([]);
  });

  test('shows an error for a sample that is not valid', async ({
    authenticatedPage: page
  }) => {
    await page.goto(`/editor?sample=${encode({ ...SAMPLE, bands: [] })}`);

    await expect(page.getByText('Cannot load the sample')).toBeVisible({
      timeout: 15000
    });
    await expect(page.getByText(/"bands" must be a list/)).toBeVisible();
  });
});
