import { CheckIcon as Check, CoinIcon as Coin, ClockIcon as Clock } from '@phosphor-icons/react';
import { formatBytes } from '../lib/formatBytes';
import Spinner from './Spinner';

const FEATURE_LABELS = {
  documents: 'Documents',
  knowledge_base: 'Knowledge Base',
  ask_ai: 'Ask AI',
  ai_tasks: 'AI Tasks',
  analytics: 'Analytics',
  reports: 'Reports',
};

function limitLine(label, value, formatter = (v) => v.toLocaleString()) {
  return `${label}: ${value === null || value === undefined ? 'Unlimited' : formatter(value)}`;
}

// Shared between OrganizationBilling.jsx (Company plans) and
// PersonalBilling.jsx (Personal plans) - same card shape either way,
// since Plan itself is one model with a plan_type discriminator (see
// Backend/RAG/models.py's Plan docstring) rather than two parallel
// shapes to render differently.
export default function PlanCard({ plan, isCurrent, isPendingThis, hasOtherPending, onRequest, requesting }) {
  const limits = [
    limitLine('AI queries/mo', plan.max_queries_per_month),
    limitLine('AI Task runs/mo', plan.max_ai_task_runs_per_month),
    limitLine('Storage', plan.max_storage_bytes, formatBytes),
    plan.plan_type === 'company' ? limitLine('Seats', plan.max_seats) : null,
  ].filter(Boolean);

  const featureList = plan.included_features?.length
    ? plan.included_features.map((code) => FEATURE_LABELS[code] || code)
    : null;

  return (
    <div
      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-5 shadow-soft transition-all duration-150 hover:-translate-y-0.5 dark:bg-card-dark ${
        isCurrent ? 'border-primary/50 bg-primary/[0.03] dark:border-primary-soft/40' : 'border-line bg-card hover:border-primary/30 dark:border-line-dark dark:hover:border-primary-soft/30'
      }`}
    >
      {isCurrent && <span className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />}

      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink dark:text-ink-dark">{plan.name}</h3>
          {plan.description && <p className="mt-0.5 text-xs leading-relaxed text-muted dark:text-muted-dark">{plan.description}</p>}
        </div>
        {isCurrent && (
          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">Current</span>
        )}
      </div>

      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums leading-none tracking-tight text-ink dark:text-ink-dark">
          {plan.price ? `${plan.currency} ${Number(plan.price).toLocaleString()}` : 'Free'}
        </span>
        {plan.price ? <span className="text-sm text-muted dark:text-muted-dark">/ {plan.billing_interval === 'yearly' ? 'year' : 'month'}</span> : null}
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning dark:text-warning-dark">
        <Coin className="h-3.5 w-3.5 shrink-0" weight="fill" />
        {plan.included_credits.toLocaleString()} AI credits / {plan.billing_interval === 'yearly' ? 'year' : 'month'}
        {plan.allow_credit_purchase ? '' : ' (no extra purchases)'}
      </div>

      <ul className="mb-4 flex-1 space-y-2 text-xs text-ink dark:text-ink-dark">
        {limits.map((line) => (
          <li key={line} className="flex items-center gap-2 text-muted dark:text-muted-dark">
            <span className="h-1 w-1 shrink-0 rounded-full bg-muted/60 dark:bg-muted-dark/60" /> {line}
          </li>
        ))}
        {featureList ? (
          featureList.map((label) => (
            <li key={label} className="flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success dark:text-success-dark">
                <Check className="h-2.5 w-2.5" weight="bold" />
              </span>
              {label}
            </li>
          ))
        ) : (
          <li className="flex items-center gap-2">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success dark:text-success-dark">
              <Check className="h-2.5 w-2.5" weight="bold" />
            </span>
            All features included
          </li>
        )}
      </ul>

      {isCurrent ? (
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-semibold text-primary dark:text-primary-soft">Your active plan</div>
      ) : isPendingThis ? (
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-center text-xs font-medium text-warning dark:text-warning-dark">
          <Clock className="h-3.5 w-3.5" /> Requested — awaiting approval
        </div>
      ) : (
        <button
          type="button" onClick={() => onRequest(plan.id)} disabled={requesting || hasOtherPending}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {requesting ? <Spinner size={16} /> : null} Request This Plan
        </button>
      )}
    </div>
  );
}
