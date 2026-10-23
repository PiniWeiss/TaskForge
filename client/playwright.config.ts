import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Dedicated ports and a throwaway data file, so e2e never touches a running dev server or real data.
const API_PORT = 3210;
const CLIENT_PORT = 5190;
// A new file per run (the config is evaluated once in the runner, which starts the servers).
const dataFile = join(tmpdir(), 'taskforge-e2e', `data-${String(Date.now())}.json`);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${String(CLIENT_PORT)}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node --conditions=@taskforge/source ../server/api/src/server.ts',
      url: `http://127.0.0.1:${String(API_PORT)}/projects`,
      env: { PORT: String(API_PORT), DATA_FILE: dataFile },
      reuseExistingServer: false,
    },
    {
      command: 'npx vite',
      url: `http://localhost:${String(CLIENT_PORT)}`,
      env: {
        CLIENT_PORT: String(CLIENT_PORT),
        TASKFORGE_API_URL: `http://127.0.0.1:${String(API_PORT)}`,
      },
      reuseExistingServer: false,
    },
  ],
});
