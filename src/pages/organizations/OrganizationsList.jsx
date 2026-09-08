import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BuildingsIcon as Buildings, PlusIcon as Plus, UsersIcon as Users, XIcon as X } from '@phosphor-icons/react';
import EmptyState from '../../components/EmptyState';
import PageSkeleton from '../../components/PageSkeleton';
import Spinner from '../../components/Spinner';
import { useCreateOrganization, useMyOrganizations, useOrganizationTypes } from '../../api/hooks';
import { useOrganization } from '../../organizations/OrganizationContext';
import RoleBadge from '../../organizations/RoleBadge';
import { useSession } from '../../auth/SessionContext';

function CreateOrganizationModal({ orgTypes, onClose }) {
  const navigate = useNavigate();
  const { switchWorkspace } = useOrganization();
  const create = useCreateOrganization();

  const [form, setForm] = useState({
    name: '', org_type: orgTypes[0]?.slug || '', description: '', website: '', industry: '', contact_email: '', contact_phone: '',
  });
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    create.mutate(form, {
      onSuccess: (organization) => {
        switchWorkspace(organization.slug);
        navigate(`/organizations/${organization.slug}`);
      },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 dark:border-line-dark">
          <div>
            <h3 className="text-base font-semibold text-ink dark:text-ink-dark">Create Organization</h3>
            <p className="mt-0.5 text-sm text-muted dark:text-muted-dark">You'll be its Owner.</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-col">
          <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
            {error && <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{error}</p>}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Organization name</label>
              <input
                required autoFocus value={form.name} onChange={set('name')} placeholder="Acme Inc" data-testid="organization-name-input"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Organization type</label>
              <select
                required value={form.org_type} onChange={set('org_type')}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
              >
                {orgTypes.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Description</label>
              <textarea
                rows={2} value={form.description} onChange={set('description')} placeholder="What does your organization do?"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Website</label>
                <input
                  type="url" value={form.website} onChange={set('website')} placeholder="https://…"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Industry</label>
                <input
                  value={form.industry} onChange={set('industry')} placeholder="Software"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Contact email</label>
                <input
                  type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="team@acme.com"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Contact phone</label>
                <input
                  value={form.contact_phone} onChange={set('contact_phone')} placeholder="+1 555 0100"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-line bg-surface/60 px-6 py-4 dark:border-line-dark dark:bg-white/[0.03]">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={create.isPending || !form.name || !form.org_type} data-testid="submit-create-organization" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
              {create.isPending ? <Spinner size={16} /> : <Plus className="h-4 w-4" />} {create.isPending ? 'Creating…' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrganizationCard({ org }) {
  return (
    <Link
      to={`/organizations/${org.slug}`}
      className="group flex flex-col rounded-xl border border-line bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 dark:border-line-dark dark:bg-card-dark dark:hover:border-primary-soft/30"
    >
      <div className="flex items-center gap-3">
        {org.logo_url ? (
          <img src={org.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-soft">
            <Buildings className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink group-hover:text-primary dark:text-ink-dark dark:group-hover:text-primary-soft">{org.name}</p>
          <p className="truncate text-xs text-muted dark:text-muted-dark">{org.org_type_name}</p>
        </div>
      </div>
      {org.description && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted dark:text-muted-dark">{org.description}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted dark:border-line-dark dark:text-muted-dark">
        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {org.member_count} member{org.member_count === 1 ? '' : 's'}</span>
        <RoleBadge role={org.my_role} />
      </div>
    </Link>
  );
}

// The companies a Company account belongs to (see SessionContext's
// accountType / OrganizationContext's docstring) - a Personal account
// never has any and can't create one here; that decision is made once,
// at signup, not through this page (RAG.api.organizations_views.
// organizations_view rejects a POST from a Personal account too, this
// is just the matching frontend affordance).
export default function OrganizationsList() {
  const { accountType } = useSession();
  const { data, isLoading } = useMyOrganizations();
  const { data: typesData } = useOrganizationTypes();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading || !data) return <PageSkeleton variant="grid" />;

  const organizations = data.organizations || [];
  const orgTypes = typesData?.organization_types || [];
  const canCreate = accountType === 'company';

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-ink-dark">Organizations</h1>
          <p className="mt-1 text-sm text-muted dark:text-muted-dark">Companies you belong to.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setModalOpen(true)} data-testid="open-create-organization-modal"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" /> Register Another Company
          </button>
        )}
      </div>

      {organizations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => <OrganizationCard key={org.slug} org={org} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
          <EmptyState
            icon={Buildings}
            title="No organizations yet"
            message="Accept an invitation email to join a company, or ask your admin for one."
          />
        </div>
      )}

      {modalOpen && orgTypes.length > 0 && <CreateOrganizationModal orgTypes={orgTypes} onClose={() => setModalOpen(false)} />}
    </>
  );
}
