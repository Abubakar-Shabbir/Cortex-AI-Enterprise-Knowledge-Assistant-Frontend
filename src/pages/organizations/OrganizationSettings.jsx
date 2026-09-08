import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BuildingsIcon as Buildings, CheckCircleIcon as CheckCircle, FloppyDiskIcon as Save } from '@phosphor-icons/react';
import PageHeader from '../../components/PageHeader';
import PageSkeleton from '../../components/PageSkeleton';
import Spinner from '../../components/Spinner';
import OrgTabs from '../../layout/OrgTabs';
import RoleBadge from '../../organizations/RoleBadge';
import { useOrganizationDetail, useOrganizationTypes, useUpdateOrganization } from '../../api/hooks';

const FIELDS = [
  { key: 'name', label: 'Organization name', required: true },
  { key: 'description', label: 'Description', textarea: true },
  { key: 'website', label: 'Website', type: 'url' },
  { key: 'industry', label: 'Industry' },
  { key: 'contact_email', label: 'Contact email', type: 'email' },
  { key: 'contact_phone', label: 'Contact phone' },
];

export default function OrganizationSettings() {
  const { orgSlug } = useParams();
  const { data: org, isLoading } = useOrganizationDetail(orgSlug);
  const { data: typesData } = useOrganizationTypes();
  const update = useUpdateOrganization(orgSlug);

  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (org) setForm({ name: org.name, description: org.description, website: org.website, industry: org.industry, contact_email: org.contact_email, contact_phone: org.contact_phone, org_type: org.org_type });
  }, [org]);

  if (isLoading || !org || !form) return <PageSkeleton variant="detail" />;

  const canUpdate = (org.my_permissions || []).includes('organization.update');
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSaved(false);
    update.mutate(form, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); } });
  };

  return (
    <>
      <OrgTabs orgSlug={orgSlug} />
      <PageHeader title="Settings" subtitle="Manage your organization's public profile." />

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-5 shadow-soft dark:border-line-dark dark:bg-card-dark">
        {org.logo_url ? (
          <img src={org.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-soft">
            <Buildings className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-ink dark:text-ink-dark">{org.name}</h2>
          <p className="text-sm text-muted dark:text-muted-dark">{org.org_type_name} · {org.member_count} active member{org.member_count === 1 ? '' : 's'}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted dark:text-muted-dark">Your role</p>
          <RoleBadge role={org.my_role} size="md" />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        <div className="border-b border-line px-5 py-4 dark:border-line-dark">
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Organization Profile</h2>
          {!canUpdate && <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">Your role can view these settings but not change them.</p>}
        </div>

        <form onSubmit={onSubmit}>
          <fieldset disabled={!canUpdate} className="space-y-4 p-5 disabled:opacity-70">
            {FIELDS.map(({ key, label, textarea, type, required }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">{label}</label>
                {textarea ? (
                  <textarea
                    rows={3} required={required} value={form[key] || ''} onChange={set(key)}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none disabled:cursor-not-allowed dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
                  />
                ) : (
                  <input
                    type={type || 'text'} required={required} value={form[key] || ''} onChange={set(key)}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none disabled:cursor-not-allowed dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
                  />
                )}
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Organization type</label>
              <select
                value={form.org_type} onChange={set('org_type')}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none disabled:cursor-not-allowed dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
              >
                {(typesData?.organization_types || []).map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
              </select>
            </div>
          </fieldset>

          {canUpdate && (
            <div className="flex items-center justify-end gap-3 border-t border-line bg-surface/60 px-5 py-4 dark:border-line-dark dark:bg-white/[0.03]">
              {saved && <span className="flex items-center gap-1.5 text-sm text-success dark:text-success-dark"><CheckCircle className="h-4 w-4" /> Saved</span>}
              <button type="submit" disabled={update.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
                {update.isPending ? <Spinner size={16} /> : <Save className="h-4 w-4" />} {update.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
