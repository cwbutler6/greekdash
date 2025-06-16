// playwright.config.ts
import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Configuration for Playwright tests
 * See: https://playwright.dev/docs/test-configuration
 */
const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  // Maximum time one test can run for
  timeout: 30 * 1000,
  // Test timeout
  expect: { timeout: 5000 },
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry tests on CI
  retries: process.env.CI ? 2 : 0,
  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: [
    ['html'],
    ['list']
  ],
  // Use single directory for test results
  outputDir: 'playwright-report',
  // Shared settings for all projects
  use: {
    // Base URL to use in actions
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    // Collect traces on failure
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Use headless browsers
    headless: !!process.env.CI,
  },
  // Configure projects for browsers
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  // Web server setup
  webServer: {
    command: 'pnpm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
};

export default config;
