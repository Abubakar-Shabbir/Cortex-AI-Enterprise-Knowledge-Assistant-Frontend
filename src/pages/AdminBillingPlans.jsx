import { useState } from 'react';
import {
  CheckIcon as Check, ClockIcon as Clock, CoinIcon as Coin, CreditCardIcon as CreditCard,
  EyeIcon as Eye, GaugeIcon as Gauge, IdentificationCardIcon as IdCard, PlusIcon as Plus,
  SlidersHorizontalIcon as Sliders, TagIcon as Tag, TrashIcon as Trash,
} from '@phosphor-icons/react';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import PageSkeleton from '../components/PageSkeleton';
import PlanCard from '../components/PlanCard';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import {
  useCreatePlan, useDeletePlan, usePlanRequestAction, usePlatformPlanRequests, usePlatformPlans, useUpdatePlan,
} from '../api/hooks';

const BILLING_INTERVAL_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary-soft">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-ink dark:text-ink-dark">{title}</h4>
        {description && <p className="text-xs text-muted dark:text-muted-dark">{description}</p>}
      </div>
    </div>
  );
}

const LIMIT_FIELDS = [
  { key: 'max_queries_per_month', label: 'Max AI queries / month' },
  { key: 'max_ai_task_runs_per_month', label: 'Max AI Task runs / month' },
  { key: 'max_storage_bytes', label: 'Max storage (bytes)' },
];

