import { useSearchParams } from 'react-router-dom';
import { CheckCircleIcon as CheckCircle2, DownloadSimpleIcon as Download, FunnelIcon as Filter, FlagIcon as Flag, GaugeIcon as Gauge, GitBranchIcon as GitBranch, MagnifyingGlassIcon as Search, TimerIcon as Timer } from '@phosphor-icons/react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import PageSkeleton from '../components/PageSkeleton';
import Spinner from '../components/Spinner';
import { getApiBaseUrl } from '../api/client';
import { timeAgo } from '../lib/timeAgo';
import { useAdminQueries, useToggleQueryFlag } from '../api/hooks';

// Port of templates/admin/queries.html. Deliberately metadata-only -
// there is no content-viewing capability anywhere on this page (no
// "View" action, no question/answer column, no content-text search):
// an admin sees THAT a query happened - owner, status, search method,
// confidence, response time, source count, flagged state, timestamp -
// never what was actually asked or answered. See
// RAG.api.admin_queries_views' module docstring for the backend side
// of this (there is no detail endpoint to call at all).
export default function AdminQueries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(searchParams.entries());
  const { data, isLoading } = useAdminQueries(filters);
  const toggleFlag = useToggleQueryFlag();

  if (isLoading || !data) return <PageSkeleton variant="list" />;

  const onFilterSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const next = {};
    for (const [key, value] of form.entries()) if (value) next[key] = value;
    setSearchParams(next);
  };

  const setPage = (p) => setSearchParams({ ...filters, page: String(p) });
  const exportUrl = `${getApiBaseUrl()}/api/admin/queries/export.csv?${searchParams.toString()}`;

  return (
    <>
      <PageHeader title="Queries" subtitle="Every question logged across the workspace, with filters and analytics — metadata only. Question and answer content is never shown here." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Search} label="Total Queries" value={data.analytics.total} numeric />
        <StatCard icon={CheckCircle2} label="Answered" value={data.analytics.answered_pct} sublabel="% of all queries" numeric />
        <StatCard icon={Gauge} label="Avg Confidence" value={data.analytics.avg_confidence} sublabel="percent" numeric />
        <StatCard icon={Timer} label="Avg Response" value={data.analytics.avg_response_time} sublabel="milliseconds" numeric />
        <StatCard icon={Flag} label="Flagged" value={data.analytics.flagged_count} numeric />
        <StatCard icon={GitBranch} label="Top Method" value={data.analytics.top_method} />
      </div>

      <div className="mb-4 rounded-2xl border border-line bg-card p-4 shadow-soft dark:border-line-dark dark:bg-card-dark">
        <form key={searchParams.toString()} onSubmit={onFilterSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">Owner</label>
            <input type="text" name="owner" defaultValue={filters.owner} placeholder="Username…" className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">Scope</label>
            <select name="scope" defaultValue={filters.scope || ''} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark">
              <option value="">Everyone</option>
              <option value="mine">My own queries</option>
              <option value="others">Other members' queries</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">Status</label>
            <select name="status" defaultValue={filters.status || ''} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark">
              <option value="">Any</option>
              <option value="answered">Answered</option>
              <option value="not_found">No Answer Found</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">Method</label>
            <select name="method" defaultValue={filters.method || ''} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark">
              <option value="">Any</option>
              {data.search_methods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">Min. confidence</label>
            <select name="min_confidence" defaultValue={filters.min_confidence || ''} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark">
              <option value="">Any</option>
              <option value="25">25%+</option>
              <option value="50">50%+</option>
              <option value="75">75%+</option>
              <option value="90">90%+</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">Sort</label>
            <select name="sort" defaultValue={filters.sort || 'newest'} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="confidence_high">Confidence: high → low</option>
              <option value="confidence_low">Confidence: low → high</option>
              <option value="slowest">Slowest first</option>
              <option value="fastest">Fastest first</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">From</label>
            <input type="date" name="date_from" defaultValue={filters.date_from} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted dark:text-muted-dark">To</label>
            <input type="date" name="date_to" defaultValue={filters.date_to} className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:text-ink-dark" />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink dark:text-ink-dark">
            <input type="checkbox" name="flagged" value="1" defaultChecked={filters.flagged === '1'} className="h-4 w-4 rounded border-line text-primary focus:ring-primary dark:border-line-dark" />
            Flagged only
          </label>
          <div className="flex items-end gap-2 lg:col-span-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"><Filter className="h-4 w-4" /> Apply</button>
            <button type="button" onClick={() => setSearchParams({})} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5">Reset</button>
            <a href={exportUrl} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-line-dark dark:text-ink-dark dark:hover:bg-primary/10">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        {data.results.length > 0 ? (
          <>
            <div className="overflow-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-card dark:bg-card-dark">
                  <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3 text-right">Confidence</th>
                    <th className="px-3 py-3 text-right">Response</th>
                    <th className="px-3 py-3 text-right">Sources</th>
                    <th className="px-3 py-3">Asked</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line dark:divide-line-dark">
                  {data.results.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-surface dark:hover:bg-white/5">
                      <td className="px-5 py-3 font-medium text-ink dark:text-ink-dark">{log.owner}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${log.status_answered ? 'bg-success/10 text-success dark:text-success-dark' : 'bg-danger/10 text-danger dark:text-danger-dark'}`}>{log.status_label}</span>
                      </td>
                      <td className="px-3 py-3 text-muted dark:text-muted-dark">{log.search_method}</td>
                      <td className="px-3 py-3 text-right text-muted dark:text-muted-dark">{log.confidence}%</td>
                      <td className="px-3 py-3 text-right text-muted dark:text-muted-dark">{log.response_time_ms} ms</td>
                      <td className="px-3 py-3 text-right text-muted dark:text-muted-dark">{log.source_count}</td>
                      <td className="px-3 py-3 text-muted dark:text-muted-dark">{timeAgo(log.created_at)} ago</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button" onClick={() => toggleFlag.mutate(log.id)} disabled={toggleFlag.isPending && toggleFlag.variables === log.id} title={log.is_flagged ? 'Unpin' : 'Pin for follow-up'}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${log.is_flagged ? 'text-warning hover:bg-warning/10' : 'text-muted hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5'}`}
                        >
                          {toggleFlag.isPending && toggleFlag.variables === log.id ? <Spinner size={16} /> : <Flag className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.num_pages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3 dark:border-line-dark">
                <p className="text-xs text-muted dark:text-muted-dark">Page {data.page} of {data.num_pages} · {data.count} total</p>
                <div className="flex gap-2">
                  {data.has_previous && <button onClick={() => setPage(data.page - 1)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5">Previous</button>}
                  {data.has_next && <button onClick={() => setPage(data.page + 1)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5">Next</button>}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={Search} title="No queries match these filters" />
        )}
      </div>
    </>
  );
}
