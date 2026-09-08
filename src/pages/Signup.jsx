import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { WarningCircleIcon as AlertCircle, AtIcon as AtSign, BuildingsIcon as Buildings, CheckIcon as Check, CheckCircleIcon as CheckCircle2, CircleIcon as Circle, EyeIcon as Eye, EyeSlashIcon as EyeOff, LockIcon as Lock, EnvelopeSimpleIcon as Mail, UserCircleIcon as UserRound } from '@phosphor-icons/react';
import AuthLayout from '../layout/AuthLayout';
import Spinner from '../components/Spinner';
import { useOrganizationTypes, useSignup } from '../api/hooks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const inputClass = (hasError) =>
  `w-full rounded-lg border ${hasError ? 'border-danger' : 'border-line dark:border-line-dark'} bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-muted transition-all duration-150 focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark`;

// Port of templates/signup.html — Alpine's x-data (password strength
// meter, email-valid check, passwords-match check, show/hide toggles)
// reimplemented as React state; server-side validation contract
// unchanged (SignupForm via /api/auth/signup/).
export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const signup = useSignup();
  const { data: orgTypesData } = useOrganizationTypes();

  // An invitation redirected here (InvitationAccept.jsx's "Sign Up"
  // link sets state.from to the /invitations/accept?token=... URL) -
  // that invitation, not this signup, determines the account's
  // organization: the backend leaves a fresh invitation-flow account
  // without one until org_invitation_service.accept_invitation() runs
  // right after, so `accountType` stays null here and no `account_type`/
  // company fields are sent at all (see onSubmit below). Every other
  // signup always creates a Company - there is no other account type
  // to choose anymore.
  const isInvitationFlow = !!location.state?.from?.startsWith('/invitations/accept');
  const accountType = isInvitationFlow ? null : 'company';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(searchParams.get('invited_email') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [nonFieldError, setNonFieldError] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyOrgType, setCompanyOrgType] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password);
  const hasLongLength = password.length >= 12;
  const strengthScore = password ? [hasMinLength, hasLetter, hasNumberOrSymbol, hasLongLength].filter(Boolean).length : 0;
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor = ['bg-line dark:bg-line-dark', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-success'][strengthScore];
  const emailValid = email.length > 0 && EMAIL_RE.test(email);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const strengthLabelClass = useMemo(() => {
    if (strengthScore <= 1) return 'text-danger dark:text-danger-dark';
    if (strengthScore === 2 || strengthScore === 3) return 'text-warning dark:text-warning-dark';
    return 'text-success dark:text-success-dark';
  }, [strengthScore]);

  const orgTypes = orgTypesData?.organization_types || [];

  const onSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setNonFieldError('');

    const payload = { full_name: fullName, email, username, password, confirm_password: confirmPassword };
    if (!isInvitationFlow) payload.account_type = accountType;
    if (accountType === 'company') {
      Object.assign(payload, {
        company_name: companyName,
        company_org_type: companyOrgType,
        company_industry: companyIndustry,
        company_size: companySize,
        company_website: companyWebsite,
        company_description: companyDescription,
      });
    }

    try {
      await signup.mutateAsync(payload);
      navigate('/verify-otp', { state: { from: location.state?.from } });
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

  const errClass = (field) => (fieldErrors[field] ? 'border-danger' : 'border-line dark:border-line-dark');

  return (
    <AuthLayout title="Sign up">
      <div className="auth-pop-in mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-soft">
        {accountType === 'company' ? <Buildings className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
      </div>
      <h1 className="auth-pop-in text-xl font-bold tracking-tight text-ink dark:text-ink-dark">
        {accountType === 'company' ? 'Register your company' : 'Create your account'}
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted dark:text-muted-dark">
        {isInvitationFlow ? "You've been invited to join an organization — finish creating your account below." : 'Fill in your details below to get started.'}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {nonFieldError && (
          <div role="alert" aria-live="polite" className="auth-error-banner flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-3 text-sm text-danger dark:text-danger-dark">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {nonFieldError}
          </div>
        )}

        <div className="group">
          <label htmlFor="full_name" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">Full name</label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft" />
            <input
              id="full_name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name" required autoFocus autoComplete="name"
              aria-invalid={!!fieldErrors.full_name}
              className={inputClass(fieldErrors.full_name)}
            />
          </div>
          {fieldErrors.full_name && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.full_name[0]}</p>}
        </div>

        <div className="group">
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft" />
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" required autoComplete="email"
              aria-invalid={!!fieldErrors.email}
              className={`${inputClass(fieldErrors.email)} pr-9`}
            />
            {emailValid && <CheckCircle2 className="field-valid-icon pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-success dark:text-success-dark" />}
          </div>
          {fieldErrors.email && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.email[0]}</p>}
        </div>

        <div className="group">
          <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">Username</label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft" />
            <input
              id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username" required autoComplete="username"
              aria-invalid={!!fieldErrors.username}
              className={inputClass(fieldErrors.username)}
            />
          </div>
          {fieldErrors.username && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.username[0]}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="group">
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft" />
              <input
                type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password" required autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
                className={`${inputClass(fieldErrors.password)} pr-9`}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.password[0]}</p>}
          </div>
          <div className="group">
            <label htmlFor="confirm_password" className="mb-1.5 block text-xs font-medium text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft">Confirm</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-150 group-focus-within:text-primary dark:text-muted-dark dark:group-focus-within:text-primary-soft" />
              <input
                type={showConfirm ? 'text' : 'password'} id="confirm_password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password" required autoComplete="new-password"
                aria-invalid={!!fieldErrors.confirm_password}
                className={`w-full rounded-lg border ${fieldErrors.confirm_password || passwordsMismatch ? 'border-danger' : 'border-line dark:border-line-dark'} bg-surface py-2.5 pl-10 pr-9 text-sm text-ink placeholder:text-muted transition-all duration-150 focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark`}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirm_password ? (
              <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.confirm_password[0]}</p>
            ) : (
              <p className={`mt-1 flex items-center gap-1 text-xs transition-opacity duration-200 ${passwordsMatch ? 'text-success dark:text-success-dark opacity-100' : 'opacity-0'}`}>
                <Check className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>
        </div>

        {password.length > 0 && (
          <div id="password-hints" className="space-y-2.5 rounded-lg bg-surface px-3 py-3 dark:bg-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted dark:text-muted-dark">Password strength</span>
              <span className={`font-semibold ${strengthLabelClass}`}>{strengthLabel}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= strengthScore ? strengthColor : 'bg-line dark:bg-line-dark'}`}></div>
              ))}
            </div>
            <div className="space-y-1 pt-0.5 text-xs">
              <p className={`flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-success dark:text-success-dark' : 'text-muted dark:text-muted-dark'}`}>
                {hasMinLength ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />} At least 8 characters
              </p>
              <p className={`flex items-center gap-1.5 transition-colors ${hasLetter ? 'text-success dark:text-success-dark' : 'text-muted dark:text-muted-dark'}`}>
                {hasLetter ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />} Contains a letter
              </p>
              <p className={`flex items-center gap-1.5 transition-colors ${hasNumberOrSymbol ? 'text-success dark:text-success-dark' : 'text-muted dark:text-muted-dark'}`}>
                {hasNumberOrSymbol ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />} Contains a number or symbol
              </p>
            </div>
          </div>
        )}

        {accountType === 'company' && !isInvitationFlow && (
          <div className="space-y-4 rounded-xl border border-line bg-surface p-4 dark:border-line-dark dark:bg-white/5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">
              <Buildings className="h-3.5 w-3.5" /> Company details
            </p>

            <div className="group">
              <label htmlFor="company_name" className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Company name</label>
              <input
                id="company_name" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc"
                aria-invalid={!!fieldErrors.company_name}
                className={`w-full rounded-lg border ${errClass('company_name')} bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:bg-card-dark dark:text-ink-dark dark:placeholder:text-muted-dark`}
              />
              {fieldErrors.company_name && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.company_name[0]}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="company_org_type" className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Organization type</label>
                <select
                  id="company_org_type" required value={companyOrgType} onChange={(e) => setCompanyOrgType(e.target.value)}
                  className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-card-dark dark:text-ink-dark"
                >
                  <option value="">Select…</option>
                  {orgTypes.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                </select>
                {fieldErrors.company_org_type && <p className="mt-1 text-xs text-danger dark:text-danger-dark">{fieldErrors.company_org_type[0]}</p>}
              </div>
              <div>
                <label htmlFor="company_size" className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Company size</label>
                <select
                  id="company_size" value={companySize} onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-card-dark dark:text-ink-dark"
                >
                  <option value="">Prefer not to say</option>
                  {COMPANY_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="company_industry" className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Industry (optional)</label>
                <input
                  id="company_industry" value={companyIndustry} onChange={(e) => setCompanyIndustry(e.target.value)} placeholder="Software"
                  className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
              <div>
                <label htmlFor="company_website" className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Website (optional)</label>
                <input
                  id="company_website" type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://…"
                  className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:placeholder:text-muted-dark"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company_description" className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Description (optional)</label>
              <textarea
                id="company_description" rows={2} value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} placeholder="What does your company do?"
                className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:placeholder:text-muted-dark"
              />
            </div>
          </div>
        )}

        <button
          type="submit" disabled={signup.isPending}
          className="btn-sheen flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-softer transition-all duration-150 hover:bg-primary-dark hover:shadow-glow active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {signup.isPending && <Spinner size={20} />}
          <span>{signup.isPending ? 'Creating account…' : 'Sign up'}</span>
        </button>

        <p className="text-center text-sm text-muted dark:text-muted-dark">
          Already have an account? <Link to="/login" className="font-semibold text-primary transition-colors hover:underline dark:text-primary-soft">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
