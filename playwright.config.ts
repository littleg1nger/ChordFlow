import { defineConfig, devices } from '@playwright/test'

const baseURL=process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: { baseURL, headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop-edge', use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 1080 } } },
    { name: 'mobile-edge', use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 30000 },
})
