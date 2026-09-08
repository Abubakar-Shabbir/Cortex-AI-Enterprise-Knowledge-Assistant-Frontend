import { useState } from 'react';
import { CheckIcon as Check, ClockIcon as Clock, CreditCardIcon as CreditCard, PlusIcon as Plus, SlidersHorizontalIcon as Sliders } from '@phosphor-icons/react';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import PageSkeleton from '../components/PageSkeleton';
import Spinner from '../components/Spinner';
import {
  useAssignPlan, useCreatePlan, usePlanRequestAction, usePlatformOrganizationsBilling, usePlatformPlanRequests,
  usePlatformPlans, useUnassignPlan, useUpdatePlan,
} from '../api/hooks';

const LIMIT_FIELDS = [
  { key: 'max_queries_per_month', label: 'Max AI queries / month' },
  { key: 'max_ai_task_runs_per_month', label: 'Max AI Task runs / month' },
  { key: 'max_storage_bytes', label: 'Max storage (bytes)' },
];

const TABS = [
  { key: 'company', label: 'Company Plans' },
  { key: 'personal', label: 'Personal Plans' },
  { key: 'requests', label: 'Plan Requests' },
];

// Empty included_features = every feature included (unrestricted) -
// see Plan.included_features' help_text. The "Restrict to specific
// features" toggle exists so the common case (a new plan grants
// everything) stays a zero-click default, matching that convention.
function FeatureChecklist({ featureCatalog, selected, onChange }) {
  const [restricted, setRestricted] = useState(selected.length > 0);

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted dark:text-muted-dark">
        <input
          type="checkbox" checked={restricted}
          onChange={(e) => { setRestricted(e.target.checked); if (!e.target.checked) onChange([]); }}
        />
        Restrict to specific features (unchecked = every feature included)
      </label>
      {restricted && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface p-3 dark:border-line-dark dark:bg-white/5">
          {featureCatalog.map(({ code, label }) => (
            <label key={code} className="flex items-center gap-2 text-sm text-ink dark:text-ink-dark">
              <input
                type="checkbox" checked={selected.includes(code)}
                onChange={(e) => onChange(e.target.checked ? [...selected, code] : selected.filter((c) => c !== code))}
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePlanModal({ planType, featureCatalog, onClose }) {
  const create = useCreatePlan();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [includedCredits, setIncludedCredits] = useState('0');
  const [allowCreditPurchase, setAllowCreditPurchase] = useState(true);
  const [limits, setLimits] = useState(planType === 'company' ? { max_seats: '' } : {});
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      name, plan_type: planType, included_features: features,
      price: price ? price : null, billing_interval: billingInterval,
      included_credits: parseInt(includedCredits, 10) || 0, allow_credit_purchase: allowCreditPurchase,
      ...Object.fromEntries(Object.entries(limits).map(([k, v]) => [k, v ? parseInt(v, 10) : null])),
    };
    create.mutate(payload, { onSuccess: onClose, onError: (err) => setError(err.message) });
  };

  return (
    <Modal
      title={`New ${planType === 'company' ? 'Company' : 'Personal'} Plan`} icon={Plus}
      onClose={onClose} bodyClassName="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
          <button
            type="submit" form="create-plan-form" disabled={create.isPending || !name} data-testid="submit-create-plan"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {create.isPending ? <Spinner size={16} /> : <Plus className="h-4 w-4" />} {create.isPending ? 'Creating…' : 'Create'}
          </button>
        </>
      }
    >
      <form id="create-plan-form" onSubmit={onSubmit} className="space-y-4">
        {error && <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{error}</p>}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Name</label>
          <input
            required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Starter"
            data-testid="plan-name-input"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Price (blank = free)</label>
            <input
              type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Billing interval</label>
            <select
              value={billingInterval} onChange={(e) => setBillingInterval(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">AI credits included per period</label>
          <input
            type="number" min="0" value={includedCredits} onChange={(e) => setIncludedCredits(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
          />
          <p className="mt-1 text-xs text-muted dark:text-muted-dark">Refills to this exact amount every billing period.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink dark:text-ink-dark">
          <input type="checkbox" checked={allowCreditPurchase} onChange={(e) => setAllowCreditPurchase(e.target.checked)} />
          Allow purchasing extra credits on this plan
        </label>
        {LIMIT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">{label} (blank = unlimited)</label>
            <input
              type="number" min="0" value={limits[key] || ''} onChange={(e) => setLimits((l) => ({ ...l, [key]: e.target.value }))}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
            />
          </div>
        ))}
        {planType === 'company' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Max seats (blank = unlimited)</label>
            <input
              type="number" min="0" value={limits.max_seats || ''} onChange={(e) => setLimits((l) => ({ ...l, max_seats: e.target.value }))}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
            />
          </div>
        )}
        <FeatureChecklist featureCatalog={featureCatalog} selected={features} onChange={setFeatures} />
      </form>
    </Modal>
  );
}

function EditFeaturesModal({ plan, featureCatalog, onClose }) {
  const updatePlan = useUpdatePlan();
  const [features, setFeatures] = useState(plan.included_features || []);
  const [error, setError] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    updatePlan.mutate(
      { planId: plan.id, included_features: features },
      { onSuccess: onClose, onError: (err) => setError(err.message) },
    );
  };

  return (
    <Modal
      title={`Features — ${plan.name}`} icon={Sliders}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
          <button
            type="submit" form="edit-features-form" disabled={updatePlan.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {updatePlan.isPending ? <Spinner size={16} /> : null} {updatePlan.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="edit-features-form" onSubmit={onSubmit} className="space-y-4">
        {error && <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{error}</p>}
        <p className="text-xs text-muted dark:text-muted-dark">Every workspace on this plan is bound by whatever is set here — an Owner can further restrict a member, but can never exceed this.</p>
        <FeatureChecklist featureCatalog={featureCatalog} selected={features} onChange={setFeatures} />
      </form>
    </Modal>
  );
}

function OrganizationBillingRow({ org, plans }) {
  const assign = useAssignPlan();
  const unassign = useUnassignPlan();
  const currentPlanId = org.usage.plan?.id || '';

  return (
    <tr className="transition-colors hover:bg-surface dark:hover:bg-white/5">
      <td className="px-5 py-3 font-medium text-ink dark:text-ink-dark">{org.name}</td>
      <td className="px-3 py-3 text-muted dark:text-muted-dark">
        {org.usage.unlimited ? 'No limits' : `${org.usage.queries_used} queries / ${org.usage.plan.max_queries_per_month ?? '∞'}`}
      </td>
      <td className="px-5 py-3 text-right">
        <select
          value={currentPlanId}
          onChange={(e) => {
            const planId = e.target.value;
            if (planId) assign.mutate({ orgSlug: org.slug, planId });
            else unassign.mutate(org.slug);
          }}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
        >
          <option value="">No plan (unlimited)</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </td>
    </tr>
  );
}

function PlansPanel({ planType, plans, featureCatalog, onEditFeatures }) {
  const updatePlan = useUpdatePlan();
  const [createOpen, setCreateOpen] = useState(false);
  const featureLabel = (code) => featureCatalog.find((f) => f.code === code)?.label || code;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5 dark:border-line-dark">
        <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">{planType === 'company' ? 'Company' : 'Personal'} Plans</h2>
        <button onClick={() => setCreateOpen(true)} data-testid="open-create-plan-modal" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
          <Plus className="h-3.5 w-3.5" /> New Plan
        </button>
      </div>
      {plans.length > 0 ? (
        <div className="divide-y divide-line dark:divide-line-dark">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink dark:text-ink-dark">
                  {plan.name} <span className="font-normal text-muted dark:text-muted-dark">— {plan.price ? `${plan.currency} ${plan.price}/${plan.billing_interval === 'yearly' ? 'yr' : 'mo'}` : 'Free'}</span>
                </p>
                <p className="truncate text-xs text-muted dark:text-muted-dark">
                  {plan.included_credits.toLocaleString()} credits/{plan.billing_interval === 'yearly' ? 'yr' : 'mo'}
                  {' · '}{plan.max_queries_per_month ?? '∞'} queries/mo · {plan.max_ai_task_runs_per_month ?? '∞'} AI Task runs/mo
                  {planType === 'company' ? ` · ${plan.max_seats ?? '∞'} seats` : ''}
                </p>
                <p className="truncate text-xs text-muted dark:text-muted-dark">
                  {plan.included_features?.length ? plan.included_features.map(featureLabel).join(', ') : 'All features'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => onEditFeatures(plan)} className="text-xs font-medium text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark">
                  Edit Features
                </button>
                <button
                  onClick={() => updatePlan.mutate({ planId: plan.id, is_active: !plan.is_active })}
                  className={`text-xs font-medium ${plan.is_active ? 'text-muted hover:text-danger dark:text-muted-dark' : 'text-success dark:text-success-dark'}`}
                >
                  {plan.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={CreditCard} title="No plans yet" />
      )}

      {createOpen && <CreatePlanModal planType={planType} featureCatalog={featureCatalog} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function PlanRequestRow({ pr }) {
  const action = usePlanRequestAction();
  const [note, setNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const who = pr.organization ? pr.organization.name : pr.user?.username;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink dark:text-ink-dark">
          {who} <span className="font-normal text-muted dark:text-muted-dark">→ {pr.requested_plan.name}</span>
        </p>
        <p className="text-xs text-muted dark:text-muted-dark">
          {pr.organization ? 'Company' : 'Personal'} · requested by {pr.requested_by} · {new Date(pr.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
        </p>
      </div>

      {pr.status === 'pending' ? (
        showReject ? (
          <div className="flex items-center gap-2">
            <input
              value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" autoFocus
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-2 focus:border-ink focus:outline-none dark:border-line-dark dark:bg-white/5 dark:text-ink-dark"
            />
            <button
              onClick={() => action.mutate({ requestId: pr.id, action: 'reject', note })}
              className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger/90"
            >
              Confirm Reject
            </button>
            <button onClick={() => setShowReject(false)} className="text-xs font-medium text-muted hover:text-ink dark:text-muted-dark">Cancel</button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => action.mutate({ requestId: pr.id, action: 'approve' })} disabled={action.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button onClick={() => setShowReject(true)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5">
              Reject
            </button>
          </div>
        )
      ) : (
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${pr.status === 'approved' ? 'bg-success/15 text-success dark:text-success-dark' : 'bg-danger/15 text-danger dark:text-danger-dark'}`}>
          {pr.status === 'approved' ? 'Approved' : 'Rejected'}
        </span>
      )}
    </div>
  );
}

function PlanRequestsPanel() {
  const { data, isLoading } = usePlatformPlanRequests();
  if (isLoading || !data) return <PageSkeleton variant="list" />;
  const requests = data.plan_requests || [];
  const pending = requests.filter((r) => r.status === 'pending');
  const reviewed = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        <div className="border-b border-line px-5 py-3.5 dark:border-line-dark">
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Pending ({pending.length})</h2>
        </div>
        {pending.length > 0 ? (
          <div className="divide-y divide-line dark:divide-line-dark">
            {pending.map((pr) => <PlanRequestRow key={pr.id} pr={pr} />)}
          </div>
        ) : (
          <EmptyState icon={Clock} title="No pending requests" />
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
          <div className="border-b border-line px-5 py-3.5 dark:border-line-dark">
            <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">History</h2>
          </div>
          <div className="divide-y divide-line dark:divide-line-dark">
            {reviewed.map((pr) => <PlanRequestRow key={pr.id} pr={pr} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBillingPlans() {
  const [tab, setTab] = useState('company');
  const { data: plansData, isLoading: plansLoading } = usePlatformPlans(tab === 'requests' ? undefined : tab);
  const { data: orgsData, isLoading: orgsLoading } = usePlatformOrganizationsBilling();
  const [editFeaturesPlan, setEditFeaturesPlan] = useState(null);

  const plans = plansData?.plans || [];
  const featureCatalog = plansData?.feature_catalog || [];

  return (
    <>
      <PageHeader title="Billing Plans" subtitle="Internal usage-limit bookkeeping — no real payment processing. Create plans, then assign or approve requests to activate them." />

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1 shadow-softer dark:border-line-dark dark:bg-white/5">
        {TABS.map(({ key, label }) => (
          <button
            key={key} onClick={() => setTab(key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
              tab === key ? 'bg-primary text-white shadow-soft' : 'text-muted hover:bg-card hover:text-ink dark:text-muted-dark dark:hover:bg-white/10 dark:hover:text-ink-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <PlanRequestsPanel />
      ) : plansLoading || !plansData ? (
        <PageSkeleton variant="list" />
      ) : (
        <>
          <PlansPanel planType={tab} plans={plans} featureCatalog={featureCatalog} onEditFeatures={setEditFeaturesPlan} />

          {tab === 'company' && (
            <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
              <div className="border-b border-line px-5 py-3.5 dark:border-line-dark">
                <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Organizations</h2>
                <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">Direct, instant assignment — bypasses the request/approval queue above, for manual overrides.</p>
              </div>
              {orgsLoading || !orgsData ? (
                <PageSkeleton variant="list" />
              ) : (
                <div className="overflow-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-card dark:bg-card-dark">
                      <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                        <th className="px-5 py-3">Company</th>
                        <th className="px-3 py-3">Usage</th>
                        <th className="px-5 py-3 text-right">Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-line-dark">
                      {(orgsData.organizations || []).map((org) => <OrganizationBillingRow key={org.slug} org={org} plans={plans} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {editFeaturesPlan && (
        <EditFeaturesModal plan={editFeaturesPlan} featureCatalog={featureCatalog} onClose={() => setEditFeaturesPlan(null)} />
      )}
    </>
  );
}
