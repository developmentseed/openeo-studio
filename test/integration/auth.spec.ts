import { expect } from '@playwright/test';
import { test } from './__fixtures__';

test.describe('Unauthenticated UI', () => {
  test('should show restricted page on editor route', async ({ page }) => {
    await page.goto('/editor');

    // Restricted page should be visible
    await expect(
      page.getByRole('heading', { name: 'Restricted' })
    ).toBeVisible();
    await expect(
      page.getByText('Sign in to your account to analyze satellite data')
    ).toBeVisible();

    // Sign-in button should be present and enabled
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('should show restricted page on other gated routes', async ({
    page
  }) => {
    for (const path of ['/projects', '/projects/samples']) {
      await page.goto(path);
      await expect(
        page.getByRole('heading', { name: 'Restricted' })
      ).toBeVisible();
    }
  });

  test('should show login button on landing page', async ({ page }) => {
    await page.goto('/');

    // Landing page includes Login CTAs when logged out
    const loginButton = page.getByRole('button', { name: /login/i }).first();
    await expect(loginButton).toBeVisible();
  });
});

test.describe('Authenticated UI', () => {
  test('should hide restricted page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/editor');

    // Restricted page should not be visible when authenticated
    await expect(
      authenticatedPage.getByRole('heading', {
        name: 'Restricted'
      })
    ).not.toBeVisible();
  });

  test('should show logout button with user avatar in header', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/');

    // Logout control is an icon button whose accessible name comes from the avatar
    const logoutButton = authenticatedPage.getByRole('button', {
      name: /user image/i
    });
    await expect(logoutButton).toBeVisible();

    // Should have user avatar image
    await expect(logoutButton.locator('img')).toBeVisible();
  });

  test('should enable Save button after code change', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/editor');

    const saveButton = authenticatedPage.getByRole('button', {
      name: /save/i
    });
    await expect(
      saveButton,
      'Save button should be initially disabled'
    ).toBeDisabled();

    // Switch to Python tab and change code to enable Save
    const codeTab = authenticatedPage.getByRole('tab', { name: /python/i });
    await codeTab.click();
    await expect(codeTab).toHaveAttribute('aria-selected', 'true');

    const codeEditorContent = authenticatedPage.locator(
      '.cm-content[contenteditable="true"]'
    );
    await expect(codeEditorContent.first()).toBeVisible({ timeout: 15000 });
    await codeEditorContent.click();
    await codeEditorContent.pressSequentially('\n# change', { delay: 10 });

    await expect(
      saveButton,
      'Save button should be enabled after code change when authenticated and ready'
    ).toBeEnabled();
  });

  test('should enable Save button after config change', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/editor/sentinel-2-apa');

    const saveButton = authenticatedPage.getByRole('button', {
      name: /save/i
    });
    await expect(
      saveButton,
      'Save button should be initially disabled'
    ).toBeDisabled();

    // Switch to configuration tab and change temporal range
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
      saveButton,
      'Save button should be enabled after config change when authenticated'
    ).toBeEnabled();
  });
});
