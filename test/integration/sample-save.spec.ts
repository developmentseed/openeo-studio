import { expect } from '@playwright/test';
import { openSample, test } from './__fixtures__';

test.describe('Sample save', () => {
  test('opening a sample does not PUT a process graph', async ({
    authenticatedPage
  }) => {
    const putCalls: string[] = [];

    await authenticatedPage.route('**/process_graphs**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        putCalls.push(`${method} ${route.request().url()}`);
      }
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ processes: [] })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'ignored' })
      });
    });

    await openSample(authenticatedPage, /Sunny day with Sentinel-2 L2A/i);
    await expect(
      authenticatedPage.getByRole('heading', {
        name: /Sunny day with Sentinel-2 L2A/i
      })
    ).toBeVisible({ timeout: 15000 });

    // Allow auto-execute window to settle
    await authenticatedPage.waitForTimeout(3000);
    expect(putCalls).toEqual([]);
  });
});
