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
// A platform Admin/Super Admin (organizations.manage) can open ANY
// organization's management pages even without being a member at all
// (org_permission_service.get_user_org_role()'s deliberate platform-
// oversight bypass - see its docstring) - mirrored here via
// useSession().hasPermission('organizations.manage') so Admin >
// Companies' "open this company" links don't 403 in the UI while the
// backend would have allowed them.
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
  const allowed = inOrg || hasPermission('organizations.manage');

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
