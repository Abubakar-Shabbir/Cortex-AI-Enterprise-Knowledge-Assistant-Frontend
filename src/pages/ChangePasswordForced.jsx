import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LockIcon as Lock, ShieldCheckIcon as ShieldCheck } from '@phosphor-icons/react';
import AuthLayout from '../layout/AuthLayout';
import AppLoader from '../components/AppLoader';
import Spinner from '../components/Spinner';
import { useSession } from '../auth/SessionContext';
import { useChangePassword } from '../api/hooks';

// The mandatory stop between logging in and everything else for a
// company-registered member's system-generated password (see
// RAG/services/org_member_registration_service.py) - a top-level
// route (not nested under ProtectedLayout/AppShell - see App.jsx), so
// this page itself, not a shared layout, is what redirects a visitor
// who has no business here: logged out -> /login, logged in but
// already past this step -> /. ProtectedLayout routes here for as
// long as session.mustChangePassword is true, the same way it routes
// to /login for !authenticated. Reuses profile_password_view
// (useChangePassword) rather than a separate endpoint - it already
// clears UserProfile.must_change_password as a side effect of a
// successful change.
export default function ChangePasswordForced() {
  const { loading, authenticated, mustChangePassword, user, refresh } = useSession();
  const changePassword = useChangePassword();

  if (loading) {
    return <AppLoader variant="fullscreen" />;
  }
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!mustChangePassword) {
    return <Navigate to="/" replace />;
  }

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [nonFieldError, setNonFieldError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setNonFieldError('');

    try {
      await changePassword.mutateAsync({ old_password: oldPassword, new_password1: newPassword1, new_password2: newPassword2 });
      await refresh();
    } catch (err) {
      if (err.data?.errors) {
        const { __all__: nonField, ...rest } = err.data.errors;
        setFieldErrors(rest);
        if (nonField?.length) setNonFieldError(nonField[0]);
      } else {
        setNonFieldError(err.message);
      }
    }
  };

  return (
    <AuthLayout title="Set a new password">
      <div className="auth-pop-in mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-soft">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h1 className="auth-pop-in text-xl font-bold tracking-tight text-ink dark:text-ink-dark">Set your own password</h1>
      <p className="mb-6 mt-1 text-sm text-muted dark:text-muted-dark">
        {user ? `Welcome, ${user.first_name || user.username}. ` : ''}Your account was created with a temporary password. Choose your own before continuing.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {nonFieldError && (
          <div role="alert" aria-live="polite" className="auth-error-banner flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-3 text-sm text-danger dark:text-danger-dark">
            {nonFieldError}
          </div>
        )}

        <div className="group">
          <label htmlFor="old_password" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">Temporary password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted-dark" />
            <input
              id="old_password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              placeholder="The password from your email" required autoFocus autoComplete="current-password"
              aria-invalid={!!fieldErrors.old_password}
              className={`w-full rounded-lg border ${fieldErrors.old_password ? 'border-danger' : 'border-line dark:border-line-dark'} bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-muted transition-all duration-150 focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark`}
            />
          </div>
          {fieldErrors.old_password && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.old_password[0]}</p>}
        </div>

        <div className="group">
          <label htmlFor="new_password1" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">New password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted-dark" />
            <input
              id="new_password1" type="password" value={newPassword1} onChange={(e) => setNewPassword1(e.target.value)}
              placeholder="Choose a new password" required autoComplete="new-password"
              aria-invalid={!!fieldErrors.new_password1}
              className={`w-full rounded-lg border ${fieldErrors.new_password1 ? 'border-danger' : 'border-line dark:border-line-dark'} bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-muted transition-all duration-150 focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark`}
            />
          </div>
          {fieldErrors.new_password1 && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.new_password1[0]}</p>}
        </div>

        <div className="group">
          <label htmlFor="new_password2" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">Confirm new password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted dark:text-muted-dark" />
            <input
              id="new_password2" type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}
              placeholder="Re-enter the new password" required autoComplete="new-password"
              aria-invalid={!!fieldErrors.new_password2}
              className={`w-full rounded-lg border ${fieldErrors.new_password2 ? 'border-danger' : 'border-line dark:border-line-dark'} bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-muted transition-all duration-150 focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark`}
            />
          </div>
          {fieldErrors.new_password2 && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.new_password2[0]}</p>}
        </div>

        <button
          type="submit" disabled={changePassword.isPending}
          className="btn-sheen flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-softer transition-all duration-150 hover:bg-primary-dark hover:shadow-glow active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {changePassword.isPending && <Spinner size={20} />}
          <span>{changePassword.isPending ? 'Saving…' : 'Set password and continue'}</span>
        </button>
      </form>
    </AuthLayout>
  );
}
