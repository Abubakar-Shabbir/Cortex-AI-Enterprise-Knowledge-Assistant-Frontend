import { ClockCounterClockwiseIcon as History, CreditCardIcon as CreditCard, GearSixIcon as Settings, UsersIcon as Users } from '@phosphor-icons/react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { useOrganization } from '../organizations/OrganizationContext';

// Org-scoped counterpart to KnowledgeTabs.jsx - same shape, parameterized
// by orgSlug since these routes are per-organization rather than fixed.
//
// Each tab is only rendered when the
// viewer actually holds the org-scoped permission its page is gated
// on (see App.jsx's RequireOrgPermission wrappers, which this list is
// kept in sync with) - previously every tab showed for every role
// regardless of rank, so a plain Member saw and could click into
// Settings/Billing/Audit Logs even though the page itself would then
// (now) refuse them. Reads `my_permissions` for THIS org specifically
// (by slug, from the full organizations list), not activeOrganization -
// a member can be viewing a different organization's tabs than
// whichever workspace is active in the sidebar switcher.
export default function OrgTabs({ orgSlug }) {
  const { pathname } = useLocation();
  const { organizations } = useOrganization();
  const { hasPermission } = useSession();

  const org = organizations.find((o) => o.slug === orgSlug);
  const permissions = org?.my_permissions || [];
  const can = (codename) => permissions.includes(codename) || hasPermission('organizations.manage');

  const tabs = [
    { key: 'members', to: `/organizations/${orgSlug}/members`, icon: Users, label: 'Members & Access', visible: can('members.view') },
    { key: 'billing', to: `/organizations/${orgSlug}/billing`, icon: CreditCard, label: 'Billing & Plan', visible: can('billing.view') },
    { key: 'settings', to: `/organizations/${orgSlug}/settings`, icon: Settings, label: 'Settings', visible: can('settings.view') },
    { key: 'audit-logs', to: `/organizations/${orgSlug}/audit-logs`, icon: History, label: 'Audit Logs', visible: can('audit_logs.view') },
  ].filter((tab) => tab.visible);

  return (
    <div className="mb-6 flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1 shadow-softer dark:border-line-dark dark:bg-white/5">
      {tabs.map(({ key, to, icon: Icon, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={key}
            to={to}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
              active ? 'bg-primary text-white shadow-soft' : 'text-muted hover:bg-card hover:text-ink dark:text-muted-dark dark:hover:bg-white/10 dark:hover:text-ink-dark'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </Link>
        );
      })}
    </div>
  );
}
