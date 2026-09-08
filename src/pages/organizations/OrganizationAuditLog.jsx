import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClockCounterClockwiseIcon as History } from '@phosphor-icons/react';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import PageSkeleton from '../../components/PageSkeleton';
import OrgTabs from '../../layout/OrgTabs';
import { useOrganizationAuditLogs } from '../../api/hooks';

// Color-codes an audit entry's action-type pill by category, purely
// from a substring match on the action codename (e.g.
// "document.uploaded", "member.role_changed") - no fixed enum to keep
// in sync with every action string this or any future call site logs.
function actionColor(action) {
  const a = (action || '').toLowerCase();
  if (a.includes('delete') || a.includes('remove') || a.includes('revoke') || a.includes('suspend')) {
    return 'border-danger/30 text-danger dark:border-danger-dark/30 dark:text-danger-dark';
  }
  if (a.includes('creat') || a.includes('add') || a.includes('upload') || a.includes('invit') || a.includes('reactivat')) {
    return 'border-success/30 text-success dark:border-success-dark/30 dark:text-success-dark';
  }
  if (a.includes('updat') || a.includes('chang') || a.includes('role') || a.includes('archiv')) {
    return 'border-info/30 text-info dark:border-info-dark/30 dark:text-info-dark';
  }
  return 'border-line text-muted dark:border-line-dark dark:text-muted-dark';
}

export default function OrganizationAuditLog() {
  const { orgSlug } = useParams();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const { data, isLoading } = useOrganizationAuditLogs(orgSlug, { page, action });

  if (isLoading || !data) return <PageSkeleton variant="list" />;

  const logs = data.audit_logs || [];
  const availableActions = data.available_actions || [];

  return (
    <>
      <OrgTabs orgSlug={orgSlug} />

      <PageHeader
        title="Audit Log"
        subtitle="Membership, document, role, and settings changes for this organization. Visible to Owners only."
        action={availableActions.length > 0 && (
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark"
          >
            <option value="">All actions</option>
            {availableActions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      />

      <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        {logs.length > 0 ? (
          <div className="divide-y divide-line dark:divide-line-dark">
            {logs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 px-5 py-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-soft">
                  <History className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink dark:text-ink-dark">{entry.description}</p>
                  <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                    {entry.actor || 'System'} · {new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    {entry.ip_address ? ` · ${entry.ip_address}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${actionColor(entry.action)}`}>{entry.action}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={History} title="No activity yet" message="Member, document, and settings changes will show up here." />
        )}

        {(data.has_previous || data.has_next) && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 dark:border-line-dark">
            <button
              disabled={!data.has_previous}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface disabled:opacity-40 dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5"
            >
              Previous
            </button>
            <span className="text-xs text-muted dark:text-muted-dark">Page {data.page} of {data.num_pages} · {data.count} events</span>
            <button
              disabled={!data.has_next}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface disabled:opacity-40 dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
