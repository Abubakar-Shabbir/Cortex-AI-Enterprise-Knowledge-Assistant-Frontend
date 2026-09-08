import { chromium } from '@playwright/test';
import { COMPANY_USER, login } from './fixtures.js';

// Logs in once for the seeded account and saves the session, rather
// than every spec calling login() itself - both for speed and because
// auth_views.py rate-limits login attempts per-username (5 per 15
// minutes, see LOGIN_ATTEMPTS_PER_USERNAME) - a suite that logs in a
// dozen times per run would eventually start tripping that limit
// itself.
export default async function globalSetup(config) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();

  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await login(page, COMPANY_USER);
  await context.storageState({ path: 'e2e/.auth/company.json' });
  await context.close();

  await browser.close();
}
