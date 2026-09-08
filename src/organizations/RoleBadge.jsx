import { CrownIcon as Crown, UserIcon } from '@phosphor-icons/react';

// One shared badge for every org-role tier, reused across
// OrganizationsList/OrganizationOverview/OrganizationMembers instead of
// each page inventing its own pill. Two tiers only (Owner/Member,
// collapsed 2026-09-06 from an earlier four-tier Owner/Admin/Manager/
// Member ladder - see org_permission_service.py's module docstring) -
// a distinct color+icon per rank still reads at a glance rather than
// every role looking identical except for its label.
const ROLE_STYLES = {
  org_owner: {
    label: 'Owner',
    icon: Crown,
    className: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  },
  member: {
    label: 'Member',
    icon: UserIcon,
    className: 'bg-slate-500/10 text-slate-600 dark:bg-white/10 dark:text-muted-dark',
  },
};

export default function RoleBadge({ role, size = 'sm' }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.member;
  const Icon = style.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding} ${style.className}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} weight="fill" />
      {style.label}
    </span>
  );
}
