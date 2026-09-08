import { WarningCircleIcon as AlertCircle, CalendarIcon as Calendar, CaretDownIcon as ChevronDown, CompassIcon as Compass, FileTextIcon as FileText, HardDriveIcon as HardDrive, LockIcon as Lock, ChatCircleIcon as MessageSquare, SparkleIcon as Sparkles, TimerIcon as Timer } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../api/hooks';
import { useSession } from '../../auth/SessionContext';
import ActivityFeedCard from '../../components/ActivityFeedCard';
import { ChartCardSkeleton, ListCardSkeleton, StatCardSkeleton } from '../../components/CardSkeleton';
import DocumentsOverTimeCard from '../../components/dashboard/DocumentsOverTimeCard';
import DocumentTypesCard from '../../components/dashboard/DocumentTypesCard';
import RecentDocumentsTable from '../../components/dashboard/RecentDocumentsTable';
import EmptyState from '../../components/EmptyState';
import KnowledgeSnapshotCard from '../../components/KnowledgeSnapshotCard';
import KpiCard from '../../components/KpiCard';
import MiniStatCard from '../../components/MiniStatCard';
import QuickActions from '../../components/QuickActions';
import Skeleton from '../../components/Skeleton';
import StatsSyncBadge from '../../components/StatsSyncBadge';
import { useTheme } from '../../hooks/useTheme';
import { timeAgo } from '../../lib/timeAgo';

function greetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

// Port of templates/dashboard/_welcome.html.
function Welcome({ name }) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative mb-2.5 overflow-hidden rounded-2xl border border-line bg-primary/[0.04] p-5 shadow-soft dark:border-line-dark dark:bg-primary/10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-32 h-36 w-36 rounded-full bg-accent/10 blur-3xl dark:bg-accent/20" />

      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold leading-snug tracking-tight text-ink dark:text-ink-dark">
            Good {greetingWord()}, {name} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted dark:text-muted-dark">Here&apos;s what&apos;s happening in your workspace today.</p>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-lg border border-line bg-card/90 px-2.5 py-1.5 text-xs font-medium text-ink shadow-softer backdrop-blur-sm dark:border-line-dark dark:bg-card-dark/80 dark:text-ink-dark">
          <Calendar className="h-3.5 w-3.5 text-muted dark:text-muted-dark" />
          {today}
          <ChevronDown className="h-3.5 w-3.5 text-muted dark:text-muted-dark" />
        </div>
      </div>
    </div>
  );
}

