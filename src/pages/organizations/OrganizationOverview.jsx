import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BuildingsIcon as Buildings, ChatCircleIcon as MessageSquare, FileTextIcon as FileText, GearSixIcon as Settings,
  HardDrivesIcon as HardDrive, ShareNetworkIcon as Share2, SparkleIcon as Sparkles,
  TrashIcon as Trash2, TrendUpIcon as TrendUp, UserCheckIcon as UserCheck, UserCircleIcon as UserCircle,
  UserMinusIcon as UserX, UsersIcon as Users,
} from '@phosphor-icons/react';
import AiUsageCard from '../../components/dashboard/AiUsageCard';
import DocumentsOverTimeCard from '../../components/dashboard/DocumentsOverTimeCard';
import DocumentTypesCard from '../../components/dashboard/DocumentTypesCard';
import MemberActivityCard from '../../components/dashboard/MemberActivityCard';
import RecentDocumentsTable from '../../components/dashboard/RecentDocumentsTable';
import KpiCard from '../../components/KpiCard';
import MiniStatCard from '../../components/MiniStatCard';
import PageSkeleton from '../../components/PageSkeleton';
import StatsSyncBadge from '../../components/StatsSyncBadge';
import OrgTabs from '../../layout/OrgTabs';
import { useSession } from '../../auth/SessionContext';
import { useTheme } from '../../hooks/useTheme';
import { useOrganizationDetail, useOrganizationStats, usePlatformOrganizationAction } from '../../api/hooks';

