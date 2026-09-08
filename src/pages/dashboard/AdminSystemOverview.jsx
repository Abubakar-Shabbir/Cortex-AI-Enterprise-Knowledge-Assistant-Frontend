import { Link } from 'react-router-dom';
import {
  BuildingsIcon as Buildings, ChatCircleIcon as MessageSquare, FileTextIcon as FileText,
  LightningIcon as Lightning, SparkleIcon as Sparkles, UsersIcon as Users,
} from '@phosphor-icons/react';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import PageSkeleton from '../../components/PageSkeleton';
import { useAdminSystemOverview } from '../../api/hooks';

function formatBytes(bytes) {
  if (bytes == null) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function OrganizationUsageRow({ org }) {
  return (
    <tr className="transition-colors hover:bg-surface dark:hover:bg-white/5">
      <td className="px-5 py-3">
        <Link to={`/organizations/${org.slug}`} className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Buildings className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink group-hover:text-primary dark:text-ink-dark dark:group-hover:text-primary-soft">{org.name}</p>
            <p className="truncate text-xs text-muted dark:text-muted-dark">{org.owner || '—'}</p>
          </div>
        </Link>
      </td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{org.member_count}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{org.document_count}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{org.unlimited ? '∞' : org.queries_used ?? '—'}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{org.unlimited ? '∞' : org.ai_task_runs_used ?? '—'}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{formatBytes(org.storage_used_bytes)}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{org.plan_name || 'No plan'}</td>
      <td className="px-5 py-3 text-muted dark:text-muted-dark">
        {org.included_features ? org.included_features.join(', ') || 'None' : 'All features'}
      </td>
    </tr>
  );
}

function SystemAiUsageCard({ aiPerformance }) {
  return (
    <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
      <div className="border-b border-line px-5 py-4 dark:border-line-dark">
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Platform AI Usage</h3>
        <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">Every organization on the platform, combined</p>
      </div>
      {aiPerformance?.has_data ? (
        <>
          <div className="grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted dark:text-muted-dark">Total Requests</p>
              <p className="text-lg font-bold text-ink dark:text-ink-dark">{aiPerformance.total_requests}</p>
            </div>
            <div>
              <p className="text-xs text-muted dark:text-muted-dark">Success Rate</p>
              <p className="text-lg font-bold text-ink dark:text-ink-dark">{aiPerformance.success_rate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted dark:text-muted-dark">Avg Latency</p>
              <p className="text-lg font-bold text-ink dark:text-ink-dark">{aiPerformance.avg_latency_ms}ms</p>
            </div>
            <div>
              <p className="text-xs text-muted dark:text-muted-dark">Fallbacks Used</p>
              <p className="text-lg font-bold text-ink dark:text-ink-dark">{aiPerformance.fallback_used}</p>
            </div>
          </div>
          {(aiPerformance.provider_stats || []).length > 0 && (
            <div className="divide-y divide-line border-t border-line dark:divide-line-dark dark:border-line-dark">
              {aiPerformance.provider_stats.map((p) => (
                <div key={p.provider} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="font-medium text-ink dark:text-ink-dark">{p.provider}</span>
                  <span className="text-xs text-muted dark:text-muted-dark">{p.total} requests · {p.success_rate}% success</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Lightning} title="No AI activity yet" />
      )}
    </div>
  );
}

// Whole-platform overview - system-wide KPIs, a per-company usage
// breakdown, and platform AI usage - distinct from AdminOverview.jsx,
// which is scoped to whichever single workspace is active. Gated on
// "organizations.view_all" (same as /admin/companies) since it exposes
// more cross-company detail than the generic Admin Overview.
export default function AdminSystemOverview() {
  const { data, isLoading } = useAdminSystemOverview();

  if (isLoading || !data) return <PageSkeleton variant="list" />;

  const s = data.system_stats;

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark">System Overview</h1>
        <p className="text-sm text-muted dark:text-muted-dark">Whole-platform KPIs, per-company usage, and combined AI usage — every organization at once.</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard icon={Buildings} iconBg="bg-primary/10" iconColor="text-primary" label="Companies" value={s.organizations.total} numeric trend={s.organizations} trendLabel="vs last 7 days" chartColor="#6C5CE7" />
        <KpiCard icon={Users} iconBg="bg-info/10" iconColor="text-info" label="Active Users" value={s.users.total} numeric trend={s.users} trendLabel="vs last 7 days" chartColor="#0EA5E9" />
        <KpiCard icon={FileText} iconBg="bg-success/10" iconColor="text-success" label="Documents" value={s.documents.total} numeric trend={s.documents} trendLabel="vs last 7 days" chartColor="#22C55E" />
        <KpiCard icon={MessageSquare} iconBg="bg-warning/10" iconColor="text-warning" label="Questions Asked" value={s.queries.total} numeric trend={s.queries} trendLabel="vs last 7 days" chartColor="#F59E0B" />
        <KpiCard icon={Sparkles} iconBg="bg-accent/10" iconColor="text-accent" label="AI Task Runs" value={s.ai_task_runs.total} numeric trend={s.ai_task_runs} trendLabel="vs last 7 days" chartColor="#EC4899" />
      </div>

      <div className="mb-4">
        <SystemAiUsageCard aiPerformance={data.ai_performance} />
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        <div className="border-b border-line px-5 py-3.5 dark:border-line-dark">
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Companies</h2>
        </div>
        {data.organizations.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card dark:bg-card-dark">
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                  <th className="px-5 py-3">Company</th>
                  <th className="px-3 py-3">Members</th>
                  <th className="px-3 py-3">Documents</th>
                  <th className="px-3 py-3">Queries</th>
                  <th className="px-3 py-3">AI Tasks</th>
                  <th className="px-3 py-3">Storage</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-5 py-3">Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-line-dark">
                {data.organizations.map((org) => <OrganizationUsageRow key={org.slug} org={org} />)}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No companies yet" />
        )}
      </div>
    </>
  );
}
