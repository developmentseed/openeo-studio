import { expect } from '@playwright/test';
import { test } from './__fixtures__';

/** base64url of UTF-8 JSON, as an agent makes it. */
function encode(sample: object): string {
  return Buffer.from(JSON.stringify(sample)).toString('base64url');
}

const SAMPLE = {
  name: 'NDVI Rome from a link',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-07-01', '2025-07-15'],
  bands: ['reflectance|bands=b04', 'reflectance|bands=b08'],
  boundingBox: [12.35, 41.8, 12.6, 41.98],
  cloudCover: 20,
  code: '# prefill marker\nadd_graph_to_map(reduced.save_result("PNG"), "x")\n'
};

test.describe('Prefill link', () => {
  test('loads the sample, shows a warning, and does not run it', async ({
    authenticatedPage: page
  }) => {
    // Record each script that Python runs. The fixture mocks Pyodide, so a
    // run fails before it sends a request: the scripts are the only proof.
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
    const scriptsWithSample = () =>
      page.evaluate(() =>
        (
          window as unknown as { __pythonScripts: string[] }
        ).__pythonScripts.filter((code) => code.includes('prefill marker'))
      );

    await page.goto(`/editor?sample=${encode(SAMPLE)}`);

    await expect(
      page.getByRole('heading', { name: /NDVI Rome from a link/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('This sample comes from the link')
    ).toBeVisible();
    await expect(
      page.locator('.cm-content[contenteditable="true"]')
    ).toContainText('prefill marker');

    // The query is removed, so a reload keeps the edits of the user.
    await expect(page).toHaveURL(/\/editor$/);

    // Python is ready when Save is enabled. Give an auto-run the time to
    // start, then check that no script had the code of the sample.
    const save = page.getByRole('button', { name: /^Save/ });
    await expect(save).toBeEnabled({ timeout: 15000 });
    await page.waitForTimeout(3000);
    expect(await scriptsWithSample()).toEqual([]);

    // Control: Save runs the code, so the recorder works.
    await save.click();
    await expect.poll(async () => (await scriptsWithSample()).length).toBe(1);
  });

  test('shows an error for a sample that is not valid', async ({
    authenticatedPage: page
  }) => {
    await page.goto(`/editor?sample=${encode({ ...SAMPLE, bands: [] })}`);

    await expect(page.getByText('Cannot load the sample')).toBeVisible({
      timeout: 15000
    });
    await expect(page.getByText(/"bands" must be a list/)).toBeVisible();
  });
});
