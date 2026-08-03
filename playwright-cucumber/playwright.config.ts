import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Compiles features/*.feature + src/bdd-steps/*.ts into runnable
// @playwright/test specs (under .features-gen/), so the same Gherkin
// scenarios used by cucumber-js can also run through the Playwright
// Test runner - UI mode, trace viewer, HTML report, etc.
const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: 'src/bdd-steps/*.ts',
});

export default defineConfig({
  testDir,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node static-server.js',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
