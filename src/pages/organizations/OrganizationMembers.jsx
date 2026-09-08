import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckIcon as Check, DotsThreeIcon as MoreHorizontal, LockKeyIcon as LockKey, MagnifyingGlassIcon as Search, ProhibitIcon as Ban, ArrowsClockwiseIcon as Reactivate, TrashIcon as Trash2, UserPlusIcon as UserPlus, XIcon as X } from '@phosphor-icons/react';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import PageSkeleton from '../../components/PageSkeleton';
import Spinner from '../../components/Spinner';
import OrgTabs from '../../layout/OrgTabs';
import RoleBadge from '../../organizations/RoleBadge';
import {
  useOrganizationMemberAction, useOrganizationMembers, useRegisterMember,
} from '../../api/hooks';

// Merged 2026-09-08: this page used to be split across two - Members
// (roster/register/suspend/remove) and Manage Access (role changes +
// per-member feature-access toggles) - now one unified "Members &
// Access" section, single table, single per-row action menu with
// every action, per the "avoid duplicate pages or overlapping
// functionality" requirement. No backend change was needed for this -
// organization_members_view/organization_member_action_view already
// exposed every action this page needs (update_role, update_features,
// suspend, reactivate, remove), this was purely a frontend consolidation.
const ROLE_LABELS = { org_owner: 'Owner', member: 'Member' };

// Mirrors RAG.models.FEATURE_LABELS - a small, stable list, so a
// second network round-trip just for display labels isn't worth it.
const FEATURE_LABELS = {
  documents: 'Documents',
  knowledge_base: 'Knowledge Base',
  ask_ai: 'Ask AI',
  ai_tasks: 'AI Tasks',
  analytics: 'Analytics',
  reports: 'Reports',
};

