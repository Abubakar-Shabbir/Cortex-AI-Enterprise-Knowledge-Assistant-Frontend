import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BuildingsIcon as Buildings, DotsThreeIcon as MoreHorizontal, TrashIcon as Trash2, UserCheckIcon as UserCheck, UserMinusIcon as UserX } from '@phosphor-icons/react';
import EmptyState from '../components/EmptyState';
import PageSkeleton from '../components/PageSkeleton';
import { usePlatformOrganizationAction, usePlatformOrganizations } from '../api/hooks';

const STATUS_STYLES = {
  active: 'text-success dark:text-success-dark',
  suspended: 'text-warning dark:text-warning-dark',
  pending_deletion: 'text-danger dark:text-danger-dark',
};

const STATUS_LABELS = {
  active: 'Active',
  suspended: 'Suspended',
  pending_deletion: 'Pending Deletion',
};

function OrganizationRow({ organization, canManage, action }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusClass = STATUS_STYLES[organization.status] || 'text-muted dark:text-muted-dark';

  return (
    <tr className="transition-colors hover:bg-surface dark:hover:bg-white/5">
      <td className="px-5 py-3">
        <Link to={`/organizations/${organization.slug}`} className="group flex items-center gap-2.5">
          {organization.logo_url ? (
            <img src={organization.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Buildings className="h-4 w-4" /></div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink group-hover:text-primary dark:text-ink-dark dark:group-hover:text-primary-soft">{organization.name}</p>
            <p className="truncate text-xs text-muted dark:text-muted-dark">{organization.org_type_name}</p>
          </div>
        </Link>
      </td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{organization.owner || '—'}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{organization.size || '—'}</td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusClass.includes('success') ? 'bg-success dark:bg-success-dark' : statusClass.includes('warning') ? 'bg-warning dark:bg-warning-dark' : 'bg-danger dark:bg-danger-dark'}`}></span>
          {STATUS_LABELS[organization.status] || organization.status}
        </span>
      </td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{organization.member_count}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{new Date(organization.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
      <td className="px-5 py-3 text-right">
        {canManage && (
          <div className="relative inline-block text-left">
            <button
              type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Company actions"
              data-testid={`company-actions-${organization.slug}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-line-dark dark:text-muted-dark dark:hover:bg-primary/10 dark:hover:text-primary-soft"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute right-0 z-20 mt-2 w-56 space-y-0.5 overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-soft dark:border-line-dark dark:bg-card-dark">
                  {organization.status === 'suspended' ? (
                    <button
                      type="button"
                      data-testid={`reactivate-organization-${organization.slug}`}
                      onClick={() => { setMenuOpen(false); action.mutate({ orgSlug: organization.slug, action: 'reactivate' }); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-success transition-colors hover:bg-success/10 dark:text-success-dark"
                    >
                      <UserCheck className="h-4 w-4 shrink-0" /> Reactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`suspend-organization-${organization.slug}`}
                      onClick={() => {
                        setMenuOpen(false);
                        if (window.confirm(`Suspend "${organization.name}"? Its members will lose access until it's reactivated.`)) {
                          action.mutate({ orgSlug: organization.slug, action: 'suspend' });
                        }
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-warning transition-colors hover:bg-warning/10 dark:text-warning-dark"
                    >
                      <UserX className="h-4 w-4 shrink-0" /> Suspend
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid={`delete-organization-${organization.slug}`}
                    onClick={() => {
                      setMenuOpen(false);
                      if (window.confirm(`Delete "${organization.name}" permanently? This removes all its members, documents, and data. This cannot be undone.`)) {
                        action.mutate({ orgSlug: organization.slug, action: 'delete' });
                      }
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10 dark:text-danger-dark"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminOrganizations() {
  const { data, isLoading } = usePlatformOrganizations();
  const action = usePlatformOrganizationAction();

  if (isLoading || !data) return <PageSkeleton variant="list" />;

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark">Companies</h1>
        <p className="text-sm text-muted dark:text-muted-dark">Every company on the platform, regardless of membership. Metadata only — document content and Q&A answers stay private to their owner.</p>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        {data.organizations.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card dark:bg-card-dark">
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                  <th className="px-5 py-3">Company</th>
                  <th className="px-3 py-3">Owner</th>
                  <th className="px-3 py-3">Size</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Members</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-line-dark">
                {data.organizations.map((organization) => (
                  <OrganizationRow key={organization.id} organization={organization} canManage={data.can_manage} action={action} />
                ))}
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
