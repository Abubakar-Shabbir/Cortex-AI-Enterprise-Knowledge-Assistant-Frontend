import { Link } from 'react-router-dom';
import {
  BuildingsIcon as Buildings, ChatCircleIcon as MessageSquare, FileTextIcon as FileText, GearSixIcon as Settings,
  HardDrivesIcon as HardDrive, ShareNetworkIcon as Share2, SparkleIcon as Sparkles,
  TrendUpIcon as TrendUp, UserCircleIcon as UserCircle, UserIcon as UserIconOutline, UsersIcon as Users,
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
import { useTheme } from '../../hooks/useTheme';
import { useOrganization } from '../../organizations/OrganizationContext';
import { useOrganizationStats } from '../../api/hooks';

// Advanced Company-Owner dashboard - the "/" landing page for an
// Owner viewing their active company workspace, replacing the old
// "Organizations" nav tab as the entry point into org-wide stats
// (Members/Manage Access/Settings/Billing/Audit Logs are now direct
// sidebar links instead - see CompanyNav.jsx). Built on
// organization_stats_view's payload - the same endpoint the leaner,
// no-longer-sidebar-linked OrganizationOverview.jsx also uses - now
// enhanced with member-activity/AI-usage breakdowns plus the Owner's
// own "Your Activity" slice of that same payload (stats.my_activity,
// see stats_service.get_my_activity_summary). Deliberately built from
// the exact same shared components AdminOverview.jsx uses (KpiCard,
// DocumentsOverTimeCard, DocumentTypesCard, RecentDocumentsTable) so
// an Owner's Overview reads as the same product, not a different one
// with company-flavored extras bolted on - the numbers are just
// org-wide instead of platform-wide. Every section is additionally
// gated by `feature_access` (the org's Plan, composed with any
// per-member override - see org_member_feature_service.
// get_member_feature_access()'s docstring; an Owner is still bounded
// by the Plan ceiling here, just never by a per-member override), on
// top of the fact that this page is only reachable at all by an
// Owner (Dashboard.jsx's 'organization.view' check).
export default function CompanyOwnerOverview() {
  const { activeOrganization } = useOrganization();
  const { data: stats, isLoading, isFetching } = useOrganizationStats(activeOrganization?.slug);
  const { isDark } = useTheme();

  if (!activeOrganization || isLoading || !stats) return <PageSkeleton variant="detail" />;

  const growthPct = stats.documents_over_time?.growth_pct;
  const orgSlug = activeOrganization.slug;
  const kpiTrends = stats.kpi_trends || {};
  const featureAccess = stats.feature_access || {};
  const showDocuments = featureAccess.documents !== false;
  const showAskAi = featureAccess.ask_ai !== false;
  const showAiTasks = featureAccess.ai_tasks !== false;
  const showKnowledgeBase = featureAccess.knowledge_base !== false;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark">{activeOrganization.name}</h1>
          <p className="text-sm text-muted dark:text-muted-dark">Company-wide overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/organizations/${orgSlug}/members`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:hover:bg-white/5">
            <Users className="h-3.5 w-3.5" /> Members
          </Link>
          <Link to={`/organizations/${orgSlug}/settings`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:hover:bg-white/5">
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
        </div>
      </div>

      <StatsSyncBadge show={isFetching && !isLoading} />
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

      <div className="mb-4 mt-4">
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Your Activity</h3>
        <p className="mb-2 mt-0.5 text-xs text-muted dark:text-muted-dark">Just your own contribution to this workspace — never anyone else's activity</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStatCard icon={FileText} label="Your Documents" value={stats.my_activity?.documents ?? 0} numeric />
          <MiniStatCard icon={MessageSquare} iconBg="bg-info/10" iconColor="text-info" label="Your Questions Asked" value={stats.my_activity?.questions_asked ?? 0} numeric />
          <MiniStatCard icon={Sparkles} iconBg="bg-accent/10" iconColor="text-accent" label="Your AI Task Runs" value={stats.my_activity?.ai_task_runs ?? 0} numeric />
          <MiniStatCard icon={UserIconOutline} iconBg="bg-success/10" iconColor="text-success" label="Your Storage Used" value={stats.my_activity?.storage_used ?? '—'} />
        </div>
      </div>

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
                ? 'Your plan includes every feature.'
                : `Your plan includes: ${stats.feature_access_summary.plan_feature_codes.join(', ')}.`}
            </p>
            {stats.feature_access_summary.members_with_overrides > 0 && (
              <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                {stats.feature_access_summary.members_with_overrides} member{stats.feature_access_summary.members_with_overrides === 1 ? '' : 's'} have a custom feature restriction —
                {' '}<Link to={`/organizations/${orgSlug}/members`} className="text-primary hover:underline">manage in Members</Link>.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
