import { expect, test } from '@playwright/test';
import { COMPANY_SLUG, switchWorkspace } from './fixtures';

// Each run creates its own uniquely-named organization (timestamp
// suffix) rather than reusing a fixed name - the seeded e2e account
// accumulates organizations across runs, and slugs must stay unique,
// so a fresh name avoids colliding with a previous run's leftover org.
function uniqueOrgName() {
  return `E2E Org ${Date.now()}`;
}

test.describe('Organizations', () => {
  test('creating an organization makes the user its Owner and it appears in the workspace switcher', async ({ page }) => {
    const orgName = uniqueOrgName();

    await page.goto('/organizations');

    await page.getByTestId('open-create-organization-modal').click();
    await page.getByTestId('organization-name-input').fill(orgName);
    await page.getByTestId('submit-create-organization').click();

    // Creating redirects into the new organization's Overview page, and
    // switches into it automatically (see CreateOrganizationModal's
    // onSuccess), so the trigger already shows the new org's name.
    await expect(page).toHaveURL(/\/organizations\/[a-z0-9-]+$/);
    const orgSlug = page.url().split('/organizations/')[1];
    await expect(page.getByRole('heading', { name: orgName })).toBeVisible();
    await expect(page.getByText('Owner', { exact: true })).toBeVisible();
    await expect(page.getByTestId('workspace-switcher-trigger')).toContainText(orgName);

    // Shows up in the Organizations list (client-side nav, not a
    // page.goto() reload - a hard reload here would drop the SPA's
    // React Query cache and force a slow, uncached refetch of every
    // page-chrome query, not just the one this assertion cares about).
    await page.getByRole('link', { name: 'Organizations', exact: true }).click();
    // Scoped to <main> - the sidebar's workspace-switcher-trigger still
    // shows this same org name (it's still the active workspace), so
    // an unscoped getByText() would match both and violate strict mode.
    await expect(page.locator('main').getByText(orgName)).toBeVisible();

    // Shows up as its own option in the sidebar workspace switcher.
    await page.getByTestId('workspace-switcher-trigger').click();
    await expect(page.getByTestId(`workspace-option-${orgSlug}`)).toContainText(orgName);
  });

  test('the Members page lists the creator as Owner', async ({ page }) => {
    const orgName = uniqueOrgName();

    await page.goto('/organizations');
    await page.getByTestId('open-create-organization-modal').click();
    await page.getByTestId('organization-name-input').fill(orgName);
    await page.getByTestId('submit-create-organization').click();
    await expect(page).toHaveURL(/\/organizations\/[a-z0-9-]+$/);

    await page.getByRole('link', { name: /members/i }).click();
    await expect(page).toHaveURL(/\/members\/?$/);
    await expect(page.getByText('1 member', { exact: true })).toBeVisible();
    await expect(page.getByText('Owner', { exact: true })).toBeVisible();
  });

  test('switching between two companies via the switcher works (never a Personal option)', async ({ page }) => {
    const orgName = uniqueOrgName();

    await page.goto('/organizations');
    await page.getByTestId('open-create-organization-modal').click();
    await page.getByTestId('organization-name-input').fill(orgName);
    await page.getByTestId('submit-create-organization').click();
    await expect(page).toHaveURL(/\/organizations\/([a-z0-9-]+)$/);
    const orgSlug = page.url().split('/organizations/')[1];

    // Creating an organization switches into it automatically (see
    // OrganizationsList.jsx's CreateOrganizationModal onSuccess).
    await expect(page.getByTestId('workspace-switcher-trigger')).toContainText(orgName);

    // Switch back to the account's original company - never a
    // "Personal Workspace" option (see WorkspaceSwitcher's docstring:
    // this account has none, by construction).
    await switchWorkspace(page, COMPANY_SLUG);
    await expect(page.getByTestId('workspace-switcher-trigger')).toContainText('E2E Test Company');

    await switchWorkspace(page, orgSlug);
    await expect(page.getByTestId('workspace-switcher-trigger')).toContainText(orgName);
  });
});