// Registers a brand-new member directly (2026-09-06 replacement for
// the "send an invite link, they sign up themselves" flow) - the
// backend generates a username and password and emails them, so this
// form only ever collects a name and an email, never a role (always
// created as Member) or a password.
function RegisterMemberModal({ orgSlug, onClose }) {
  const register = useRegisterMember(orgSlug);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    register.mutate(
      { full_name: fullName, email },
      { onSuccess: (data) => setRegistered(data), onError: (err) => setError(err.message) },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 dark:border-line-dark">
          <h3 className="text-base font-semibold text-ink dark:text-ink-dark">Register Member</h3>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>

        {registered ? (
          <div className="px-6 py-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success dark:text-success-dark"><Check className="h-5 w-5" /></div>
            <p className="text-sm font-medium text-ink dark:text-ink-dark">{fullName} has been added</p>
            <p className="mt-1 text-xs leading-relaxed text-muted dark:text-muted-dark">Their username and a temporary password were emailed to {email}. They'll be asked to set their own password the first time they log in.</p>
            <button onClick={onClose} className="mt-5 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">Done</button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="space-y-4 px-6 py-5">
              {error && <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{error}</p>}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Full name</label>
                <input
                  required autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Email address</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
              <p className="text-xs leading-relaxed text-muted dark:text-muted-dark">A username and a temporary password will be generated automatically and emailed to them - they'll set their own password on first login.</p>
            </div>
            <div className="flex items-center justify-end gap-2.5 border-t border-line bg-surface/60 px-6 py-4 dark:border-line-dark dark:bg-white/[0.03]">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={register.isPending || !fullName || !email} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
                {register.isPending ? <Spinner size={16} /> : <UserPlus className="h-4 w-4" />} {register.isPending ? 'Registering…' : 'Register Member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Feature-access checkbox matrix for one member, bounded above by the
// company's Plan (a Plan-excluded feature shows locked/disabled rather
// than an togglable-but-ineffective checkbox).
function ManageFeatureAccessModal({ member, action, onClose }) {
  const [disabled, setDisabled] = useState(new Set(member.disabled_features || []));
  const [error, setError] = useState('');
  const featureAccess = member.feature_access || {};
  const codes = Object.keys(featureAccess);

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    action.mutate(
      { action: 'update_features', membership_id: member.membership_id, disabled_features: Array.from(disabled) },
      { onSuccess: onClose, onError: (err) => setError(err.message) },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 dark:border-line-dark">
          <h3 className="text-base font-semibold text-ink dark:text-ink-dark">Feature Access — {member.full_name || member.username}</h3>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="space-y-3 px-6 py-5">
            {error && <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{error}</p>}
            {codes.map((code) => {
              const planExcluded = !featureAccess[code] && !disabled.has(code);
              const checked = !disabled.has(code) && !planExcluded;
              return (
                <div key={code}>
                  <label className={`flex items-center gap-2 text-sm ${planExcluded ? 'text-muted dark:text-muted-dark' : 'text-ink dark:text-ink-dark'}`}>
                    <input
                      type="checkbox" checked={checked} disabled={planExcluded}
                      onChange={(e) => setDisabled((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.delete(code); else next.add(code);
                        return next;
                      })}
                    />
                    {FEATURE_LABELS[code] || code}
                  </label>
                  {planExcluded && <p className="ml-6 text-xs text-muted dark:text-muted-dark">Not included in your company's plan</p>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2.5 border-t border-line bg-surface/60 px-6 py-4 dark:border-line-dark dark:bg-white/[0.03]">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={action.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
              {action.isPending ? <Spinner size={16} /> : null} {action.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberRow({ member, assignableRoles, currentUserId, action, onManageFeatures }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (member.full_name || member.username)[0]?.toUpperCase();
  const isSelf = member.user_id === currentUserId;
  // An Owner's feature access can't be restricted (backend refuses the
  // write too) - hidden here rather than shown-then-erroring.
  const canManageFeatures = member.role !== 'org_owner';
  const roleOptions = assignableRoles.filter((r) => r !== member.role);
  const disabledCount = (member.disabled_features || []).length;
  const featureTotal = Object.keys(member.feature_access || {}).length;

  return (
    <tr className="transition-colors hover:bg-surface dark:hover:bg-white/5">
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:bg-primary/15 dark:text-primary-soft">{initials}</div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-ink dark:text-ink-dark">{member.full_name || member.username}{isSelf && <span className="ml-1.5 text-xs font-normal text-muted dark:text-muted-dark">(you)</span>}</p>
            <p className="truncate text-xs text-muted dark:text-muted-dark">{member.email || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3"><RoleBadge role={member.role} /></td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.status === 'active' ? 'text-success dark:text-success-dark' : 'text-danger dark:text-danger-dark'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-success dark:bg-success-dark' : 'bg-danger dark:bg-danger-dark'}`}></span>
          {member.status === 'active' ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">
        {canManageFeatures ? `${featureTotal - disabledCount}/${featureTotal} features` : 'Full access'}
      </td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">{new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
      <td className="px-5 py-3 text-right">
        <div className="relative inline-block text-left">
          <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Member actions" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-line-dark dark:text-muted-dark dark:hover:bg-primary/10 dark:hover:text-primary-soft">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
              <div className="absolute right-0 z-20 mt-2 w-56 space-y-0.5 overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-soft dark:border-line-dark dark:bg-card-dark">
                {roleOptions.map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => { setMenuOpen(false); action.mutate({ action: 'update_role', membership_id: member.membership_id, role: r }); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5"
                  >
                    <Check className="h-4 w-4 shrink-0" /> Make {ROLE_LABELS[r] || r}
                  </button>
                ))}
                {canManageFeatures && (
                  <button
                    type="button" onClick={() => { setMenuOpen(false); onManageFeatures(member); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5"
                  >
                    <LockKey className="h-4 w-4 shrink-0" /> Feature Access
                  </button>
                )}
                {(roleOptions.length > 0 || canManageFeatures) && <div className="my-1 border-t border-line dark:border-line-dark"></div>}
                <button
                  type="button" onClick={() => { setMenuOpen(false); action.mutate({ action: member.status === 'active' ? 'suspend' : 'reactivate', membership_id: member.membership_id }); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${member.status === 'active' ? 'text-warning hover:bg-warning/10 dark:text-warning-dark' : 'text-success hover:bg-success/10 dark:text-success-dark'}`}
                >
                  {member.status === 'active' ? <Ban className="h-4 w-4 shrink-0" /> : <Reactivate className="h-4 w-4 shrink-0" />}
                  {member.status === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); if (window.confirm(`Remove ${member.full_name || member.username} from the organization? They will no longer be able to log in at all.`)) action.mutate({ action: 'remove', membership_id: member.membership_id }); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 dark:text-danger-dark"
                >
                  <Trash2 className="h-4 w-4 shrink-0" /> Remove
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function OrganizationMembers() {
  const { orgSlug } = useParams();
  const { data, isLoading } = useOrganizationMembers(orgSlug);
  const action = useOrganizationMemberAction(orgSlug);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  // Rendered once here (outside the <table>), not per-row inside
  // MemberRow - a <tr>-returning component can't also return a
  // fixed-overlay <div> sibling, since both would land inside <tbody>.
  const [featureAccessMember, setFeatureAccessMember] = useState(null);

  const members = data?.members || [];
  const assignableRoles = data?.assignable_roles || [];

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter && m.role !== roleFilter) return false;
      if (!q) return true;
      return (m.full_name || '').toLowerCase().includes(q) || m.username.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    });
  }, [members, query, roleFilter]);

  if (isLoading || !data) return <PageSkeleton variant="list" />;

  return (
    <>
      <OrgTabs orgSlug={orgSlug} />

      <PageHeader
        title="Members & Access"
        subtitle={`${members.length} member${members.length === 1 ? '' : 's'} in your organization`}
        action={assignableRoles.length > 0 && (
          <button onClick={() => setRegisterOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
            <UserPlus className="h-4 w-4" /> Register Member
          </button>
        )}
      />

      {members.length > 5 && (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted-dark" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…"
              className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
            />
          </div>
          <select
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
          >
            <option value="">All roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        {filteredMembers.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-card dark:bg-card-dark">
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Access</th>
                  <th className="px-3 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-line-dark">
                {filteredMembers.map((m) => (
                  <MemberRow
                    key={m.membership_id} member={m} assignableRoles={assignableRoles} currentUserId={data.current_user_id}
                    action={action} onManageFeatures={setFeatureAccessMember}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={members.length > 0 ? 'No members match your search' : 'No members yet'} />
        )}
      </div>

      {registerOpen && <RegisterMemberModal orgSlug={orgSlug} onClose={() => setRegisterOpen(false)} />}
      {featureAccessMember && (
        <ManageFeatureAccessModal member={featureAccessMember} action={action} onClose={() => setFeatureAccessMember(null)} />
      )}
    </>
  );
}
