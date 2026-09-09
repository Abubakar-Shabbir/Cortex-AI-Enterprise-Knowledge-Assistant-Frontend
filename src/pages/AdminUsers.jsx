import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingsIcon as Buildings, CheckIcon as Check, IdentificationCardIcon as IdCard,
  MagnifyingGlassIcon as Search, DotsThreeIcon as MoreHorizontal, ShieldIcon as Shield,
  TrashIcon as Trash2, UserCheckIcon as UserCheck, UserCircleIcon as UserCircle, UserMinusIcon as UserX, XIcon as X,
} from '@phosphor-icons/react';
import ActionMenu from '../components/ActionMenu';
import EmptyState from '../components/EmptyState';
import PageSkeleton from '../components/PageSkeleton';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import { useAdminUserAction, useAdminUsers } from '../api/hooks';

function RoleModal({ member, roles, adminRoleId, assignableRoleIds, onClose, onSave, saving }) {
  const [roleSlug, setRoleSlug] = useState(roles.find((r) => r.id === member.role_id)?.slug || '');
  const showAdminNotice = member.role_id === adminRoleId && !assignableRoleIds.includes(adminRoleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm dark:bg-black/75" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:border-line-dark dark:bg-card-dark dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] dark:ring-white/10">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 dark:border-line-dark">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink dark:text-ink-dark">Change Role</h3>
            <p className="mt-0.5 truncate text-sm text-muted dark:text-muted-dark">{member.full_name || member.username}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(roleSlug); }} className="flex min-h-0 flex-col">
          <div className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">Select a role</p>
            {roles.map((role) => (
              <label key={role.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary/5 dark:border-line-dark dark:hover:bg-white/5 dark:has-[:checked]:bg-primary/10">
                <input type="radio" name="role" value={role.slug} checked={roleSlug === role.slug} onChange={() => setRoleSlug(role.slug)} className="mt-0.5 shrink-0 border-line text-primary focus:ring-primary/30 dark:border-line-dark" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink dark:text-ink-dark">{role.name}</span>
                  {role.description && <span className="mt-0.5 block text-xs text-muted dark:text-muted-dark">{role.description}</span>}
                </span>
              </label>
            ))}
            {showAdminNotice && (
              <p className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted dark:border-line-dark dark:bg-white/5 dark:text-muted-dark">
                This account is Admin. Only an Admin can change an Admin's role.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2.5 border-t border-line bg-surface/60 px-6 py-4 dark:border-line-dark dark:bg-white/[0.03]">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving || !roleSlug} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
              {saving ? <Spinner size={16} /> : <Check className="h-4 w-4" />} {saving ? 'Saving…' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserRow({ member, data, action }) {
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const initials = (member.full_name || member.username)[0]?.toUpperCase();
  const organizations = member.organizations || [];

  return (
    <tr className="transition-colors hover:bg-surface dark:hover:bg-white/5">
      <td className="px-5 py-3">
        <Link to={`/admin/users/${member.id}/profile`} className="group flex items-center gap-2.5">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials}</div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink group-hover:text-primary dark:text-ink-dark dark:group-hover:text-primary-soft">{member.full_name || member.username}</p>
            <p className="truncate text-xs text-muted dark:text-muted-dark">{member.headline || member.email || '—'}</p>
          </div>
        </Link>
      </td>
      <td className="px-3 py-3">
        <span
          className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
          title={member.role_assigned_at ? `Set to ${member.role_name} by ${member.role_assigned_by || 'the system'}` : undefined}
        >
          {member.role_name || 'Unassigned'}
        </span>
      </td>
      <td className="px-3 py-3">
        {organizations.length > 0 ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:text-primary-soft"
            title={organizations.map((o) => o.name).join(', ')}
          >
            <Buildings className="h-3 w-3 shrink-0" />
            <span className="max-w-[140px] truncate">{organizations[0].name}</span>
            {organizations.length > 1 && <span className="shrink-0">+{organizations.length - 1}</span>}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted dark:text-muted-dark">
            <UserCircle className="h-3.5 w-3.5 shrink-0" /> Personal
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.is_active ? 'text-success dark:text-success-dark' : 'text-danger dark:text-danger-dark'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${member.is_active ? 'bg-success dark:bg-success-dark' : 'bg-danger dark:bg-danger-dark'}`}></span>
          {member.is_active ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{new Date(member.date_joined).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
      <td className="px-5 py-3 text-right">
        <ActionMenu
          trigger={({ ref, toggle }) => (
            <button ref={ref} type="button" onClick={toggle} aria-label="User actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-line-dark dark:text-muted-dark dark:hover:bg-primary/10 dark:hover:text-primary-soft">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        >
          {(close) => (
            <>
              <Link to={`/admin/users/${member.id}/profile`} onClick={close} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5">
                <IdCard className="h-4 w-4 shrink-0" /> View Profile
              </Link>
              {data.can_assign_role && (
                <button type="button" onClick={() => { close(); setRoleModalOpen(true); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5">
                  <Shield className="h-4 w-4 shrink-0" /> Change Role
                </button>
              )}
              {data.can_suspend && (
                <button
                  type="button" onClick={() => { close(); action.mutate({ action: member.is_active ? 'suspend' : 'activate', user_id: member.id }); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${member.is_active ? 'text-warning hover:bg-warning/10 dark:text-warning-dark' : 'text-success hover:bg-success/10 dark:text-success-dark'}`}
                >
                  {member.is_active ? <UserX className="h-4 w-4 shrink-0" /> : <UserCheck className="h-4 w-4 shrink-0" />}
                  {member.is_active ? 'Suspend' : 'Reactivate'}
                </button>
              )}
              {data.can_delete && member.id !== data.current_user_id && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    if (window.confirm('Delete this user permanently? This cannot be undone.')) action.mutate({ action: 'delete', user_id: member.id });
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10 dark:text-danger-dark"
                >
                  <Trash2 className="h-4 w-4 shrink-0" /> Delete
                </button>
              )}
            </>
          )}
        </ActionMenu>

        {roleModalOpen && (
          <RoleModal
            member={member} roles={data.assignable_roles} adminRoleId={data.admin_role_id} assignableRoleIds={data.assignable_role_ids}
            onClose={() => setRoleModalOpen(false)} saving={action.isPending}
            onSave={(roleSlug) => action.mutate({ action: 'assign_role', user_id: member.id, role: roleSlug }, { onSuccess: () => setRoleModalOpen(false) })}
          />
        )}
      </td>
    </tr>
  );
}

