import { defineConfig, devices } from '@playwright/test';

// End-to-end suite (frontend/e2e/) - drives the real React SPA against
// a real Django backend, unlike RAG/tests.py (server-side only) or any
// component-level frontend test. Requires Django's dev server already
// running on :8000 (`python manage.py runserver`) with a database that
// has had `python manage.py seed_e2e_user` run against it at least
// once - see e2e/README.md.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // tests share one seeded account and mutate its data (uploads, orgs) - parallel workers would race on it
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  reporter: [['html', { open: 'never' }], ['list']],
  // A cold page load (page.goto()) drops the SPA's in-memory React
  // Query cache entirely, so the next request is always a real,
  // uncached round trip to Django - measured at up to ~10s for a
  // simple list endpoint against a local dev Postgres in this sandbox
  // (no separate profiling done on whether that's normal dev-server
  // overhead here vs. something worth optimizing - out of scope for
  // this suite). The default 5s assertion timeout is tuned for a
  // snappier backend; widened so this suite verifies real behavior
  // rather than mostly measuring local dev-server latency.
  expect: { timeout: 10_000 },
  // Logs in once per seeded account (see global-setup.js) rather than
  // every spec calling login() itself - auth_views.py rate-limits
  // login attempts per username, and every test starting pre-
  // authenticated is also just faster. Defaults to the Company account
  // session since every spec needs it; auth.spec.js overrides
  // storageState per-test for the cases that need to start logged out.
  globalSetup: './e2e/global-setup.js',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: './e2e/.auth/company.json',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