// Personal Workspace and Company Member both land here (see
// Dashboard.jsx's routing) - same visual design as Admin Overview
// (KpiCard trend row, Documents Over Time / Document Types charts,
// Recent Documents table - all shared components under
// components/dashboard/), just scoped differently: a Company Member's
// data is narrowed to only their own rows (dashboard_view's
// scope_to_own, see stats_service._workspace_scope()'s docstring) -
// never the rest of the company's - and every section is additionally
// gated by the active workspace's Plan (`feature_access`, computed
// the same way for a Personal Plan or a Company Plan - see
// org_member_feature_service.has_feature_access()) on top of the
// existing RBAC permission check, so a plan that doesn't include e.g.
// AI Tasks hides that card here exactly like it already hides the
// whole /ai-tasks page.
export default function UserOverview() {
  const [range, setRange] = useState(7);
  const { data, isLoading, isFetching, isError, refetch } = useDashboard(range);
  const { user, permissions, canViewAdminArea } = useSession();
  const { isDark } = useTheme();
  const featureAccess = data?.feature_access || {};
  // `has()` alone matches AdminOverview.jsx's own gating; `canShow()`
  // additionally requires the workspace's Plan to include the feature
  // - the one gate Admin Overview doesn't need (Admin bypasses every
  // Plan ceiling, see has_feature_access()'s "organizations.manage"
  // check), so it stays User/Company-Owner-Overview-specific.
  const has = (code) => permissions.includes(code);
  const canShow = (permCode, featureCode) => has(permCode) && featureAccess[featureCode] !== false;
  const displayName = user?.first_name || user?.username || '';

  if (isLoading) {
    return (
      <div>
        <Welcome name={displayName} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(240px,340px)]">
          <ChartCardSkeleton />
          <ChartCardSkeleton height="h-24" />
        </div>
        <div className="mt-2 rounded-xl border border-line bg-card p-3 shadow-soft dark:border-line-dark dark:bg-card-dark">
          <Skeleton className="h-3.5 w-32" />
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <ListCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <Welcome name={displayName} />
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 dark:border-danger-dark/20 dark:bg-danger/10">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger dark:text-danger-dark">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Unable to load dashboard</h2>
              <p className="mt-1 text-xs text-muted dark:text-muted-dark">The dashboard could not be reached. Please try again.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const kpiTrends = data?.kpi_trends || {};
  const knowledgeOverview = data?.knowledge_overview || {};
  const recentQuestions = data?.recent_questions || [];
  const recentAiTaskRuns = data?.recent_ai_task_runs || [];
  const activityFeed = data?.activity_feed || [];

  const showDocuments = canShow('pages.documents', 'documents');
  const showAskAi = canShow('pages.ask_ai', 'ask_ai');
  const showKnowledgeBase = canShow('pages.knowledge_base', 'knowledge_base');
  const showAiTasks = canShow('pages.ai_tasks', 'ai_tasks');

  const hasAnyModule = showDocuments || showAskAi || showKnowledgeBase || showAiTasks || has('pages.analytics') || canViewAdminArea;

  return (
    <div>
      <Welcome name={displayName} />

      {!hasAnyModule ? (
        <EmptyState
          icon={Lock}
          title="No modules assigned yet"
          message="Your role doesn't grant access to any workspace features yet. An Admin can grant access from Roles."
        />
      ) : (
        <>
          <StatsSyncBadge show={isFetching && !isLoading} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] fade-in-up">
            {showDocuments && (
              <>
                <KpiCard icon={FileText} iconBg="bg-primary/10" iconColor="text-primary" label="My Documents" value={stats.total_documents} numeric trend={kpiTrends.documents} trendLabel="vs last 7 days" chartColor="#FF385C" />
                <KpiCard icon={HardDrive} iconBg="bg-success/10" iconColor="text-success" label="Storage Used" value={stats.storage_used} trend={kpiTrends.storage} trendLabel="vs last 7 days" chartColor="#16A34A" />
              </>
            )}
            {showAskAi && (
              <>
                <KpiCard icon={MessageSquare} iconBg="bg-info/10" iconColor="text-info" label="Queries Today" value={stats.today_queries} numeric trend={kpiTrends.queries} trendLabel="vs yesterday" chartColor="#0EA5E9" />
                <MiniStatCard icon={Timer} iconBg="bg-warning/10" iconColor="text-warning" label="Avg Response Time" value={stats.avg_response_time} />
              </>
            )}
            {showAiTasks && (
              <KpiCard icon={Sparkles} iconBg="bg-accent/10" iconColor="text-accent" label="AI Task Runs" value={stats.ai_task_runs} numeric trend={kpiTrends.ai_tasks} trendLabel="vs last 7 days" chartColor="#460479" />
            )}
            {showKnowledgeBase && (
              <MiniStatCard icon={Compass} iconBg="bg-success/10" iconColor="text-success" label="Topics" value={knowledgeOverview.total_entities} numeric />
            )}
          </div>

          {showDocuments && (
            <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(240px,340px)]">
              <DocumentsOverTimeCard data={data?.documents_over_time} hasDocuments={!!stats.total_documents} range={range} onRangeChange={setRange} />
              <DocumentTypesCard data={data?.document_types} isDark={isDark} />
            </div>
          )}

          <div className="mt-2">
            <QuickActions />
          </div>

          {showDocuments && (
            <div className="mt-2">
              <RecentDocumentsTable rows={data?.recent_documents_table || []} showOwner={false} />
            </div>
          )}

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
            {showAskAi && (
              <div className="flex h-full flex-col rounded-xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
                <div className="flex items-center justify-between border-b border-line px-3.5 py-1.5 dark:border-line-dark">
                  <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Recent Questions</h2>
                  <Link to="/history" className="text-xs font-medium text-primary hover:underline dark:text-primary-soft">View all</Link>
                </div>
                <div className="divide-y divide-line dark:divide-line-dark">
                  {recentQuestions.length === 0 ? (
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-line/50 text-muted dark:bg-white/5 dark:text-muted-dark">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted dark:text-muted-dark">No questions asked yet.</p>
                        <Link to="/ask" className="text-xs font-medium text-primary hover:underline dark:text-primary-soft">Ask your first question</Link>
                      </div>
                    </div>
                  ) : (
                    recentQuestions.map((log) => (
                      <div key={log.id} className="flex items-center gap-2.5 px-3.5 py-1.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-snug text-ink dark:text-ink-dark">{log.question}</p>
                          <p className="mt-0.5 text-xs leading-snug text-muted dark:text-muted-dark">
                            {log.confidence}% confidence · {timeAgo(log.created_at)} ago
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {showKnowledgeBase && (
              <KnowledgeSnapshotCard data={knowledgeOverview} />
            )}

            <ActivityFeedCard events={activityFeed} />

            {showAiTasks && (
              <div className="flex h-full flex-col rounded-xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
                <div className="flex items-center justify-between border-b border-line px-3.5 py-1.5 dark:border-line-dark">
                  <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Recent AI Task Runs</h2>
                  <Link to="/ai-tasks/history" className="text-xs font-medium text-primary hover:underline dark:text-primary-soft">View all</Link>
                </div>
                <div className="divide-y divide-line dark:divide-line-dark">
                  {recentAiTaskRuns.length === 0 ? (
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-line/50 text-muted dark:bg-white/5 dark:text-muted-dark">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted dark:text-muted-dark">No AI Tasks run yet.</p>
                        <Link to="/ai-tasks" className="text-xs font-medium text-primary hover:underline dark:text-primary-soft">Run your first AI Task</Link>
                      </div>
                    </div>
                  ) : (
                    recentAiTaskRuns.map((run) => (
                      <Link
                        key={run.id}
                        to={`/ai-tasks/${run.id}/results`}
                        className="flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-surface dark:hover:bg-white/5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-snug text-ink dark:text-ink-dark">{run.task_type_display}</p>
                          <p className="mt-0.5 text-xs leading-snug text-muted dark:text-muted-dark">
                            {run.status_display} · {timeAgo(run.created_at)} ago
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
