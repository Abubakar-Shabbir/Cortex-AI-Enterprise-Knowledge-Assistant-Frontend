import { ChartBarIcon as BarChart3, CreditCardIcon as CreditCard, FileArrowDownIcon as FileDown, FileTextIcon as FileText, HouseIcon as Home, ChatCircleIcon as MessageSquare, ShareNetworkIcon as Share2, SparkleIcon as Sparkles } from '@phosphor-icons/react';
import NavItem from './NavItem';
import NavSectionLabel from './NavSectionLabel';

// The Personal portal's nav tree - an individual account's own
// workspace only. Never shows Organizations/a workspace switcher (a
// Personal account has none, by construction - see OrganizationContext's
// docstring) and never shows the Administration section (that's the
// Platform Admin portal's job, see SuperAdminNav.jsx).
export default function PersonalNav({ has }) {
  return (
    <>
      <NavItem to="/" icon={Home} label="Overview" />

      {(has('pages.ask_ai') || has('pages.documents') || has('pages.knowledge_base') || has('pages.ai_tasks')) && (
        <>
          <NavSectionLabel>My Workspace</NavSectionLabel>
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

      <NavSectionLabel>Workspace Settings</NavSectionLabel>
      <NavItem to="/billing" icon={CreditCard} label="Billing" />
    </>
  );
}
