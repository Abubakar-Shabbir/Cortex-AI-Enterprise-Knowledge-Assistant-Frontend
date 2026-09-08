import { expect, test } from '@playwright/test';

// Personal vs Company - a one-time signup decision, never a workspace
// switcher (see Backend/RAG/models.py's UserProfile.account_type
// help_text). This spec covers the two things the earlier
// organizations.spec.js / multi-tenancy-isolation.spec.js specs (both
// Company-account-only) don't: the signup-time choice screen itself,
// and that a Personal account genuinely has no company workspace UI
// at all - not just an empty one.

test.describe('Signup: Personal vs Company choice', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows exactly two account-type options before any signup fields', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByRole('heading', { name: /how will you use this platform/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Personal/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Company/ })).toBeVisible();

    // The normal signup fields aren't shown until a choice is made.
    await expect(page.getByLabel('Full name')).toHaveCount(0);
  });

  test('choosing Company reveals company registration fields; choosing Personal does not', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: /^Personal/ }).click();

    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Company name')).toHaveCount(0);

    await page.getByRole('button', { name: /change account type/i }).click();
    await page.getByRole('button', { name: /^Company/ }).click();

    await expect(page.getByLabel('Company name')).toBeVisible();
    await expect(page.getByLabel('Organization type')).toBeVisible();
  });
});

test.describe('Personal account has no company workspace UI', () => {
  test.use({ storageState: './e2e/.auth/personal.json' });

  test('the sidebar shows no Organizations link and no workspace switcher', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('workspace-switcher-trigger')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Organizations', exact: true })).toHaveCount(0);
  });

  test('visiting /organizations directly shows no way to create one', async ({ page }) => {
    await page.goto('/organizations');

    await expect(page.getByTestId('open-create-organization-modal')).toHaveCount(0);
    await expect(page.getByText(/no organizations yet/i)).toBeVisible();
  });
});
