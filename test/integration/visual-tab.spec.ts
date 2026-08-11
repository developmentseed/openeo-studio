import { expect, type Route } from '@playwright/test';
import { test } from './__fixtures__';

const MAP_GRAPHS = [
  {
    name: 'Test Layer',
    visible: true,
    parameters: [],
    process_graph: {
      lc1: {
        process_id: 'load_collection',
        arguments: {
          id: 'sentinel-2-l2a',
          bands: ['reflectance|b02', 'reflectance|b03', 'reflectance|b04'],
          properties: {
            'eo:cloud_cover': {
              process_graph: {
                cc: {
                  process_id: 'lt',
                  arguments: { x: { from_parameter: 'value' }, y: 20 },
                  result: true
                }
              }
            }
          }
        }
      },
      sr1: {
        process_id: 'save_result',
        arguments: { data: { from_node: 'lc1' }, format: 'PNG' },
        result: true
      }
    }
  }
];

/**
 * The shared page fixture stubs `window.loadPyodide` with a no-op runner.
 * `PyodideProvider` prefers that override, so Visual-tab tests re-stub it with
 * a runner that returns a known process graph (as a JSON string, matching what
 * the Python wrapper emits).
 */
async function stubPyodideWithGraphs(
  page: import('@playwright/test').Page,
  graphs: typeof MAP_GRAPHS
) {
  await page.addInitScript((mapGraphs) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).loadPyodide = async () => ({
      runPythonAsync: async () => JSON.stringify(mapGraphs),
      loadPackage: async () => {},
      pyimport: () => ({ install: async () => {} }),
      FS: { writeFile: () => {}, readFile: () => new Uint8Array() }
    });
  }, graphs);
}

/**
 * The openEO API is a different origin to the dev server, so synthesized
 * responses still have to satisfy CORS. `Location` needs explicit exposure or
 * `fetchHeaderLocation` cannot read it back off a cross-origin response.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'Location'
};

async function fulfillJson(
  route: Route,
  body: unknown,
  extra: { status?: number; headers?: Record<string, string> } = {}
) {
  if (route.request().method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers: CORS_HEADERS });
  }
  return route.fulfill({
    status: extra.status ?? 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      ...extra.headers
    },
    body: JSON.stringify(body)
  });
}

test.describe('Visual tab', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await stubPyodideWithGraphs(authenticatedPage, MAP_GRAPHS);

    await authenticatedPage.route('**/validation', (route) =>
      fulfillJson(route, { errors: [] })
    );
    await authenticatedPage.route('**/services', (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        return fulfillJson(route, null, {
          status: 201,
          headers: { Location: 'https://openeo.test/services/svc1' }
        });
      }
      if (method === 'GET') {
        return fulfillJson(route, { services: [] });
      }
      if (method === 'DELETE' || method === 'OPTIONS') {
        return fulfillJson(route, null, { status: 204 });
      }
      return fulfillJson(route, { services: [] });
    });
    await authenticatedPage.route('**/services/svc1', (route) => {
      if (route.request().method() === 'DELETE') {
        return fulfillJson(route, null, { status: 204 });
      }
      return fulfillJson(route, { url: 'https://tiles.test/{z}/{x}/{y}.png' });
    });
    // Auto-execute may request tiles; keep them from hanging the page.
    await authenticatedPage.route('https://tiles.test/**', (route) =>
      route.fulfill({
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'image/png' },
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64'
        )
      })
    );
  });

  test('renders the graph and drills into a nested subgraph', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/editor/sentinel-2-apa');

    // Sample scenes auto-execute once Pyodide is ready; wait for the stubbed
    // layer instead of going through Save (which opens a claim dialog and
    // navigates away from the sample route).
    await expect(authenticatedPage.getByText('Test Layer')).toBeVisible({
      timeout: 30_000
    });

    await authenticatedPage.getByRole('tab', { name: 'Visual' }).click();

    // Scope every assertion to the canvas: the process ids and collection id
    // also appear in the (hidden) Python editor.
    const canvas = authenticatedPage.locator('.react-flow');

    await expect(canvas.getByText('sentinel-2-l2a')).toBeVisible({
      timeout: 30_000
    });
    await expect(canvas.getByText('save_result')).toBeVisible();

    // The breadcrumb only appears once you drill in.
    await expect(canvas.getByText('Graph')).toHaveCount(0);

    // Drill into the process graph nested inside load_collection.properties.
    await canvas.getByRole('button', { name: /1 node/ }).click();

    await expect(
      authenticatedPage.getByText('#lc1 · properties.eo:cloud_cover')
    ).toBeVisible();
    await expect(canvas.getByText('lt', { exact: true })).toBeVisible();

    // Return to the root graph.
    await authenticatedPage.getByRole('button', { name: 'Graph' }).click();
    await expect(canvas.getByText('sentinel-2-l2a')).toBeVisible();
  });

  test('shows the empty state before any code has run', async ({
    authenticatedPage
  }) => {
    await authenticatedPage.goto('/editor');
    await authenticatedPage.getByRole('tab', { name: 'Visual' }).click();

    await expect(
      authenticatedPage.getByText('Save your project to see the process graph.')
    ).toBeVisible();
  });
});
