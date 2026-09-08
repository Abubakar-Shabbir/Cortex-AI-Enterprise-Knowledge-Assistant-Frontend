import { useParams } from 'react-router-dom';
import { FileTextIcon as FileText, HardDrivesIcon as HardDrive, ChatCircleIcon as MessageSquare, ShareNetworkIcon as Share2, SparkleIcon as Sparkles, TrendUpIcon as TrendUp, UserCircleIcon as UserCircle } from '@phosphor-icons/react';
import MiniStatCard from '../../components/MiniStatCard';
import PageSkeleton from '../../components/PageSkeleton';
import OrgTabs from '../../layout/OrgTabs';
import { useOrganizationDetail, useOrganizationStats } from '../../api/hooks';

// Reached only via: Platform Admin's "Admin > Companies" click-through
// (AdminOrganizations.jsx / AdminSystemOverview.jsx - Admin/Super Admin
// oversight of ANY company, see org_permission_service.get_user_org_role()'s
// documented bypass), the Owner's own "Manage Companies" list
// (OrganizationsList.jsx), post-invitation-accept (InvitationAccept.jsx),
// and RequireOrgPermission.jsx's "Back to Organization" fallback link -
// deliberately no longer linked from the Owner's own sidebar/OrgTabs
// (CompanyNav.jsx/OrgTabs.jsx), since a Company Owner already has all of
// this workspace's whole-org numbers on their main "/" Overview
// (CompanyOwnerOverview.jsx) and dedicated pages for everything else
// (Members/Manage Access/Billing/Settings/Audit Logs). AI Credits
// management moved to OrganizationBilling.jsx and the editable org
// profile header moved to OrganizationSettings.jsx - both pages the
// Owner still actually navigates to - so this page is now just the
// at-a-glance stat snapshot those other three entry points need.
export default function OrganizationOverview() {
  const { orgSlug } = useParams();
  const { data: org, isLoading } = useOrganizationDetail(orgSlug);
  const { data: stats } = useOrganizationStats(orgSlug);

  if (isLoading || !org) return <PageSkeleton variant="detail" />;

  const growthPct = stats?.documents_over_time?.growth_pct;

  return (
    <>
      <OrgTabs orgSlug={orgSlug} />

      <div className="mb-1 text-lg font-semibold text-ink dark:text-ink-dark">{org.name}</div>
      <p className="mb-4 text-sm text-muted dark:text-muted-dark">Company-wide snapshot</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <MiniStatCard icon={FileText} label="Documents" value={stats?.document_count ?? 0} numeric />
        <MiniStatCard icon={HardDrive} iconBg="bg-info/10" iconColor="text-info" label="Storage Used" value={stats?.total_storage ?? '—'} />
        <MiniStatCard icon={Sparkles} iconBg="bg-accent/10" iconColor="text-accent" label="AI Task Runs" value={stats?.ai_task_run_count ?? 0} numeric />
        <MiniStatCard icon={Share2} iconBg="bg-success/10" iconColor="text-success" label="Knowledge Topics" value={stats?.topic_count ?? 0} numeric />
        <MiniStatCard icon={MessageSquare} iconBg="bg-warning/10" iconColor="text-warning" label="Questions Asked" value={stats?.question_count ?? 0} numeric />
        <MiniStatCard icon={UserCircle} iconBg="bg-primary/10" iconColor="text-primary" label="Active This Week" value={stats?.active_members_7d ?? 0} numeric />
        <MiniStatCard
          icon={TrendUp} iconBg="bg-success/10" iconColor="text-success" label="Document Growth (14d)"
          value={growthPct === undefined ? '—' : `${growthPct > 0 ? '+' : ''}${growthPct}%`}
        />
      </div>
    </>
  );
}
