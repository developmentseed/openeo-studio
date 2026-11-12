import { expect, type Page } from '@playwright/test';
import { test } from './__fixtures__';

const encode = (project: object) =>
  Buffer.from(JSON.stringify(project)).toString('base64url');

const PROJECT = {
  name: 'NDVI Rome from a link',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-07-01', '2025-07-15'],
  bands: ['reflectance|bands=b04', 'reflectance|bands=b08'],
  boundingBox: [12.35, 41.8, 12.6, 41.98],
  propertyFilters: [{ property: 'eo:cloud_cover', operator: 'lt', value: 20 }],
  code: '# prefill marker\nadd_graph_to_map(reduced.save_result("PNG"), "x")\n'
};

/** Serves `eo:cloud_cover` as the only queryable of every collection. */
async function mockQueryables(page: Page) {
  await page.route(
    (url) => url.hostname !== 'localhost' && url.pathname.endsWith('/'),
    (route) =>
      route.request().resourceType() === 'fetch'
        ? route.fulfill({
            json: {
              endpoints: [
                {
                  path: '/collections/{collection_id}/queryables',
                  methods: ['GET']
                }
              ]
            }
          })
        : route.fallback()
  );
  await page.route('**/collections/*/queryables', (route) =>
    route.fulfill({
      json: { type: 'object', properties: { 'eo:cloud_cover': {} } }
    })
  );
}

const codeEditor = (page: Page) =>
  page.locator('.cm-content[contenteditable="true"]');

// The notice renders in each tab, and only the active one is visible.
const visibleText = (page: Page, text: string) =>
  page.getByText(text).locator('visible=true');

test.describe('Prefill link', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await mockQueryables(page);
  });

  test('loads the project, warns about the code, and does not run it', async ({
    authenticatedPage: page
  }) => {
    // Record each script that Python runs. The fixture mocks Pyodide, so the
    // scripts are the only proof of a run.
    await page.addInitScript(() => {
      const w = window as unknown as {
        __pythonScripts: string[];
        loadPyodide: (options: object) => Promise<{
          runPythonAsync: (code: string) => Promise<unknown>;
        }>;
      };
      w.__pythonScripts = [];
      const load = w.loadPyodide;
      w.loadPyodide = async (options) => {
        const pyodide = await load(options);
        const run = pyodide.runPythonAsync;
        pyodide.runPythonAsync = async (code) => {
          w.__pythonScripts.push(code);
          return run(code);
        };
        return pyodide;
      };
    });
    const scriptsWithProject = () =>
      page.evaluate(() =>
        (
          window as unknown as { __pythonScripts: string[] }
        ).__pythonScripts.filter((code) => code.includes('prefill marker'))
      );

    await page.goto(`/editor?prefill=${encode(PROJECT)}`);

    await expect(
      page.getByRole('heading', { name: /NDVI Rome from a link/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      visibleText(page, 'This code comes from a link')
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /configuration/i })
    ).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: /python/i }).click();
    await expect(codeEditor(page)).toBeVisible({ timeout: 15000 });
    await expect(codeEditor(page)).toContainText('prefill marker');
    await expect(page).toHaveURL(/\/editor$/);

    const save = page.getByRole('button', { name: /^Save/ });
    await expect(save).toBeEnabled({ timeout: 15000 });
    await page.waitForTimeout(3000);
    expect(await scriptsWithProject()).toEqual([]);

    // Control: Save runs the code, so the recorder works.
    await save.click();
    await expect.poll(async () => (await scriptsWithProject()).length).toBe(1);
  });

  test('loads an incompatible project and names the invalid values', async ({
    authenticatedPage: page
  }) => {
    await page.goto(
      `/editor?prefill=${encode({
        ...PROJECT,
        bands: ['reflectance|bands=b04', 'nope'],
        propertyFilters: [
          ...PROJECT.propertyFilters,
          { property: 'sat:orbit_state', operator: 'eq', value: 'ascending' }
        ]
      })}`
    );

    await expect(
      visibleText(page, 'Band "nope" is not available in "sentinel-2-l2a".')
    ).toBeVisible({ timeout: 15000 });
    await expect(
      visibleText(page, 'Property "sat:orbit_state" can\'t be filtered on')
    ).toBeVisible();
    await expect(visibleText(page, 'may not work')).toBeVisible();
    await page.getByRole('tab', { name: /python/i }).click();
    await expect(codeEditor(page)).toContainText('prefill marker');

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByText('may not work')).toHaveCount(0);
  });

  test('shows not found for a project that is not usable', async ({
    authenticatedPage: page
  }) => {
    await page.goto(`/editor?prefill=${encode({ ...PROJECT, bands: 'x' })}`);

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible({
      timeout: 15000
    });
    await expect(
      page.getByText('Invalid project in the link: missing `bands`')
    ).toBeVisible();
  });
});
