import { expect, test } from '@playwright/test';
import { E2E_USERNAME, login } from './fixtures';

// Every other spec in this suite starts pre-authenticated (see
// global-setup.js / playwright.config.js's default `storageState`) -
// these tests specifically exercise the login flow itself, so they
// override back to a logged-out browser state.
test.describe('Authentication (starting logged out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('logs in with valid credentials and reaches the dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    // Not workspace-switcher-trigger - the default login() uses the
    // Personal account (see fixtures.js), which never shows one (see
    // account-type.spec.js for that guarantee); this just confirms a
    // real page of the authenticated app rendered.
    await expect(page.getByRole('link', { name: 'Documents' })).toBeVisible();
  });

  test('rejects an invalid password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username', { exact: true }).fill(E2E_USERNAME);
    await page.getByLabel('Password', { exact: true }).fill('definitely-wrong-password');
    await page.getByRole('button', { name: /log in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('an unauthenticated visit to a protected route redirects to login', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Logout', () => {
  // Logging out invalidates the session server-side - reusing the
  // shared storageState session here would poison it for every test
  // that runs afterward (they'd all suddenly appear logged out too),
  // so this logs in with its own independent session rather than the
  // one global-setup.js saved for the rest of the suite.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('logs out back to the login page', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: new RegExp(E2E_USERNAME, 'i') }).click();
    await page.getByRole('button', { name: /logout/i }).click();

    await expect(page).toHaveURL('/login');
  });
});
