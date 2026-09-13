import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListIcon as Menu, MoonIcon as Moon, SunIcon as Sun, XIcon as X } from '@phosphor-icons/react';
import Logo from './Logo';
import { useTheme } from '../hooks/useTheme';

const DEFAULT_NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/guide', label: 'Guide' },
  { to: '/#security', label: 'Security' },
];

// Shared public-site navbar (Landing + Guide) - a signed-out visitor
// should get the identical corner Log in/Sign up buttons and brand
// header wherever they land, rather than each page rolling its own.
// `navLinks` lets a page override the anchor list (Landing's own
// section ids resolve fine as plain <Link to="/#id">; from a
// different route like /guide, React Router navigates to "/" first -
// Landing.jsx scrolls to the hash itself once it mounts).
export default function SiteHeader({ navLinks = DEFAULT_NAV_LINKS }) {
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 ${scrolled ? 'border-b border-line bg-surface/80 backdrop-blur-md dark:border-line-dark dark:bg-surface-dark/80' : 'border-b border-transparent bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 text-primary dark:text-primary-soft">
          <Logo size="h-8 w-8" />
          <span className="text-base font-bold tracking-tight text-ink dark:text-ink-dark">Cortex</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button" onClick={toggle}
            data-tooltip={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            data-tooltip-align="end"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink dark:text-muted-dark dark:hover:bg-white/5 dark:hover:text-ink-dark"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5">
            Log in
          </Link>
          <Link to="/signup" className="btn-sheen rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
            Sign up
          </Link>
        </div>

        <button
          type="button" onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink md:hidden dark:text-ink-dark"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-line px-6 py-4 md:hidden dark:border-line-dark">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-ink dark:text-muted-dark dark:hover:bg-white/5 dark:hover:text-ink-dark">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 dark:border-line-dark">
            <Link to="/login" className="flex-1 rounded-lg border border-line px-4 py-2.5 text-center text-sm font-semibold text-ink dark:border-line-dark dark:text-ink-dark">
              Log in
            </Link>
            <Link to="/signup" className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white">
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
