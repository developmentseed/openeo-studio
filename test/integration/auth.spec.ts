import { expect } from '@playwright/test';
import { test } from './__fixtures__';

test.describe('Unauthenticated UI', () => {
  test('should show login dialog on editor page', async ({ page }) => {
    await page.goto('/editor');

    // Login dialog should be visible
    await expect(
      page.getByRole('heading', { name: 'Authentication Required' })
    ).toBeVisible();
    await expect(
      page.getByText('Sign in to your account to analyze satellite data')
    ).toBeVisible();

    // Login button in dialog should be present and enabled
    const loginButton = page
      .getByRole('dialog')
      .getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('should blur map when unauthenticated', async ({ page }) => {
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

  test('should show login button in header', async ({ page }) => {
    await page.goto('/');

    // Login button in header - match by role and name
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
  });

  test('should disable Apply button in toolbar', async ({ page }) => {
    await page.goto('/editor');

    // Apply button should be disabled
    const applyButton = page.getByRole('button', { name: /apply/i });
    await expect(applyButton).toBeDisabled();
  });

  test('should not show login hint in editor toolbar', async ({ page }) => {
    await page.goto('/editor');

    // Hint text should not be visible
    const hintText = page.getByText('Log in to run analysis');
    await expect(hintText).not.toBeVisible();
  });
});

test.describe('Authenticated UI', () => {
  test('should hide login dialog', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/editor');

    // Login dialog should not be visible when authenticated
    await expect(
      authenticatedPage.getByRole('heading', {
        name: 'Authentication Required'
      })
    ).not.toBeVisible();
  });

  test('should show logout button with user avatar in header', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/');

    // Logout button in header
    const logoutButton = authenticatedPage.getByRole('button', {
      name: /logout/i
    });
    await expect(logoutButton).toBeVisible();

    // Should have user avatar image
    await expect(logoutButton.locator('img')).toBeVisible();
  });

  test('should enable Apply button after code change', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/editor');

    const applyButton = authenticatedPage.getByRole('button', {
      name: /apply/i
    });
    await expect(
      applyButton,
      'Apply button should be initially disabled'
    ).toBeDisabled();

    // Switch to code tab and change code to enable Apply
    const codeTab = authenticatedPage.getByRole('tab', { name: /code/i });
    await codeTab.click();
    await expect(codeTab).toHaveAttribute('aria-selected', 'true');

    const codeEditorContent = authenticatedPage.locator(
      '.cm-content[contenteditable="true"]'
    );
    await expect(codeEditorContent.first()).toBeVisible({ timeout: 15000 });
    await codeEditorContent.click();
    await codeEditorContent.pressSequentially('\n# change', { delay: 10 });

    await expect(
      applyButton,
      'Apply button should be enabled after code change when authenticated and ready'
    ).toBeEnabled();
  });

  test('should enable Apply button after config change', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/editor/sentinel-2-apa');

    const applyButton = authenticatedPage.getByRole('button', {
      name: /apply/i
    });
    await expect(
      applyButton,
      'Apply button should be initially disabled'
    ).toBeDisabled();

    // Switch to configuration tab and change cloud cover
    const configTab = authenticatedPage.getByRole('tab', {
      name: /configuration/i
    });
    await configTab.click();
    await expect(configTab).toHaveAttribute('aria-selected', 'true');

    // Change the temporal range
    const startDateInput = authenticatedPage
      .locator('input[type="date"]')
      .first();
    await expect(startDateInput).toBeVisible({ timeout: 10000 });
    await startDateInput.fill('2025-05-02');
    // Manually dispatch change event to ensure React onChange fires
    await startDateInput.evaluate((el: HTMLInputElement) => {
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(
      applyButton,
      'Apply button should be enabled after config change when authenticated'
    ).toBeEnabled();
  });
});