const COMPANY_FILTER_OPTIONS_BASE = [
  { value: '', label: 'All companies' },
  { value: '__personal__', label: 'Personal (no company)' },
];

// Port of templates/admin/users.html.
export default function AdminUsers() {
  const { data, isLoading } = useAdminUsers();
  const action = useAdminUserAction();
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const users = data?.users || [];
  const companyOptions = useMemo(() => [
    ...COMPANY_FILTER_OPTIONS_BASE,
    ...(data?.organizations || []).map((o) => ({ value: o.slug, label: o.name })),
  ], [data]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const orgs = u.organizations || [];
      if (companyFilter === '__personal__' && orgs.length > 0) return false;
      if (companyFilter && companyFilter !== '__personal__' && !orgs.some((o) => o.slug === companyFilter)) return false;
      if (!q) return true;
      return (u.full_name || '').toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [users, query, companyFilter]);

  if (isLoading || !data) return <PageSkeleton variant="list" />;

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark">Users</h1>
        <p className="text-sm text-muted dark:text-muted-dark">Account status and role assignment, viewable by company. Metadata only — document content and Q&A answers stay private to their owner.</p>
      </div>

      {users.length > 5 && (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted-dark" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…"
              className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select size="sm" value={companyFilter} onChange={setCompanyFilter} options={companyOptions} />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        {filteredUsers.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card dark:bg-card-dark">
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                  <th className="px-5 py-3">User</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-line-dark">
                {filteredUsers.map((member) => (
                  <UserRow key={member.id} member={member} data={data} action={action} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No users found" message={query || companyFilter ? 'Try a different search or company filter.' : undefined} />
        )}
      </div>
    </>
  );
}
