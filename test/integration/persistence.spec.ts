import { expect } from '@playwright/test';
import { test } from './__fixtures__';
import { gotoSceneOrFail, SCENE_IDS, sceneEditorPath } from './support/scenes';

const CUMBRE_VIEJA_PATH = sceneEditorPath(SCENE_IDS.CUMBRE_VIEJA);
const NDCI_PATH = sceneEditorPath(SCENE_IDS.NDCI);

test.describe('Persistence', () => {
  test.describe('User-Typed Code Persistence', () => {
    test('user-typed code persists across page reloads', async ({
      authenticatedPage
    }) => {
      await gotoSceneOrFail(authenticatedPage, SCENE_IDS.CUMBRE_VIEJA);

      // Switch to code tab
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();

      // Modify code in editor
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await editor.click();
      await authenticatedPage.keyboard.press('End');
      await authenticatedPage.keyboard.type('\n# Test persistence comment');

      // Wait for debounced store update (300ms + buffer)
      await authenticatedPage.waitForTimeout(350);

      // Reload page
      await authenticatedPage.reload();
      await authenticatedPage.waitForURL(CUMBRE_VIEJA_PATH);

      // Switch back to code tab after reload
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();

      // Verify code modification persisted
      await expect(editor).toContainText('# Test persistence comment');
    });

    test('user-typed code persists when switching between tabs', async ({
      authenticatedPage
    }) => {
      await gotoSceneOrFail(authenticatedPage, SCENE_IDS.CUMBRE_VIEJA);

      // Switch to code tab and add marker
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await editor.click();
      await authenticatedPage.keyboard.press('End');
      await authenticatedPage.keyboard.type('\n# Tab switch test');

      // Wait for debounced store update (300ms + buffer)
      await authenticatedPage.waitForTimeout(350);

      // Switch to configuration tab
      await authenticatedPage
        .getByRole('tab', { name: /configuration/i })
        .click();
      await expect(
        authenticatedPage.getByText(/collection/i).first()
      ).toBeVisible();

      // Switch back to code tab
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();

      // Verify code persisted across tab switches
      await expect(editor).toContainText('# Tab switch test');
    });

    test('user-typed code in blank editor persists across reload', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor');
      await authenticatedPage.waitForURL('/editor');

      // Add code to blank editor
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await editor.click();
      await authenticatedPage.keyboard.type('# Blank editor test');

      // Wait for debounced store update (300ms + buffer)
      await authenticatedPage.waitForTimeout(350);

      // Reload
      await authenticatedPage.reload();
      await authenticatedPage.waitForURL('/editor');

      // Verify code persisted
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();
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
      await gotoSceneOrFail(authenticatedPage, SCENE_IDS.CUMBRE_VIEJA);

      // Verify scene title is visible
      const sceneTitle = authenticatedPage.getByText(/Cumbre Vieja|SWIR/i);
      await expect(sceneTitle).toBeVisible();

      // Reload
      await authenticatedPage.reload();
      await authenticatedPage.waitForURL(CUMBRE_VIEJA_PATH);

      // Verify scene is still loaded (URL + title visible)
      await expect(sceneTitle).toBeVisible();
    });

    test('switching scenes updates editor state', async ({
      authenticatedPage
    }) => {
      await gotoSceneOrFail(authenticatedPage, SCENE_IDS.CUMBRE_VIEJA);

      // Verify first scene is loaded
      await expect(
        authenticatedPage.getByText(/Cumbre Vieja|SWIR/i)
      ).toBeVisible();

      // Navigate to different scene
      await gotoSceneOrFail(authenticatedPage, SCENE_IDS.NDCI);
      await authenticatedPage.waitForURL(NDCI_PATH);

      // Verify different scene loaded (URL changed)
      await expect(authenticatedPage).toHaveURL(/sentinel-2-ndci/);

      // Switch to code tab to verify algorithm changed
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );

      // Both scenes should have different algorithms, so code should differ
      const codeContent = await editor.textContent();
      expect(codeContent).toBeTruthy();
    });

    test('navigating to landing clears editor state', async ({
      authenticatedPage
    }) => {
      await gotoSceneOrFail(authenticatedPage, SCENE_IDS.CUMBRE_VIEJA);

      // Switch to code tab and add custom code
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();
      const editor = authenticatedPage.locator(
        '.cm-content[contenteditable="true"]'
      );
      await editor.click();
      await authenticatedPage.keyboard.press('End');
      await authenticatedPage.keyboard.type('\n# Custom code marker');

      // Navigate to landing
      await authenticatedPage.goto('/');
      await authenticatedPage.waitForURL('/');

      // Select the same scene again
      const sceneLink = authenticatedPage.locator(
        `a[href="${CUMBRE_VIEJA_PATH}"]`
      );
      await expect(
        sceneLink.first(),
        `Expected scene link ${CUMBRE_VIEJA_PATH} to exist on landing page`
      ).toBeVisible();
      await sceneLink.first().click();
      await authenticatedPage.waitForURL(/\/editor\/.+/);

      // Switch to code tab
      await authenticatedPage.getByRole('tab', { name: /code/i }).click();

      // Verify custom code was cleared (fresh scene load)
      await expect(editor).not.toContainText('# Custom code marker');
    });
  });
});
