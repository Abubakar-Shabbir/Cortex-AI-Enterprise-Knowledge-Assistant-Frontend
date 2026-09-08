// Shared login/workspace helpers for every spec in this suite.
//
// One disposable Company account (see Backend/RAG/management/commands/
// seed_e2e_user.py), never a real person's credentials - Personal
// Workspace was removed as an account type, so there's only one kind
// of account to seed now.

export const COMPANY_USER = { username: 'e2e_company_user', password: 'E2ePlaywright!2026' };
export const COMPANY_SLUG = 'e2e-test-company';

// Kept for auth.spec.js, which only cares about the login mechanics themselves.
export const E2E_USERNAME = COMPANY_USER.username;
export const E2E_PASSWORD = COMPANY_USER.password;

export async function login(page, { username, password } = COMPANY_USER) {
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL('/');
}

// Switches the active company via the sidebar's Company workspace
// switcher - only meaningful for an account that belongs to more than
// one organization.
export async function switchWorkspace(page, orgSlug) {
  await page.getByTestId('workspace-switcher-trigger').click();
  await page.getByTestId(`workspace-option-${orgSlug}`).click();
}
