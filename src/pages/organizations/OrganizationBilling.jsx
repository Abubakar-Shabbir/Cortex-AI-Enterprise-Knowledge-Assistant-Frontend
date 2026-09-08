import { CreditCardIcon as CreditCard, SparkleIcon as Sparkle } from '@phosphor-icons/react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import AiCreditsCard from '../../components/billing/AiCreditsCard';
import UsageBar from '../../components/billing/UsageBar';
import { formatBytes } from '../../lib/formatBytes';
import PageHeader from '../../components/PageHeader';
import PageSkeleton from '../../components/PageSkeleton';
import PlanCard from '../../components/PlanCard';
import OrgTabs from '../../layout/OrgTabs';
import { useAddAiCredits, useOrganizationAiCredits, useOrganizationBilling, useRequestPlan } from '../../api/hooks';

export default function OrganizationBilling() {
  const { orgSlug } = useParams();
  const { data, isLoading } = useOrganizationBilling(orgSlug);
  const { data: credits, isLoading: creditsLoading } = useOrganizationAiCredits(orgSlug);
  const addCredits = useAddAiCredits(orgSlug);
  const requestPlan = useRequestPlan(orgSlug);
  const [requestError, setRequestError] = useState('');

  if (isLoading || !data) return <PageSkeleton variant="list" />;

  const availablePlans = data.available_plans || [];
  const pendingRequest = data.pending_request;

  const onRequestPlan = (planId) => {
    setRequestError('');
    requestPlan.mutate(planId, { onError: (err) => setRequestError(err.message) });
  };

  return (
    <>
      <OrgTabs orgSlug={orgSlug} />
      <PageHeader title="Billing & Plan" subtitle="Your company's plan, usage, and AI credits balance." />

      <div className="mb-4 overflow-hidden rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        {data.unlimited ? (
          <div className="flex items-start gap-4 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-soft">
              <Sparkle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink dark:text-ink-dark">No plan assigned</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted dark:text-muted-dark">This organization currently has no usage limits. Choose a plan below, or ask a platform administrator to assign one.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface/60 px-6 py-4 dark:border-line-dark dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-soft">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-ink dark:text-ink-dark">{data.plan.name}</h2>
                  <p className="text-xs text-muted dark:text-muted-dark">Current period ends {new Date(data.period_end).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums leading-none text-ink dark:text-ink-dark">{data.plan.price ? `${data.plan.currency} ${Number(data.plan.price).toLocaleString()}` : 'Free'}</p>
                {data.plan.price ? <p className="mt-1 text-xs text-muted dark:text-muted-dark">/ {data.plan.billing_interval === 'yearly' ? 'year' : 'month'}</p> : null}
              </div>
            </div>
            <div className="space-y-4 p-6">
              <UsageBar label="AI queries this month" used={data.queries_used} max={data.plan.max_queries_per_month} />
              <UsageBar label="AI Task runs this month" used={data.ai_task_runs_used} max={data.plan.max_ai_task_runs_per_month} />
              <UsageBar label="Seats" used={data.seats_used} max={data.plan.max_seats} />
              <UsageBar label="Storage used" used={data.storage_used_bytes} max={data.plan.max_storage_bytes} formatter={formatBytes} />
            </div>
          </>
        )}
      </div>

      {availablePlans.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-semibold text-ink dark:text-ink-dark">Available Plans</h3>
          <p className="mb-3 text-xs text-muted dark:text-muted-dark">
            {pendingRequest ? `Requested "${pendingRequest.requested_plan.name}" — awaiting Platform Admin approval.` : 'Request a plan to upgrade or downgrade — a Platform Admin reviews and activates it.'}
          </p>
          {requestError && <p className="mb-3 rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{requestError}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <PlanCard
                key={plan.id} plan={plan}
                isCurrent={!data.unlimited && data.plan.id === plan.id}
                isPendingThis={pendingRequest?.requested_plan.id === plan.id}
                hasOtherPending={!!pendingRequest}
                onRequest={onRequestPlan}
                requesting={requestPlan.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {!data.unlimited && data.plan.allow_credit_purchase && (
        <AiCreditsCard
          balance={credits?.balance}
          transactions={credits?.transactions}
          isLoading={creditsLoading}
          onAdd={(amount) => addCredits.mutateAsync(amount)}
        />
      )}
    </>
  );
}