const TABS = [
  { key: 'company', label: 'Company Plans' },
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
      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/20 dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:hover:border-ink-dark/20">
        <input
          type="checkbox" checked={restricted}
          onChange={(e) => { setRestricted(e.target.checked); if (!e.target.checked) onChange([]); }}
          className="h-4 w-4 shrink-0 rounded border-line text-primary focus:ring-primary/30 dark:border-line-dark"
        />
        <span>
          Restrict to specific features
          <span className="block text-xs font-normal text-muted dark:text-muted-dark">Unchecked = every feature is included</span>
        </span>
      </label>
      {restricted && (
        <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {featureCatalog.map(({ code, label }) => (
            <label
              key={code}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink transition-colors hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary/5 dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5 dark:has-[:checked]:bg-primary/10"
            >
              <input
                type="checkbox" checked={selected.includes(code)}
                onChange={(e) => onChange(e.target.checked ? [...selected, code] : selected.filter((c) => c !== code))}
                className="h-4 w-4 shrink-0 rounded border-line text-primary focus:ring-primary/30 dark:border-line-dark"
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

  const previewPlan = {
    name: name || 'Untitled Plan',
    description: null,
    price: price || null,
    currency: 'USD',
    billing_interval: billingInterval,
    included_credits: parseInt(includedCredits, 10) || 0,
    allow_credit_purchase: allowCreditPurchase,
    max_queries_per_month: limits.max_queries_per_month ? parseInt(limits.max_queries_per_month, 10) : null,
    max_ai_task_runs_per_month: limits.max_ai_task_runs_per_month ? parseInt(limits.max_ai_task_runs_per_month, 10) : null,
    max_storage_bytes: limits.max_storage_bytes ? parseInt(limits.max_storage_bytes, 10) : null,
    max_seats: planType === 'company' ? (limits.max_seats ? parseInt(limits.max_seats, 10) : null) : null,
    plan_type: planType,
    included_features: features,
  };

  const inputClass = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark';
  const cardClass = 'rounded-xl border border-line/70 bg-surface/40 p-4 dark:border-line-dark/70 dark:bg-white/[0.02]';
  const fieldLabelClass = 'mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark';

  return (
    <Modal
      title="New Company Plan" icon={Plus} maxWidth="max-w-4xl"
      onClose={onClose} bodyClassName="grid max-h-[75vh] grid-cols-1 gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[1fr_300px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
          <button
            type="submit" form="create-plan-form" disabled={create.isPending || !name} data-testid="submit-create-plan"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {create.isPending ? <Spinner size={16} /> : <Plus className="h-4 w-4" />} {create.isPending ? 'Creating…' : 'Create Plan'}
          </button>
        </>
      }
    >
      <form id="create-plan-form" onSubmit={onSubmit} className="space-y-4">
        {error && <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{error}</p>}

        <section className={cardClass}>
          <SectionHeader icon={IdCard} title="Basic Info" />
          <div>
            <label className={fieldLabelClass}>Plan name <span className="text-danger dark:text-danger-dark">*</span></label>
            <div className="group relative">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-ink dark:text-muted-dark dark:group-focus-within:text-ink-dark" />
              <input
                required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Starter"
                data-testid="plan-name-input"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader icon={Coin} title="Pricing & Credits" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fieldLabelClass}>Price (blank = free)</label>
                <div className="group relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted transition-colors group-focus-within:text-ink dark:text-muted-dark dark:group-focus-within:text-ink-dark">$</span>
                  <input
                    type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    className={`${inputClass} pl-7`}
                  />
                </div>
              </div>
              <Select label="Billing interval" value={billingInterval} onChange={setBillingInterval} options={BILLING_INTERVAL_OPTIONS} />
            </div>
            <div>
              <label className={fieldLabelClass}>AI credits included per period</label>
              <div className="group relative">
                <Coin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-ink dark:text-muted-dark dark:group-focus-within:text-ink-dark" />
                <input
                  type="number" min="0" value={includedCredits} onChange={(e) => setIncludedCredits(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted dark:text-muted-dark">Refills to this exact amount every billing period.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors hover:border-ink/20 dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:hover:border-ink-dark/20">
              <input
                type="checkbox" checked={allowCreditPurchase} onChange={(e) => setAllowCreditPurchase(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-line text-primary focus:ring-primary/30 dark:border-line-dark"
              />
              Allow purchasing extra credits on this plan
            </label>
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader icon={Gauge} title="Usage Limits" description="Leave a field blank for unlimited." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LIMIT_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className={fieldLabelClass}>{label}</label>
                <input
                  type="number" min="0" value={limits[key] || ''} onChange={(e) => setLimits((l) => ({ ...l, [key]: e.target.value }))}
                  className={inputClass}
                />
              </div>
            ))}
            {planType === 'company' && (
              <div>
                <label className={fieldLabelClass}>Max seats</label>
                <input
                  type="number" min="0" value={limits.max_seats || ''} onChange={(e) => setLimits((l) => ({ ...l, max_seats: e.target.value }))}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <SectionHeader icon={Tag} title="Features" />
          <FeatureChecklist featureCatalog={featureCatalog} selected={features} onChange={setFeatures} />
        </section>
      </form>

      <div className="hidden lg:block">
        <div className="sticky top-0 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary dark:text-primary-soft">
            <Eye className="h-3.5 w-3.5" /> Live Preview
          </div>
          <div className="rounded-2xl border border-dashed border-line bg-surface/40 p-3 dark:border-line-dark dark:bg-white/[0.02]">
            <div className="pointer-events-none">
              <PlanCard plan={previewPlan} isCurrent={false} isPendingThis={false} hasOtherPending onRequest={() => {}} requesting={false} />
            </div>
          </div>
          <p className="px-1 text-xs text-muted dark:text-muted-dark">This is exactly what companies will see when choosing a plan.</p>
        </div>
      </div>
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

// Admin's management-oriented counterpart to the customer-facing
// PlanCard - deliberately its own component rather than PlanCard with
// extra props, since the two footers (Request This Plan vs. Edit/
// Activate/Delete) are different audiences with different actions,
// not a variant of the same one. Wraps PlanCard's exact card body
// (name/price/credits badge/limits/features) so an admin's plan list
// reads as the same visual product as what a company Owner is shown,
// just with management controls where the CTA would be.
function AdminPlanCard({ plan, onEditFeatures }) {
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = () => {
    setDeleteError('');
    deletePlan.mutate(plan.id, {
      onSuccess: () => setConfirmingDelete(false),
      onError: (err) => setDeleteError(err.message),
    });
  };

  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-soft dark:bg-card-dark ${plan.is_active ? 'border-line bg-card dark:border-line-dark' : 'border-line bg-surface/60 opacity-70 dark:border-line-dark dark:bg-white/[0.02]'}`}>
      {!plan.is_active && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-muted/15 px-2 py-0.5 text-[11px] font-semibold text-muted dark:bg-white/10 dark:text-muted-dark">Inactive</span>
      )}
      <div className="pointer-events-none flex-1 p-1">
        <PlanCard plan={plan} isCurrent={false} isPendingThis={false} hasOtherPending onRequest={() => {}} requesting={false} />
      </div>

      <div className="space-y-2 border-t border-line px-5 py-3.5 dark:border-line-dark">
        {confirmingDelete ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted dark:text-muted-dark">Delete this plan?</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete} disabled={deletePlan.isPending}
                className="text-xs font-semibold text-danger hover:underline disabled:opacity-60 dark:text-danger-dark"
              >
                {deletePlan.isPending ? 'Deleting…' : 'Confirm'}
              </button>
              <button onClick={() => { setConfirmingDelete(false); setDeleteError(''); }} className="text-xs font-medium text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => onEditFeatures(plan)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-ink dark:text-muted-dark dark:hover:bg-white/5 dark:hover:text-ink-dark">
              <Sliders className="h-3.5 w-3.5" /> Features
            </button>
            <button
              onClick={() => updatePlan.mutate({ planId: plan.id, is_active: !plan.is_active })}
              disabled={updatePlan.isPending}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${plan.is_active ? 'text-muted hover:bg-danger/10 hover:text-danger dark:text-muted-dark' : 'text-success hover:bg-success/10 dark:text-success-dark'}`}
            >
              {updatePlan.isPending && <Spinner size={12} />}
              {updatePlan.isPending ? (plan.is_active ? 'Deactivating…' : 'Reactivating…') : (plan.is_active ? 'Deactivate' : 'Reactivate')}
            </button>
            <button
              onClick={() => setConfirmingDelete(true)} title="Delete plan"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger dark:text-muted-dark dark:hover:text-danger-dark"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {deleteError && <p className="text-xs text-danger dark:text-danger-dark">{deleteError}</p>}
      </div>
    </div>
  );
}

function PlansPanel({ planType, plans, featureCatalog, onEditFeatures }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Company Plans</h2>
        <button onClick={() => setCreateOpen(true)} data-testid="open-create-plan-modal" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-dark">
          <Plus className="h-3.5 w-3.5" /> New Plan
        </button>
      </div>
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <AdminPlanCard key={plan.id} plan={plan} onEditFeatures={onEditFeatures} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
          <EmptyState icon={CreditCard} title="No plans yet" />
        </div>
      )}

      {createOpen && <CreatePlanModal planType={planType} featureCatalog={featureCatalog} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function PlanRequestRow({ pr }) {
  const action = usePlanRequestAction();
  const [note, setNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const who = pr.organization?.name;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink dark:text-ink-dark">
          {who} <span className="font-normal text-muted dark:text-muted-dark">→ {pr.requested_plan.name}</span>
        </p>
        <p className="text-xs text-muted dark:text-muted-dark">
          Requested by {pr.requested_by} · {new Date(pr.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
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
        <PlansPanel planType={tab} plans={plans} featureCatalog={featureCatalog} onEditFeatures={setEditFeaturesPlan} />
      )}

      {editFeaturesPlan && (
        <EditFeaturesModal plan={editFeaturesPlan} featureCatalog={featureCatalog} onClose={() => setEditFeaturesPlan(null)} />
      )}
    </>
  );
}