// Reached via: Platform Admin's "Admin > Companies" click-through
// (AdminOrganizations.jsx / AdminSystemOverview.jsx - Admin/Super Admin
// oversight of ANY company; see org_permission_service.BYPASS_ONLY_CODENAMES
// for exactly what that oversight bypass grants - stats only, deliberately
// NOT members/settings/billing/audit-logs), the Owner's own "Manage
// Companies" list (OrganizationsList.jsx), post-invitation-accept
// (InvitationAccept.jsx), and RequireOrgPermission.jsx's "Back to
// Organization" fallback link - deliberately no longer linked from the
// Owner's own sidebar/OrgTabs (CompanyNav.jsx/OrgTabs.jsx), since a Company
// Owner already has all of this workspace's whole-org numbers on their
// main "/" Overview (CompanyOwnerOverview.jsx). Built from
// organization_stats_view's full payload and the same shared dashboard
// components CompanyOwnerOverview.jsx uses (KpiCard/DocumentsOverTimeCard/
// DocumentTypesCard/RecentDocumentsTable/MemberActivityCard/AiUsageCard),
// so any company looked up this way reads as a full stats dashboard
// rather than a handful of bare stat boxes - only "Your Activity" is left
// out, since a viewer arriving here isn't necessarily a member of the
// company being inspected.
//
// Members/Settings quick links and the OrgTabs bar below are gated on
// `org.my_permissions` (real Owner only) rather than shown
// unconditionally - a platform Admin/Super Admin viewing via oversight
// only ever gets `organization.view`, so those links/tabs correctly
// disappear for them; the Suspend/Delete controls are the deliberate
// platform-level exception (see PlatformOrgActions below).
function PlatformOrgActions({ org, orgSlug }) {
  const navigate = useNavigate();
  const action = usePlatformOrganizationAction();

  return (
    <div className="flex flex-wrap gap-2">
      {org.status === 'suspended' ? (
        <button
          type="button"
          onClick={() => action.mutate({ orgSlug, action: 'reactivate' })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/10 dark:border-line-dark dark:bg-card-dark dark:text-success-dark"
        >
          <UserCheck className="h-3.5 w-3.5" /> Reactivate
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Suspend "${org.name}"? Its members will lose access until it's reactivated.`)) {
              action.mutate({ orgSlug, action: 'suspend' });
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-warning transition-colors hover:bg-warning/10 dark:border-line-dark dark:bg-card-dark dark:text-warning-dark"
        >
          <UserX className="h-3.5 w-3.5" /> Suspend
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`Delete "${org.name}" permanently? This removes all its members, documents, and data. This cannot be undone.`)) {
            action.mutate({ orgSlug, action: 'delete' }, { onSuccess: () => navigate('/admin/companies') });
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 dark:border-line-dark dark:bg-card-dark dark:text-danger-dark"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  );
}

export default function OrganizationOverview() {
  const { orgSlug } = useParams();
  const { data: org, isLoading } = useOrganizationDetail(orgSlug);
  const { data: stats, isFetching } = useOrganizationStats(orgSlug);
  const { isDark } = useTheme();
  const { hasPermission } = useSession();

  if (isLoading || !org || !stats) return <PageSkeleton variant="detail" />;

  const growthPct = stats.documents_over_time?.growth_pct;
  const kpiTrends = stats.kpi_trends || {};
  const featureAccess = stats.feature_access || {};
  const showDocuments = featureAccess.documents !== false;
  const showAskAi = featureAccess.ask_ai !== false;
  const showAiTasks = featureAccess.ai_tasks !== false;
  const showKnowledgeBase = featureAccess.knowledge_base !== false;
  const myPermissions = org.my_permissions || [];
  const canPlatformManage = hasPermission('organizations.manage');

  return (
    <>
      <OrgTabs orgSlug={orgSlug} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark">{org.name}</h1>
          <p className="text-sm text-muted dark:text-muted-dark">Company-wide snapshot</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {myPermissions.includes('members.view') && (
            <Link to={`/organizations/${orgSlug}/members`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:hover:bg-white/5">
              <Users className="h-3.5 w-3.5" /> Members
            </Link>
          )}
          {myPermissions.includes('settings.view') && (
            <Link to={`/organizations/${orgSlug}/settings`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:hover:bg-white/5">
              <Settings className="h-3.5 w-3.5" /> Settings
            </Link>
          )}
          {canPlatformManage && <PlatformOrgActions org={org} orgSlug={orgSlug} />}
        </div>
      </div>

      <StatsSyncBadge show={isFetching} />
      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] fade-in-up">
        {showDocuments && (
          <>
            <KpiCard icon={FileText} iconBg="bg-primary/10" iconColor="text-primary" label="Documents" value={stats.document_count ?? 0} numeric trend={kpiTrends.documents} trendLabel="vs last 7 days" chartColor="#FF385C" />
            <KpiCard icon={HardDrive} iconBg="bg-info/10" iconColor="text-info" label="Storage Used" value={stats.total_storage ?? '—'} trend={kpiTrends.storage} trendLabel="vs last 7 days" chartColor="#0EA5E9" />
          </>
        )}
        {showAiTasks && (
          <KpiCard icon={Sparkles} iconBg="bg-accent/10" iconColor="text-accent" label="AI Task Runs" value={stats.ai_task_run_count ?? 0} numeric trend={kpiTrends.ai_tasks} trendLabel="vs last 7 days" chartColor="#460479" />
        )}
        <MiniStatCard icon={Users} iconBg="bg-primary/10" iconColor="text-primary" label="Members" value={stats.member_count ?? 0} numeric />
        <MiniStatCard icon={MessageSquare} iconBg="bg-warning/10" iconColor="text-warning" label="Questions Asked" value={stats.question_count ?? 0} numeric />
        <MiniStatCard icon={UserCircle} iconBg="bg-primary/10" iconColor="text-primary" label="Active This Week" value={stats.active_members_7d ?? 0} numeric />
        {showDocuments && (
          <MiniStatCard
            icon={TrendUp} iconBg="bg-success/10" iconColor="text-success" label="Document Growth (14d)"
            value={growthPct === undefined ? '—' : `${growthPct > 0 ? '+' : ''}${growthPct}%`}
          />
        )}
        {showKnowledgeBase && (
          <MiniStatCard icon={Share2} iconBg="bg-success/10" iconColor="text-success" label="Knowledge Topics" value={stats.topic_count ?? 0} numeric />
        )}
      </div>

      {showDocuments && (
        <>
          <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(240px,340px)]">
            <DocumentsOverTimeCard data={stats.documents_over_time} hasDocuments={!!stats.document_count} range={14} />
            <DocumentTypesCard data={stats.document_types} isDark={isDark} />
          </div>
          <div className="mt-2 mb-4">
            <RecentDocumentsTable rows={stats.recent_documents_table || []} />
          </div>
        </>
      )}

      {showAskAi && (
        <div className="mb-4">
          <AiUsageCard aiPerformance={stats.ai_performance} />
        </div>
      )}

      <div className="mb-4">
        <MemberActivityCard activity={stats.member_activity || []} />
      </div>

      {stats.feature_access_summary && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-5 py-4 text-sm shadow-soft dark:border-line-dark dark:bg-card-dark">
          <Buildings className="h-5 w-5 shrink-0 text-muted dark:text-muted-dark" />
          <div>
            <p className="text-ink dark:text-ink-dark">
              {stats.feature_access_summary.plan_feature_codes === null
                ? 'This company\'s plan includes every feature.'
                : `This company's plan includes: ${stats.feature_access_summary.plan_feature_codes.join(', ')}.`}
            </p>
            {stats.feature_access_summary.members_with_overrides > 0 && (
              <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                {stats.feature_access_summary.members_with_overrides} member{stats.feature_access_summary.members_with_overrides === 1 ? '' : 's'} have a custom feature restriction
                {myPermissions.includes('members.view') && (
                  <> — <Link to={`/organizations/${orgSlug}/members`} className="text-primary hover:underline">manage in Members</Link></>
                )}.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
