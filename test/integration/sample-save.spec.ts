import { expect } from '@playwright/test';
import { test } from './__fixtures__';

test.describe('Sample save confirmation', () => {
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

    await authenticatedPage.goto('/editor/sentinel-2-rgb');
    await expect(
      authenticatedPage.getByRole('heading', {
        name: /Sunny day with Sentinel-2 L2A/i
      })
    ).toBeVisible({ timeout: 15000 });

    // Allow auto-execute window to settle
    await authenticatedPage.waitForTimeout(3000);
    expect(putCalls).toEqual([]);
  });

  test('Save on a dirty sample opens claim dialog; Cancel does not navigate', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.route('**/process_graphs**', async (route) => {
      if (route.request().method() === 'GET') {
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
        body: JSON.stringify({ id: 'should-not-matter' })
      });
    });

    await authenticatedPage.goto('/editor/sentinel-2-rgb');

    const saveButton = authenticatedPage.getByRole('button', {
      name: /^Save$/
    });
    await expect(saveButton).toBeDisabled();

    const codeTab = authenticatedPage.getByRole('tab', { name: /python/i });
    await codeTab.click();
    const codeEditorContent = authenticatedPage.locator(
      '.cm-content[contenteditable="true"]'
    );
    await expect(codeEditorContent.first()).toBeVisible({ timeout: 15000 });
    await codeEditorContent.click();
    await codeEditorContent.pressSequentially('\n# change', { delay: 10 });

    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(
      authenticatedPage.getByRole('heading', {
        name: /Save to your account/i
      })
    ).toBeVisible();

    await authenticatedPage.getByRole('button', { name: /^Cancel$/ }).click();

    await expect(
      authenticatedPage.getByRole('heading', {
        name: /Save to your account/i
      })
    ).not.toBeVisible();
    await expect(authenticatedPage).toHaveURL(/\/editor\/sentinel-2-rgb/);
  });
});
