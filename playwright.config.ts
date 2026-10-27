import { defineConfig, devices } from '@playwright/test';

/**
 * Frontend integration test configuration with mocked backend APIs.
 * See https://playwright.dev/docs/test-configuration.
 *
 * Starts Vite directly (not `pnpm dev`) so the suite never runs `pnpm clean`
 * and wipe a live Vite cache. Runs on its own port, so that it never reuses a
 * `pnpm dev` server on :9000 (which has the .env files of the developer).
 */
const PORT = 9100;
const APP_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './test/integration',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    command: `vite --port ${PORT} --strictPort`,
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'development',
      VITE_BASE_URL: APP_URL,
      // Unmocked API calls fail (.invalid never resolves) instead of reaching
      // a real backend. Vite prefers it to the .env files, so only an
      // exported VITE_OPENEO_API_URL changes it.
      VITE_OPENEO_API_URL:
        process.env.VITE_OPENEO_API_URL || 'https://openeo.invalid/openeo',
      VITE_APP_TITLE: process.env.VITE_APP_TITLE || 'title',
      VITE_APP_DESCRIPTION: process.env.VITE_APP_DESCRIPTION || 'description'
    }
  }
});
