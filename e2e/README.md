# End-to-end tests (Playwright)

Real-browser tests against the actual React SPA and Django backend -
unlike `Backend/RAG/tests.py` (server-side only, no browser), these
confirm company-to-company isolation, org creation, and auth flows
actually work from a real user's perspective, clicking through the
real UI.

## One-time setup

1. Backend dependencies installed and migrated (`Backend/README.md` /
   `CLAUDE.md`), pointed at a **local dev database** - this suite
   creates and mutates real rows (documents, organizations).
2. Seed the disposable test accounts (idempotent, safe to re-run):

   ```
   cd Backend
   python manage.py seed_e2e_user
   ```

   This creates one account (see
   `RAG/management/commands/seed_e2e_user.py` for the password) - never
   a real person's account:
   - `e2e_company_user` - a Company account, Owner of "E2E Test Company".

   The command refuses to run unless `DEBUG=True`.
3. Install browsers once: `npx playwright install chromium`.

## Running

```
cd Backend && python manage.py runserver          # terminal 1
cd frontend && npm run test:e2e                    # terminal 2 (auto-starts the Vite dev server)
```

`playwright.config.js`'s `webServer` starts (or reuses) the frontend
dev server automatically; the Django backend must already be running
on `:8000` (not started automatically - it needs its own database/env
already configured).

- `npm run test:e2e` - headless run, HTML report written to
  `playwright-report/`.
- `npm run test:e2e:ui` - Playwright's interactive UI mode, for
  writing/debugging specs.
- `npm run test:e2e:report` - opens the last HTML report.

## What's covered

- `auth.spec.js` - login (valid/invalid credentials), logout, and the
  unauthenticated-redirect-to-login guard.
- `organizations.spec.js` - registering a company (creator becomes
  Owner), the Members page, and switching between two companies via
  the sidebar switcher.
- `multi-tenancy-isolation.spec.js` - the flagship test: a document
  uploaded in one company must be invisible while a *different*
  company workspace is active, and vice versa - the UI-level
  counterpart to `RAG/tests.py`'s `DocumentOrganizationScopingTests`.

## Notes

- Tests run serially (`fullyParallel: false`, `workers: 1`) - specs
  using the same seeded account mutate its data (uploads,
  organizations), so parallel workers would race on it.
- `e2e_company_user`'s organizations accumulate in the dev database
  across runs (each run uses a timestamp-suffixed name to avoid slug
  collisions) - harmless for a disposable test account, but worth
  knowing if you're inspecting that database directly.
- `global-setup.js` logs in as the seeded account once per run and
  saves `e2e/.auth/company.json` - every spec defaults to this session
  (`playwright.config.js`'s `use.storageState`); specs needing a
  logged-out start override `storageState` per-`describe`/`test` (see
  `auth.spec.js`).
