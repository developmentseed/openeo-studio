import { defineConfig, devices } from '@playwright/test';

/**
 * Frontend integration test configuration with mocked backend APIs.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './test/integration',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:9000',
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
    command: 'pnpm dev',
    url: 'http://localhost:9000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      VITE_BASE_URL: 'http://localhost:9000',
      VITE_APP_TITLE: process.env.VITE_APP_TITLE || 'title',
      VITE_APP_DESCRIPTION: process.env.VITE_APP_DESCRIPTION || 'description'
    }
  }
});
