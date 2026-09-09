import { UsersIcon as Users } from '@phosphor-icons/react';
import EmptyState from '../EmptyState';

// Shared by CompanyOwnerOverview.jsx (Owner's own workspace) and
// OrganizationOverview.jsx (Admin/Owner viewing any single company by
// slug) - same organization_stats_view.member_activity payload either way.
export default function MemberActivityCard({ activity }) {
  return (
    <div className="rounded-xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
      <div className="border-b border-line px-5 py-4 dark:border-line-dark">
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Member Activity</h3>
        <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">Usage within this company only — counts only, never question/answer content</p>
      </div>
      {activity.length > 0 ? (
        <div className="overflow-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                <th className="px-5 py-2.5">Member</th>
                <th className="px-3 py-2.5 text-right">Documents</th>
                <th className="px-3 py-2.5 text-right">Questions</th>
                <th className="px-3 py-2.5 text-right">AI Tasks</th>
                <th className="px-5 py-2.5 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-line-dark">
              {activity.map((m) => (
                <tr key={m.user_id}>
                  <td className="px-5 py-2.5 font-medium text-ink dark:text-ink-dark">{m.full_name}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink dark:text-ink-dark">{m.documents_count}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink dark:text-ink-dark">{m.queries_count}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink dark:text-ink-dark">{m.ai_task_runs_count}</td>
                  <td className="px-5 py-2.5 text-right text-xs text-muted dark:text-muted-dark">
                    {m.last_active ? new Date(m.last_active).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Users} title="No member activity yet" />
      )}
    </div>
  );
}
