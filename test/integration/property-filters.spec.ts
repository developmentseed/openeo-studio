import { expect, type Page } from '@playwright/test';
import { test } from './__fixtures__';

const QUERYABLES_ENDPOINT = {
  path: '/collections/{collection_id}/queryables',
  methods: ['GET']
};

/**
 * Serves backend capabilities with the queryables endpoint, and `properties`
 * as the queryables of every collection.
 */
async function mockQueryables(page: Page, properties: Record<string, unknown>) {
  await page.route(
    (url) => url.hostname !== 'localhost' && url.pathname.endsWith('/'),
    (route) =>
      route.request().resourceType() === 'fetch'
        ? route.fulfill({ json: { endpoints: [QUERYABLES_ENDPOINT] } })
        : route.fallback()
  );
  await page.route('**/collections/*/queryables', (route) =>
    route.fulfill({ json: { type: 'object', properties } })
  );
}

test.describe('Property filters', () => {
  test('adds a filter on a collection queryable', async ({
    authenticatedPage
  }) => {
    await mockQueryables(authenticatedPage, {
      'eo:cloud_cover': { type: 'number' },
      'sat:orbit_state': {
        title: 'Orbit state',
        enum: ['ascending', 'descending']
      }
    });
    await authenticatedPage.goto('/editor');
    await authenticatedPage
      .getByRole('tab', { name: /configuration/i })
      .click();

    await authenticatedPage
      .getByLabel('Add property filter')
      .selectOption('sat:orbit_state');
    const value = authenticatedPage.getByLabel('sat:orbit_state value');
    await expect(value).toHaveValue('ascending');
    await value.selectOption('descending');

    // The default cloud cover filter stays, with its slider (range 0-100).
    await expect(
      authenticatedPage.getByLabel('eo:cloud_cover value')
    ).toHaveValue('50');
    await expect(authenticatedPage.getByRole('slider')).toHaveCount(1);

    await expect
      .poll(() =>
        authenticatedPage.evaluate(() =>
          sessionStorage.getItem('openeo-editor-storage')
        )
      )
      .toContain('"value":"descending"');

    await authenticatedPage
      .getByRole('button', { name: 'Remove sat:orbit_state filter' })
      .click();
    await expect(value).toHaveCount(0);
  });

  test('drops the cloud cover filter when it is not a queryable', async ({
    authenticatedPage
  }) => {
    await mockQueryables(authenticatedPage, {
      'sat:orbit_state': { enum: ['ascending', 'descending'] }
    });
    await authenticatedPage.goto('/editor');
    await authenticatedPage
      .getByRole('tab', { name: /configuration/i })
      .click();

    await expect(
      authenticatedPage.getByText(/no filter: all the items/i)
    ).toBeVisible();
    await expect(authenticatedPage.getByRole('slider')).toHaveCount(0);
    await expect
      .poll(() =>
        authenticatedPage.evaluate(() =>
          sessionStorage.getItem('openeo-editor-storage')
        )
      )
      .not.toContain('eo:cloud_cover');
  });
});
