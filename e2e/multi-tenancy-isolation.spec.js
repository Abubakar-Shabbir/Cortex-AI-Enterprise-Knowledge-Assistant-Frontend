import { expect, test } from '@playwright/test';

// The single most important guarantee this whole feature exists to
// provide: a document uploaded in one company must never show up
// while a DIFFERENT company workspace is active - see RAG/tests.py's
// DocumentOrganizationScopingTests for the equivalent server-side
// coverage. This spec drives the real browser end-to-end (upload in
// Company A -> create Company B -> switch -> upload in B -> switch
// back) to confirm the UI actually reflects that boundary, not just
// the API.
//
// Uses the seeded e2e_company_user (see fixtures.js) throughout - a
// Personal account never has a second workspace to isolate against
// (see account-type.spec.js for that account's own, different
// guarantee: no organization access at all).
//
// "Company A" is deliberately never a hardcoded org - it's whichever
// company is active when the test starts, read straight out of
// OrganizationContext's own persisted choice (localStorage) rather
// than assumed to be "E2E Test Company" by name. e2e_company_user
// accumulates a new organization every time this spec runs (Company B
// is a fresh one each run), so which org sorts alphabetically-first -
// org_permission_service.resolve_request_organization()'s no-header
// default - only coincidentally matches the originally-seeded company
// after a fresh seed; this spec must keep passing regardless of how
// many organizations have piled up since.

const STORAGE_KEY = 'cortex-active-company';

function uniqueOrgName() {
  return `E2E Isolation Org ${Date.now()}`;
}

async function uploadTextDocument(page, filename) {
  await page.getByTestId('toggle-upload-form').click();
  await page.getByTestId('upload-file-input').setInputFiles({
    name: filename,
    mimeType: 'text/plain',
    buffer: Buffer.from(`Content for ${filename}, uploaded by the Playwright multi-tenancy isolation spec.`),
  });
  await page.getByTestId('upload-submit').click();
  // The upload form collapses on success (Documents.jsx's onUpload) -
  // waiting for it to close is the signal the mutation succeeded.
  await expect(page.getByTestId('upload-file-input')).toBeHidden();
}

// Switches to `orgSlug` via the sidebar switcher when it's reachable
// there (more than one organization - see WorkspaceSwitcher's
// docstring for why the dropdown has nothing to show otherwise), or
// falls back to a plain page.goto()-driven reload under that slug's
// header by writing the same localStorage key OrganizationContext
// itself persists to. Needed because a freshly-cleaned e2e_company_user
// starts with exactly one organization, where the switcher UI
// correctly has no picker at all to click.
async function switchToCompany(page, orgSlug) {
  const trigger = page.getByTestId('workspace-switcher-trigger');
  if (await trigger.count()) {
    await trigger.click();
    const option = page.getByTestId(`workspace-option-${orgSlug}`);
    if (await option.count()) {
      await option.click();
      return;
    }
    await page.keyboard.press('Escape');
  }
  await page.evaluate(({ key, slug }) => localStorage.setItem(key, slug), { key: STORAGE_KEY, slug: orgSlug });
  await page.reload();
}

test('a document uploaded in one company is invisible from another company workspace, and vice versa', async ({ page }) => {
  // The uploaded filename's extension is stripped server-side to
  // become the Document's displayed title (documents_views.
  // document_upload_view: os.path.splitext(file.name)[0]) - assertions
  // below match on `*Title`, not the `.txt` filename used to upload.
  const companyADocFile = `company-a-${Date.now()}.txt`;
  const companyADocTitle = companyADocFile.replace(/\.txt$/, '');
  const companyBDocFile = `company-b-${Date.now()}.txt`;
  const companyBDocTitle = companyBDocFile.replace(/\.txt$/, '');
  const companyBName = uniqueOrgName();

  // 1. Whichever company is active by default is "Company A" for this
  // run - capture its slug (persisted by OrganizationContext) before
  // doing anything else, then upload a document into it.
  await page.goto('/documents');
  await expect(page.getByTestId('workspace-switcher-trigger')).toBeVisible();
  // OrganizationContext's own "no valid persisted choice yet -> default
  // to the first organization" effect writes this key asynchronously,
  // after useMyOrganizations() resolves - polling rather than reading
  // once avoids a race against that effect.
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeTruthy();
  const companyASlug = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);

  await uploadTextDocument(page, companyADocFile);
  await expect(page.getByRole('cell', { name: companyADocTitle })).toBeVisible();

  // 2. Register a second company - this switches the active workspace
  // into it automatically.
  await page.getByRole('link', { name: 'Organizations', exact: true }).click();
  await page.getByTestId('open-create-organization-modal').click();
  await page.getByTestId('organization-name-input').fill(companyBName);
  await page.getByTestId('submit-create-organization').click();
  await expect(page).toHaveURL(/\/organizations\/[a-z0-9-]+$/);

  // 3. Inside Company B's Documents page, Company A's document must
  // not appear - disjoint tenant scopes (documents_views.
  // documents_list_view).
  await page.getByRole('link', { name: 'Documents', exact: true }).click();
  await expect(page.getByRole('cell', { name: companyADocTitle })).toHaveCount(0);

  // 4. Upload a second document while Company B is active.
  await uploadTextDocument(page, companyBDocFile);
  await expect(page.getByRole('cell', { name: companyBDocTitle })).toBeVisible();
  await expect(page.getByRole('cell', { name: companyADocTitle })).toHaveCount(0);

  // 5. Switch back to Company A: Company B's document must disappear,
  // and the original document must still be there, untouched by
  // anything that happened in Company B. The sidebar switcher's
  // select() navigates into the org's own Overview page as part of
  // switching (see WorkspaceSwitcher.select() in Sidebar.jsx) - back
  // to Documents explicitly to see its document list again.
  await switchToCompany(page, companyASlug);
  await page.getByRole('link', { name: 'Documents', exact: true }).click();
  await expect(page.getByRole('cell', { name: companyADocTitle })).toBeVisible();
  await expect(page.getByRole('cell', { name: companyBDocTitle })).toHaveCount(0);
});
