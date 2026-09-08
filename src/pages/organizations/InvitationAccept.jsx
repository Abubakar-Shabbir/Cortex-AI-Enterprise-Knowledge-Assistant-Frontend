import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BuildingsIcon as Buildings, CheckCircleIcon as CheckCircle, WarningCircleIcon as AlertCircle } from '@phosphor-icons/react';
import Logo from '../../components/Logo';
import Spinner from '../../components/Spinner';
import { useAcceptInvitation } from '../../api/hooks';
import { useSession } from '../../auth/SessionContext';
import { useOrganization } from '../../organizations/OrganizationContext';

// Reachable whether or not the visitor is logged in - an invitation
// link is often someone's very first touch with the product. A
// logged-out visitor is sent to /login OR /signup with `state.from`
// set to this exact URL (token included), the same redirect-back
// mechanism ProtectedLayout already uses for any protected route -
// Login.jsx's existing `navigate(location.state?.from || '/', ...)`
// handles the existing-user path with no changes needed there. The
// brand-new-visitor path (Signup -> OTP -> login) threads that same
// `from` value through both hops (Signup.jsx passes it into
// /verify-otp's own location.state; VerifyOtp.jsx reads it back out
// on success) so a first-time signup also lands back here to
// complete acceptance, instead of on the normal dashboard.
export default function InvitationAccept() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticated, loading: sessionLoading, refresh: refreshSession } = useSession();
  const { switchWorkspace } = useOrganization();
  const accept = useAcceptInvitation();
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (authenticated && token && !attempted) {
      setAttempted(true);
      // Accepting can flip this account from Personal to Company (see
      // org_invitation_service.accept_invitation()) - SessionContext's
      // accountType lives in plain useState, not React Query's cache,
      // so it never updates on its own; refreshing it here is what
      // makes the sidebar's Company workspace switcher appear
      // immediately, without waiting for a page reload or re-login.
      accept.mutate(token, { onSuccess: () => refreshSession() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, token, attempted]);

  if (!token) {
    return (
      <Centered>
        <AlertCircle className="h-8 w-8 text-danger dark:text-danger-dark" />
        <p className="mt-3 text-sm font-medium text-ink dark:text-ink-dark">This invitation link is missing its token.</p>
      </Centered>
    );
  }

  if (sessionLoading) {
    return <Centered><Spinner size={28} /></Centered>;
  }

  if (!authenticated) {
    const from = `${location.pathname}${location.search}`;
    return (
      <Centered>
        <Buildings className="h-8 w-8 text-primary dark:text-primary-soft" />
        <p className="mt-3 text-sm font-medium text-ink dark:text-ink-dark">You've been invited to join an organization</p>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">Log in or create an account to accept the invitation.</p>
        <div className="mt-5 flex items-center gap-3">
          <Link to="/login" state={{ from }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">Log In</Link>
          <Link to="/signup" state={{ from }} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5">Sign Up</Link>
        </div>
      </Centered>
    );
  }

  if (accept.isPending || (!accept.isSuccess && !accept.isError)) {
    return <Centered><Spinner size={28} /><p className="mt-3 text-sm text-muted dark:text-muted-dark">Accepting invitation…</p></Centered>;
  }

  if (accept.isError) {
    return (
      <Centered>
        <AlertCircle className="h-8 w-8 text-danger dark:text-danger-dark" />
        <p className="mt-3 text-sm font-medium text-ink dark:text-ink-dark">Couldn't accept this invitation</p>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">{accept.error?.message}</p>
        <Link to="/" className="mt-5 text-sm font-medium text-primary hover:underline dark:text-primary-soft">Go to Dashboard</Link>
      </Centered>
    );
  }

  const organization = accept.data;
  return (
    <Centered>
      <CheckCircle className="h-8 w-8 text-success dark:text-success-dark" />
      <p className="mt-3 text-sm font-medium text-ink dark:text-ink-dark">You've joined {organization.name}</p>
      <p className="mt-1 text-sm text-muted dark:text-muted-dark">Your role: <span className="capitalize">{organization.my_role?.replace('org_', '')}</span></p>
      <button
        onClick={() => { switchWorkspace(organization.slug); navigate(`/organizations/${organization.slug}`); }}
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Go to {organization.name}
      </button>
    </Centered>
  );
}

function Centered({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center dark:bg-surface-dark">
      <span className="text-primary dark:text-primary-soft"><Logo size="h-9 w-9" /></span>
      <div className="mt-6 flex max-w-sm flex-col items-center rounded-2xl border border-line bg-card p-8 shadow-soft dark:border-line-dark dark:bg-card-dark">
        {children}
      </div>
    </div>
  );
}
