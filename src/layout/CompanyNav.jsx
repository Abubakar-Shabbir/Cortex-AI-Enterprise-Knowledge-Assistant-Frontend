import { ChartBarIcon as BarChart3, ClockCounterClockwiseIcon as History, CreditCardIcon as CreditCard, FileArrowDownIcon as FileDown, FileTextIcon as FileText, GearSixIcon as Settings, HouseIcon as Home, ChatCircleIcon as MessageSquare, ShareNetworkIcon as Share2, SparkleIcon as Sparkles, UsersIcon as Users } from '@phosphor-icons/react';
import { useOrganization } from '../organizations/OrganizationContext';
import NavItem from './NavItem';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import NavSectionLabel from './NavSectionLabel';

// The Company portal's nav tree - one organization's workspace, plus
// company-to-company switching for the (rare) multi-company case. A
// Company Owner and a Company Member both land here; platform-wide
// administration (managing every company, not just this one) is the
// separate Platform Admin portal (SuperAdminNav.jsx) - the two never
// merge, matching the "Company Owner is not a Super Admin" rule.
export default function CompanyNav({ has }) {
  // 2026-09-06: the "Organizations" link (into a generic list page)
  // was replaced by direct links into this organization's own
  // management pages - same org-scoped permission gates OrgTabs.jsx
  // already uses, just promoted from one nested link into top-level
  // sidebar items. Still Owner-only in practice, since every one of
  // these codenames requires OWNER rank (org_permission_service.py's
  // ORG_PERMISSION_MIN_ROLE) - a plain Member sees none of this group,
  // unchanged from the old canSeeOrganizationsLink behavior.
  const { activeOrganization } = useOrganization();
  const orgPermissions = activeOrganization?.my_permissions || [];
  const canOrg = (codename) => orgPermissions.includes(codename);
  const showCompanyGroup = ['members.view', 'settings.view', 'billing.view', 'audit_logs.view'].some(canOrg);

  return (
    <>
      <WorkspaceSwitcher />

      <NavItem to="/" icon={Home} label="Overview" />

      {showCompanyGroup && activeOrganization && (
        <>
          <NavSectionLabel>Company</NavSectionLabel>
          {canOrg('members.view') && <NavItem to={`/organizations/${activeOrganization.slug}/members`} icon={Users} label="Members & Access" />}
          {canOrg('billing.view') && <NavItem to={`/organizations/${activeOrganization.slug}/billing`} icon={CreditCard} label="Billing & Plan" />}
          {canOrg('settings.view') && <NavItem to={`/organizations/${activeOrganization.slug}/settings`} icon={Settings} label="Settings" />}
          {canOrg('audit_logs.view') && <NavItem to={`/organizations/${activeOrganization.slug}/audit-logs`} icon={History} label="Audit Logs" />}
        </>
      )}

      {(has('pages.ask_ai') || has('pages.documents') || has('pages.knowledge_base') || has('pages.ai_tasks')) && (
        <>
          <NavSectionLabel>Workspace</NavSectionLabel>
          {has('pages.documents') && <NavItem to="/documents" icon={FileText} label="Documents" />}
          {has('pages.knowledge_base') && <NavItem to="/knowledge" activeMatch="/knowledge" icon={Share2} label="Knowledge Base" />}
          {has('pages.ask_ai') && <NavItem to="/ask" icon={MessageSquare} label="Ask AI" />}
          {has('pages.ai_tasks') && <NavItem to="/ai-tasks" activeMatch="/ai-tasks" icon={Sparkles} label="AI Tasks" />}
        </>
      )}

      {(has('pages.analytics') || has('pages.reports')) && (
        <>
          <NavSectionLabel>Insights</NavSectionLabel>
          {has('pages.analytics') && <NavItem to="/analytics" icon={BarChart3} label="Analytics" />}
          {has('pages.reports') && <NavItem to="/reports" icon={FileDown} label="Reports" />}
        </>
      )}
    </>
  );
}
