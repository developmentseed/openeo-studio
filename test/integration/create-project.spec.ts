import { expect } from '@playwright/test';
import { openSample, test } from './__fixtures__';

test.describe('Create project dialog', () => {
  test('starts a blank project', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Create new project' });
    await dialog.getByRole('button', { name: /blank project/i }).click();

    await page.waitForURL('/editor');
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole('tab', { name: /configuration/i })
    ).toBeVisible();
  });

  test('opens a sample', async ({ authenticatedPage: page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Create new project' });
    const sample = dialog.getByRole('link').first();
    const name = (await sample.textContent())!;
    await sample.click();

    await page.waitForURL('/editor');
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(name).first()).toBeVisible();
  });
});

test.describe('Create project dialog with unsaved work', () => {
  for (const choice of ['blank', 'sample'] as const) {
    test(`discards the work to open a ${choice} project`, async ({
      authenticatedPage: page
    }) => {
      await openSample(page, /Aquatic Plants and Algae/i);
      await page.getByRole('tab', { name: /python/i }).click();
      const editor = page.locator('.cm-content[contenteditable="true"]');
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.click();
      await page.keyboard.press('End');
      await page.keyboard.type('\n# Custom code marker');

      await page.getByRole('button', { name: 'New project' }).click();
      const dialog = page.getByRole('dialog', { name: 'Create new project' });
      await (
        choice === 'blank'
          ? dialog.getByRole('button', { name: /blank project/i })
          : dialog.getByRole('link').first()
      ).click();

      await page.getByRole('button', { name: 'Discard' }).click();
      await expect(dialog).not.toBeVisible();
      await page.getByRole('tab', { name: /python/i }).click();
      await expect(editor).not.toContainText('# Custom code marker');
    });
  }
});
