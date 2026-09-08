// Shared login/workspace helpers for every spec in this suite.
//
// Personal vs Company is a one-time signup decision (see Backend/RAG/
// models.py's UserProfile.account_type help_text) - one seeded account
// can never cover both, so there are two disposable accounts (see
// Backend/RAG/management/commands/seed_e2e_user.py), never a real
// person's credentials:
//   - PERSONAL_USER: account_type=personal, zero organizations, ever.
//   - COMPANY_USER: account_type=company, Owner of "E2E Test Company".

export const PERSONAL_USER = { username: 'e2e_personal_user', password: 'E2ePlaywright!2026' };
export const COMPANY_USER = { username: 'e2e_company_user', password: 'E2ePlaywright!2026' };
export const COMPANY_SLUG = 'e2e-test-company';

// Kept for auth.spec.js, which only cares about the login mechanics
// themselves, not account type.
export const E2E_USERNAME = PERSONAL_USER.username;
export const E2E_PASSWORD = PERSONAL_USER.password;

export async function login(page, { username, password } = PERSONAL_USER) {
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL('/');
}

// Switches the active company via the sidebar's Company workspace
// switcher - only meaningful for a Company account that belongs to
// more than one organization (see OrganizationContext's docstring:
// this is never a Personal<->Company control).
export async function switchWorkspace(page, orgSlug) {
  await page.getByTestId('workspace-switcher-trigger').click();
  await page.getByTestId(`workspace-option-${orgSlug}`).click();
}
