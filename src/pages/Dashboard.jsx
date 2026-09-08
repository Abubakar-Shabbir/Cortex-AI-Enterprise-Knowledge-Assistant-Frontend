import { useSession } from '../auth/SessionContext';
import { useOrganization } from '../organizations/OrganizationContext';
import AdminOverview from './dashboard/AdminOverview';
import CompanyOwnerOverview from './dashboard/CompanyOwnerOverview';
import UserOverview from './dashboard/UserOverview';

// Mirrors RAG.services.permission_service.get_dashboard_url_for_user,
// extended 2026-09-06 with a third branch: an account with admin-area
// access lands on Admin Overview; a Company Owner viewing their active
// organization workspace lands on the advanced CompanyOwnerOverview
// (org-wide KPIs/department/member-activity/AI-usage - replaces the
// old "Organizations" nav tab as the entry point into this data);
// everyone else (a plain Member, or a Personal Workspace account)
// lands on the simpler, chart-free User Overview. The Owner check
// reuses the exact same 'organization.view' (OWNER-only) codename
// CompanyNav.jsx's "Company" nav group gates on, so the two stay
// consistent - a Member never sees either.
export default function Dashboard() {
  const { canViewAdminArea, portal } = useSession();
  const { activeOrganization } = useOrganization();

  if (canViewAdminArea) return <AdminOverview />;
  if (portal === 'company' && activeOrganization?.my_permissions?.includes('organization.view')) {
    return <CompanyOwnerOverview />;
  }
  return <UserOverview />;
}
