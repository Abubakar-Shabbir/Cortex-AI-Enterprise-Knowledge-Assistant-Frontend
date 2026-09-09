import { ShieldWarningIcon as ShieldAlert } from '@phosphor-icons/react';
import { Outlet, useParams } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { useOrganization } from '../organizations/OrganizationContext';
import EmptyState from './EmptyState';
import PageSkeleton from './PageSkeleton';

// Org-scoped counterpart to RequirePermission.jsx - same route-level
// gate, same "hiding a link never stops someone reaching the page
// directly by URL" reasoning, but checked against the CURRENT URL's
// :orgSlug rather than useSession()'s platform permissions or
// OrganizationContext's activeOrganization. Those two can legitimately
// differ from the org this route names (see OrganizationOverview.jsx's
// own docstring: a member can be viewing Org B's page while Org A is
// the active workspace in the sidebar switcher) - a permission check
// that read the active workspace instead of the URL would grant or
// deny access to the WRONG organization in that case.
//
// `my_permissions` per organization already comes back from the
// backend on every /organizations/ list response (organizations_views.
// _serialize_organization()) - this only reads it, it never computes
// a permission set of its own, so there is no second, competing
// authorization system here, just a client-side read of what the
// backend already told us. The backend's own HasOrgPermission is what
// actually enforces this on every request regardless of what this
// component decides - this is UX only, exactly like RequirePermission.
//
// A platform Admin/Super Admin (organizations.manage) can open a
// company it isn't a member of at all, but ONLY its read-only stats
// Overview (org_permission_service.BYPASS_ONLY_CODENAMES) - privacy:
// oversight from Admin > Companies must not double as a backdoor into
// that company's members/settings/billing/audit log. Mirrors the
// backend's own restriction exactly (kept in sync deliberately, not
// derived from it) so the UI never offers a link the API would then
// 403 on, and vice versa.
const ADMIN_BYPASS_CODENAMES = ['organization.view'];

export default function RequireOrgPermission({ codename, anyOf }) {
  const { orgSlug } = useParams();
  const { organizations, loading } = useOrganization();
  const { hasPermission } = useSession();

  if (loading) {
    return <PageSkeleton variant="detail" />;
  }

  const org = organizations.find((o) => o.slug === orgSlug);
  const permissions = org?.my_permissions || [];
  const inOrg = anyOf ? anyOf.some((code) => permissions.includes(code)) : permissions.includes(codename);
  const codenames = anyOf || [codename];
  const bypassAllowed = codenames.some((code) => ADMIN_BYPASS_CODENAMES.includes(code)) && hasPermission('organizations.manage');
  const allowed = inOrg || bypassAllowed;

  if (!allowed) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        message="Ask this organization's admin or owner if you think you should have it."
        actionTo={`/organizations/${orgSlug}`}
        actionLabel="Back to Organization"
      />
    );
  }

  return <Outlet />;
}
