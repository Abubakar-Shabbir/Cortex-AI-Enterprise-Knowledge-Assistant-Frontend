import { chromium } from '@playwright/test';
import { COMPANY_USER, PERSONAL_USER, login } from './fixtures.js';

// Logs in once per seeded account and saves each session, rather than
// every spec calling login() itself - both for speed and because
// auth_views.py rate-limits login attempts per-username (5 per 15
// minutes, see LOGIN_ATTEMPTS_PER_USERNAME) - a suite that logs in a
// dozen times per run would eventually start tripping that limit
// itself. Two accounts, two saved sessions - see fixtures.js for why
// one account can never cover both Personal and Company.
export default async function globalSetup(config) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();

  for (const [user, path] of [
    [PERSONAL_USER, 'e2e/.auth/personal.json'],
    [COMPANY_USER, 'e2e/.auth/company.json'],
  ]) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await login(page, user);
    await context.storageState({ path });
    await context.close();
  }

  await browser.close();
}
