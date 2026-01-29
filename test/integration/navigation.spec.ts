import { expect } from '@playwright/test';
import { test } from './__fixtures__';

test.describe('Navigation', () => {
  test.describe('Page Loading', () => {
    test('landing page loads and displays main content', async ({ page }) => {
      await page.goto('/');

      // Verify page title/heading is visible (h1 is main title)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Verify main sections are present
      await expect(page.getByText(/explore|analyze|satellite/i)).toBeVisible();
    });

    test('editor page loads when authenticated', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor');

      // Verify editor layout is present (tabs visible)
      await expect(
        authenticatedPage.getByRole('tab', {
          name: /configuration/i,
          selected: true
        })
      ).toBeVisible();
      await expect(
        authenticatedPage.getByRole('tab', { name: /code/i, selected: false })
      ).toBeVisible();

      // Verify no auth modal is shown
      await expect(
        authenticatedPage.getByRole('heading', {
          name: /authentication required/i
        })
      ).not.toBeVisible();
    });

    test('docs page loads and displays content', async ({ page }) => {
      await page.goto('/docs');

      // Verify documentation content is rendered
      await expect(
        page.getByRole('heading', { name: /documentation/i })
      ).toBeVisible();

      await expect(page.locator('p')).toBeTruthy();
    });
  });

  test.describe('Link Navigation', () => {
    test('navigation between pages works', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/');

      // Navigate to docs
      await page.getByRole('button', { name: /read the docs/i }).click();
      await page.waitForURL('/docs');

      // Navigate home
      await page.getByRole('link', { name: 'Home' }).click();
      await expect(page).toHaveURL('/');
    });

    test('scene card navigation loads editor', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/');

      // Click on first scene card
      const sceneCard = authenticatedPage.getByRole('link').filter({
        hasText: /sentinel|apa|ndvi/i
      });
      if (await sceneCard.count()) {
        const firstCard = sceneCard.first();
        const href = await firstCard.getAttribute('href');
        await firstCard.click();

        // Verify navigated to editor with scene
        if (href) {
          await expect(authenticatedPage).toHaveURL(href);
        }

        // Verify editor is loaded
        await expect(
          authenticatedPage.getByRole('tab', { name: /code/i, selected: true })
        ).toBeVisible();
      }
    });

    test('back button returns to landing page from editor', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor');

      // Click back button
      await authenticatedPage.getByRole('link', { name: /back/i }).click();

      // Verify landed on home page
      await expect(authenticatedPage).toHaveURL('/');
      await expect(
        authenticatedPage.getByRole('heading', { level: 1 })
      ).toBeVisible();
    });
  });

  test.describe('Browser History', () => {
    test('back button returns to previous page', async ({ page }) => {
      // Navigate: landing → editor → docs
      await page.goto('/');
      await page.goto('/editor');
      await page.goto('/docs');

      // Click back
      await page.goBack();
      await expect(page).toHaveURL('/editor');

      // Click back again
      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('forward button navigates to next page', async ({ page }) => {
      // Navigate: landing → editor
      await page.goto('/');
      await page.goto('/editor');

      // Go back (now on landing)
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Go forward
      await page.goForward();
      await expect(page).toHaveURL('/editor');
    });

    test('back/forward preserves scroll position', async ({ page }) => {
      await page.goto('/docs');

      // Scroll down to specific position
      await page.evaluate(() => window.scrollTo(0, 500));
      const scrollBefore = await page.evaluate(() => window.scrollY);

      // Navigate away and back
      await page.goto('/');
      await page.waitForURL('/');
      await page.goBack();
      await page.waitForURL('/docs');

      // Verify scroll position is preserved
      await page.waitForTimeout(200); // Wait for scroll restoration
      const scrollAfter = await page.evaluate(() => window.scrollY);
      expect(scrollAfter).toBeCloseTo(scrollBefore, -1);
    });
  });

  test.describe('Page Reload Behavior', () => {
    test('page reload preserves URL and state', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor');
      const urlBefore = authenticatedPage.url();

      await authenticatedPage.reload();

      await expect(authenticatedPage).toHaveURL(urlBefore);
      await expect(
        authenticatedPage.getByRole('tab', {
          name: /configuration/i,
          selected: true
        })
      ).toBeVisible();
    });

    test('selected scene persists after reload', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor/sentinel-2-apa');
      await authenticatedPage.waitForURL('/editor/sentinel-2-apa');
      const urlBefore = authenticatedPage.url();

      await authenticatedPage.reload();
      await authenticatedPage.waitForURL('/editor/sentinel-2-apa');

      expect(authenticatedPage.url()).toBe(urlBefore);
    });
  });

  test.describe('Auth State Persistence During Navigation', () => {
    test('authenticated user stays logged in after page reload', async ({
      authenticatedPage
    }) => {
      await authenticatedPage.goto('/editor');

      // Reload page (F5 or ctrl+R)
      await authenticatedPage.reload();

      // Verify still authenticated (login dialog not visible)
      await expect(
        authenticatedPage.getByRole('heading', {
          name: /authentication required/i
        })
      ).not.toBeVisible();

      // Verify logout button is visible (indicates authenticated)
      await expect(
        authenticatedPage.getByRole('button', { name: /logout/i })
      ).toBeVisible();
    });

    test('authenticated user stays logged in when navigating between pages', async ({
      authenticatedPage
    }) => {
      // Start on /editor (authenticated)
      await authenticatedPage.goto('/editor');

      // Verify authenticated
      await expect(
        authenticatedPage.getByRole('button', { name: /logout/i })
      ).toBeVisible();

      // Navigate to /docs
      await authenticatedPage.goto('/docs');
      await authenticatedPage.waitForURL('/docs');

      // Navigate to /landing
      await authenticatedPage.goto('/');
      await authenticatedPage.waitForURL('/');

      // Navigate back to /editor
      await authenticatedPage.goto('/editor');
      await authenticatedPage.waitForURL('/editor');

      // Verify still authenticated throughout
      await expect(
        authenticatedPage.getByRole('button', { name: /logout/i })
      ).toBeVisible();
    });
  });

  test.describe('URL Integrity', () => {
    test('direct URL navigation works', async ({ page }) => {
      // Navigate directly to /editor
      await page.goto('/editor');
      await expect(
        page.getByRole('tab', { name: /configuration/i })
      ).toBeVisible();

      // Navigate directly to /docs
      await page.goto('/docs');
      await expect(
        page.getByRole('heading', { name: /documentation/i })
      ).toBeVisible();
    });
  });
});
