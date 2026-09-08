import { ChartBarIcon as BarChart3, ChartLineUpIcon as ChartLineUp, BuildingsIcon as Buildings, CreditCardIcon as CreditCard, FileArrowDownIcon as FileDown, FileTextIcon as FileText, GearSixIcon as Settings, HeartbeatIcon as HeartPulse, HouseIcon as Home, ChatCircleIcon as MessageSquare, MagnifyingGlassIcon as Search, ShareNetworkIcon as Share2, ShieldIcon as Shield, SparkleIcon as Sparkles, TerminalWindowIcon as Terminal, UsersIcon as Users } from '@phosphor-icons/react';
import NavItem from './NavItem';
import NavSectionLabel from './NavSectionLabel';

// The Platform Admin portal's nav tree - cross-organization,
// cross-user, whole-platform administration. Landed on by any role
// holding at least one admin-area permission (canViewAdminArea - see
// permission_service.has_admin_area_access on the backend), which
// covers both the built-in Admin role and the dynamic Super Admin
// role built for platform oversight. Deliberately has no workspace
// switcher and no single "active organization" concept of its own -
// see Administration > Companies for cross-org management instead.
export default function SuperAdminNav({ has }) {
  return (
    <>
      <NavItem to="/" icon={Home} label="Overview" />

      <NavSectionLabel>Administration</NavSectionLabel>
      {has('organizations.view_all') && <NavItem to="/admin/system-overview" icon={ChartLineUp} label="System Overview" />}
      {has('organizations.view_all') && <NavItem to="/admin/companies" icon={Buildings} label="Companies" />}
      {has('billing.manage_plans') && <NavItem to="/admin/billing-plans" icon={CreditCard} label="Billing Plans" />}
      {has('users.view_all') && <NavItem to="/admin/users" icon={Users} label="Users" />}
      {has('roles.manage') && <NavItem to="/admin/roles" icon={Shield} label="Roles" />}
      {(has('settings.manage_llm') || has('settings.manage_chunking') || has('settings.manage_retrieval') || has('settings.manage_embedding') || has('settings.manage_database')) && (
        <NavItem to="/admin/settings" icon={Settings} label="Settings" />
      )}
      {has('system.view_health') && <NavItem to="/admin/system-health" icon={HeartPulse} label="System Health" />}
      {(has('system.view_ai_logs') || has('activity.view_all_logs')) && <NavItem to="/admin/system-logs" icon={Terminal} label="System Logs" />}

      {(has('pages.ask_ai') || has('pages.documents') || has('pages.knowledge_base') || has('pages.ai_tasks')) && (
        <>
          <NavSectionLabel>My Workspace</NavSectionLabel>
          {has('pages.documents') && <NavItem to="/documents" icon={FileText} label="Documents" />}
          {has('pages.knowledge_base') && <NavItem to="/knowledge" activeMatch="/knowledge" icon={Share2} label="Knowledge Base" />}
          {has('pages.ask_ai') && <NavItem to="/ask" icon={MessageSquare} label="Ask AI" />}
          {has('pages.ai_tasks') && <NavItem to="/ai-tasks" activeMatch="/ai-tasks" icon={Sparkles} label="AI Tasks" />}
        </>
      )}

      {(has('pages.analytics') || has('pages.reports') || has('queries.view_all_logs')) && (
        <>
          <NavSectionLabel>Insights</NavSectionLabel>
          {has('pages.analytics') && <NavItem to="/analytics" icon={BarChart3} label="Analytics" />}
          {has('pages.reports') && <NavItem to="/reports" icon={FileDown} label="Reports" />}
          {has('queries.view_all_logs') && <NavItem to="/admin/queries" icon={Search} label="Queries" />}
        </>
      )}
    </>
  );
}
