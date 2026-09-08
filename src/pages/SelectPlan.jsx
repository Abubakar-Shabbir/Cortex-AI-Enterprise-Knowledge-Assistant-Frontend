import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRightIcon as ArrowRight } from '@phosphor-icons/react';
import AppLoader from '../components/AppLoader';
import Logo from '../components/Logo';
import PlanCard from '../components/PlanCard';
import Spinner from '../components/Spinner';
import { useSession } from '../auth/SessionContext';
import { usePersonalBilling, useRequestPersonalPlan } from '../api/hooks';

// The one-time interstitial shown right after a fresh Personal
// Workspace signup finishes OTP verification (VerifyOtp.jsx), before
// landing on the Dashboard - the "pick a plan first" step common to
// most SaaS onboarding flows. Deliberately skippable (this app has no
// mandatory-plan concept - see billing_service.py: no Subscription
// row means "unrestricted" until/unless a plan is later requested and
// approved), so this is a navigational nudge, not an access gate:
// unlike ChangePasswordForced.jsx, nothing re-routes a user back here
// on a later visit, and the route works standalone if revisited
// (e.g. from a bookmark) since it only reads already-permission-
// checked endpoints. A Company signup never sees this - only Personal
// Workspace has a self-service Plan at all (see personal_billing_views.py).
export default function SelectPlan() {
  const navigate = useNavigate();
  const { loading, authenticated, accountType } = useSession();
  const { data, isLoading } = usePersonalBilling();
  const requestPlan = useRequestPersonalPlan();
  const [requestError, setRequestError] = useState('');
  const [justRequestedName, setJustRequestedName] = useState('');

  useEffect(() => {
    document.title = 'Choose a plan · Cortex';
  }, []);

  if (loading) return <AppLoader variant="fullscreen" />;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (accountType !== 'personal') return <Navigate to="/" replace />;

  const availablePlans = data?.available_plans || [];

  const onSkip = () => navigate('/', { replace: true });

  const onRequestPlan = (planId) => {
    setRequestError('');
    const plan = availablePlans.find((p) => p.id === planId);
    requestPlan.mutate(planId, {
      onSuccess: () => setJustRequestedName(plan?.name || ''),
      onError: (err) => setRequestError(err.message),
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface dark:bg-surface-dark">
      <div className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2.5 text-primary dark:text-primary-soft">
          <Logo size="h-8 w-8" />
          <span className="text-sm font-semibold text-ink dark:text-ink-dark">Cortex</span>
        </div>
        <button
          type="button" onClick={onSkip}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
        >
          Skip for now <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16 sm:px-10">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-ink-dark sm:text-3xl">Choose a plan to get started</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted dark:text-muted-dark">
            Pick a plan for your personal workspace, or skip for now — you'll have unrestricted access either way until you request one, and can always change this later from Billing.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : justRequestedName ? (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-soft dark:border-line-dark dark:bg-card-dark">
            <h2 className="text-base font-semibold text-ink dark:text-ink-dark">Plan requested</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted dark:text-muted-dark">
              You requested the <span className="font-medium text-ink dark:text-ink-dark">{justRequestedName}</span> plan — a Platform Admin will review and activate it. You can continue in the meantime.
            </p>
            <button
              type="button" onClick={onSkip}
              className="btn-sheen mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-softer transition-all duration-150 hover:bg-primary-dark hover:shadow-glow active:scale-[0.98]"
            >
              Continue to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : availablePlans.length > 0 ? (
          <>
            {requestError && (
              <p className="mx-auto mb-4 max-w-lg rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-center text-sm text-danger dark:text-danger-dark">{requestError}</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availablePlans.map((plan) => (
                <PlanCard
                  key={plan.id} plan={plan}
                  isCurrent={false}
                  isPendingThis={false}
                  hasOtherPending={requestPlan.isPending}
                  onRequest={onRequestPlan}
                  requesting={requestPlan.isPending}
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <button
                type="button" onClick={onSkip}
                className="text-sm font-medium text-muted underline-offset-2 transition-colors hover:text-ink hover:underline dark:text-muted-dark dark:hover:text-ink-dark"
              >
                I'll decide later — take me to my Dashboard
              </button>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-soft dark:border-line-dark dark:bg-card-dark">
            <p className="text-sm text-muted dark:text-muted-dark">No plans are available to choose from right now.</p>
            <button
              type="button" onClick={onSkip}
              className="btn-sheen mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-softer transition-all duration-150 hover:bg-primary-dark hover:shadow-glow active:scale-[0.98]"
            >
              Continue to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
