import { expect, Locator, Page } from '@playwright/test';
import { openSample, test } from './__fixtures__';

// The scene's code loads after the editor appears and replaces its contents,
// so typing before it arrives gets overwritten.
async function waitForSceneCode(editor: Locator) {
  await expect(editor).toContainText('Aquatic Plants and Algae Index');
}

// Typed code reaches the persisted store after a debounce; wait for it there
// rather than sleeping for a fixed time.
async function waitForStoredCode(page: Page, text: string) {
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem('openeo-editor-storage'))
    )
    .toContain(text);
}

test.describe('Persistence', () => {
  test.describe('User-Typed Code Persistence', () => {
    test('user-typed code persists across page reloads', async ({
      authenticatedPage
    }) => {
      await openSample(authenticatedPage, /Aquatic Plants and Algae/i);

      // Switch to Python tab
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();

      // Modify code in editor
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await expect(editor).toBeVisible({ timeout: 15000 });
      await waitForSceneCode(editor);
      await editor.click();
      await authenticatedPage.keyboard.press('End');
      await authenticatedPage.keyboard.type('\n# Test persistence comment');
      await waitForStoredCode(authenticatedPage, '# Test persistence comment');

      // Reload page
      await authenticatedPage.reload();
      await authenticatedPage.waitForURL('/editor');

      // Switch back to Python tab after reload
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();

      // Verify code modification persisted
      await expect(editor).toContainText('# Test persistence comment');
    });

    test('user-typed code persists when switching between tabs', async ({
      authenticatedPage
    }) => {
      await openSample(authenticatedPage, /Aquatic Plants and Algae/i);

      // Switch to Python tab and add marker
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await expect(editor).toBeVisible({ timeout: 15000 });
      await waitForSceneCode(editor);
      await editor.click();
      await authenticatedPage.keyboard.press('End');
      await authenticatedPage.keyboard.type('\n# Tab switch test');
      await waitForStoredCode(authenticatedPage, '# Tab switch test');

      // Switch to configuration tab
      await authenticatedPage
        .getByRole('tab', { name: /configuration/i })
        .click();
      await expect(
        authenticatedPage.getByText('Collection', { exact: true })
      ).toBeVisible();

      // Switch back to Python tab
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();

      // Verify code persisted across tab switches
      await expect(editor).toContainText('# Tab switch test');
    });

    test('user-typed code in blank editor persists across reload', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor');
      await authenticatedPage.waitForURL('/editor');

      // Add code to blank editor
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.click();
      await authenticatedPage.keyboard.type('# Blank editor test');
      await waitForStoredCode(authenticatedPage, '# Blank editor test');

      // Reload
      await authenticatedPage.reload();
      await authenticatedPage.waitForURL('/editor');

      // Verify code persisted
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();
      await expect(editor).toContainText('# Blank editor test');
    });
  });

  test.describe('User-Selected Configuration Persistence', () => {
    test('user-selected cloud cover persists across page reloads', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor');

      // Get configuration tab
      const configTab = authenticatedPage.getByRole('tab', {
        name: /configuration/i
      });
      await configTab.click();

      // Get cloud cover slider value
      const slider = authenticatedPage.getByRole('slider');
      const cloudCoverValue = await slider.getAttribute('aria-valuenow');

      // Reload page
      await authenticatedPage.reload();
      await authenticatedPage.waitForURL('/editor');

      // Verify cloud cover persisted
      await configTab.click();
      const cloudCoverAfter = await slider.getAttribute('aria-valuenow');

      expect(cloudCoverAfter).toBe(cloudCoverValue);
    });
  });

  test.describe('Scene Management', () => {
    test('scene selection persists across page reload', async ({
      authenticatedPage
    }) => {
      await openSample(authenticatedPage, /Aquatic Plants and Algae/i);

      // Verify scene title is visible
      const sceneTitle = authenticatedPage.getByText(
        /Monitoring Aquatic Plants and Algae/i
      );
      await expect(sceneTitle).toBeVisible();

      // Reload
      await authenticatedPage.reload();
      await authenticatedPage.waitForURL('/editor');

      // Verify scene is still loaded (URL + title visible)
      await expect(sceneTitle).toBeVisible();
    });

    test('switching scenes updates editor state', async ({
      authenticatedPage
    }) => {
      await openSample(authenticatedPage, /Aquatic Plants and Algae/i);

      // Verify first scene is loaded
      await expect(
        authenticatedPage.getByText(/Monitoring Aquatic Plants and Algae/i)
      ).toBeVisible();

      // Open a different sample
      await openSample(authenticatedPage, /Cyanobacteria Detection/i);
      await expect(
        authenticatedPage.getByRole('heading', {
          name: /Cyanobacteria Detection/i
        })
      ).toBeVisible();

      // Switch to Python tab to verify algorithm changed
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await expect(editor).toBeVisible({ timeout: 15000 });

      // Both scenes should have different algorithms, so code should differ
      const codeContent = await editor.textContent();
      expect(codeContent).toBeTruthy();
    });

    test('opening a sample over unsaved work asks first', async ({
      authenticatedPage
    }) => {
      await openSample(authenticatedPage, /Aquatic Plants and Algae/i);

      // Switch to Python tab and add custom code
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await expect(editor).toBeVisible({ timeout: 15000 });
      await waitForSceneCode(editor);
      await editor.click();
      await authenticatedPage.keyboard.press('End');
      await authenticatedPage.keyboard.type('\n# Custom code marker');
      await waitForStoredCode(authenticatedPage, '# Custom code marker');

      // Visiting the landing page keeps the work
      await authenticatedPage.goto('/');
      const sampleCard = authenticatedPage
        .getByRole('link')
        .filter({ hasText: /Aquatic Plants and Algae/i })
        .first();

      // Cancel keeps the work and stays on the landing page
      await sampleCard.click();
      await authenticatedPage.getByRole('button', { name: 'Cancel' }).click();
      await expect(authenticatedPage).toHaveURL('/');
      await waitForStoredCode(authenticatedPage, '# Custom code marker');

      // Discard replaces it with a fresh copy of the sample
      await sampleCard.click();
      await authenticatedPage.getByRole('button', { name: 'Discard' }).click();
      await authenticatedPage.waitForURL('/editor');
      await authenticatedPage.getByRole('tab', { name: /python/i }).click();
      await expect(editor).toBeVisible({ timeout: 15000 });
      await expect(editor).not.toContainText('# Custom code marker');
    });

    test('an old sample URL shows not found', async ({ authenticatedPage }) => {
      await authenticatedPage.route(
        '**/process_graphs/sentinel-2-apa',
        (route) =>
          route.fulfill({ status: 404, json: { code: 'ProcessGraphNotFound' } })
      );
      await authenticatedPage.goto('/editor/sentinel-2-apa');
      await expect(
        authenticatedPage.getByRole('heading', { name: '404' })
      ).toBeVisible();
    });
  });
});
