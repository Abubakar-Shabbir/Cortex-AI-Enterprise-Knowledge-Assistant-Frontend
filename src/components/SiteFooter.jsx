import { Link } from 'react-router-dom';
import { ShieldCheckIcon as ShieldCheck, UsersThreeIcon as UsersThree } from '@phosphor-icons/react';
import Logo from './Logo';

// Shared public-site footer (Landing + Guide) - see SiteHeader.jsx's
// docstring for why these two pages share chrome instead of each
// rolling their own.
export default function SiteFooter() {
  return (
    <footer className="border-t border-line dark:border-line-dark">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 text-primary dark:text-primary-soft">
              <Logo size="h-8 w-8" />
              <span className="text-base font-bold tracking-tight text-ink dark:text-ink-dark">Cortex</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted dark:text-muted-dark">Answers grounded in your own documents.</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">Product</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li><Link to="/#features" className="text-ink hover:text-primary dark:text-ink-dark dark:hover:text-primary-soft">Features</Link></li>
              <li><Link to="/guide" className="text-ink hover:text-primary dark:text-ink-dark dark:hover:text-primary-soft">Usage guide</Link></li>
              <li><Link to="/#security" className="text-ink hover:text-primary dark:text-ink-dark dark:hover:text-primary-soft">Security</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">Account</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li><Link to="/login" className="text-ink hover:text-primary dark:text-ink-dark dark:hover:text-primary-soft">Log in</Link></li>
              <li><Link to="/signup" className="text-ink hover:text-primary dark:text-ink-dark dark:hover:text-primary-soft">Sign up</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">Trust</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink dark:text-ink-dark">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success dark:text-success-dark" /> Encrypted end-to-end</li>
              <li className="flex items-center gap-1.5"><UsersThree className="h-3.5 w-3.5 text-success dark:text-success-dark" /> Org-based isolation</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row dark:border-line-dark dark:text-muted-dark">
          <p>&copy; {new Date().getFullYear()} Cortex &middot; Enterprise Edition</p>
          <p>Founded &amp; built by <span className="font-semibold text-ink dark:text-ink-dark">Abu Bakar Shabbir</span></p>
        </div>
      </div>
    </footer>
  );
}
