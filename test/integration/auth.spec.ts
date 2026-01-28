import { test, expect } from '@playwright/test';
import { mockUnauthenticatedUser } from './helpers/mock-auth';

test.describe('Authentication UI Flow (mocked)', () => {
  test('should show login dialog when unauthenticated on editor page', async ({
    page
  }) => {
    await mockUnauthenticatedUser(page);
    await page.goto('/editor');

    // Login dialog should be visible
    await expect(
      page.getByRole('heading', { name: 'Authentication Required' })
    ).toBeVisible();
    await expect(
      page.getByText('Sign in to your account to analyze satellite data')
    ).toBeVisible();

    // Login button should be present
    const loginButton = page.getByRole('button', { name: /login/i }).first();
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('should blur map when unauthenticated', async ({ page }) => {
    await mockUnauthenticatedUser(page);
    await page.goto('/editor');

    // Wait for map to load
    await page.waitForTimeout(1000);

    // Check that map container has blur filter
    const mapContainer = page.locator('[class*="maplibregl-map"]').first();
    if (await mapContainer.count()) {
      const parent = mapContainer.locator('..');
      const filter = await parent.evaluate(
        (el) => window.getComputedStyle(el).filter
      );
      expect(filter).toContain('blur');
    }
  });

  test('should show login button in header when unauthenticated', async ({
    page
  }) => {
    await mockUnauthenticatedUser(page);
    await page.goto('/');

    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
  });

  test('should keep Apply button disabled when unauthenticated', async ({
    page
  }) => {
    await mockUnauthenticatedUser(page);
    await page.goto('/editor');

    // Apply button should be disabled
    const applyButton = page.getByRole('button', { name: /apply/i });
    await expect(applyButton).toBeDisabled();
  });
});
