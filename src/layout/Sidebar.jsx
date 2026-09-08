import { SignOutIcon as LogOut, UserCircleIcon as UserRound, CaretDownIcon as ChevronDown, CaretLineLeftIcon as CaretLineLeft, CaretLineRightIcon as CaretLineRight, SunIcon as Sun, MoonIcon as Moon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { useTheme } from '../hooks/useTheme';
import Logo from '../components/Logo';
import NavItem from './NavItem';
import PersonalNav from './PersonalNav';
import CompanyNav from './CompanyNav';
import SuperAdminNav from './SuperAdminNav';
import { useSidebarCollapse } from './SidebarCollapseContext';

// Portal -> nav-tree component. `portal` is backend-computed
// (session.portal - see RAG/api/auth_views.py's _resolve_portal()) and
// is the ONLY thing that decides which of the three trees renders -
// never accountType/canViewAdminArea checked independently here, so
// this can't drift out of sync with what the backend actually
// authorizes. Falls back to PersonalNav for a not-yet-loaded/unknown
// portal value rather than rendering nothing.
const PORTAL_NAV = {
  personal: PersonalNav,
  company: CompanyNav,
  platform_admin: SuperAdminNav,
};

const PORTAL_LABEL = {
  personal: 'Personal',
  company: 'Company Portal',
  platform_admin: 'Platform Admin',
};

// The shared sidebar shell (frame, brand header, profile/logout menu,
// dark-mode toggle) - every portal reuses this exact chrome; only the
// nav tree in between (PersonalNav/CompanyNav/SuperAdminNav) differs.
// Port of templates/dashboard/_sidebar.html, now split three ways -
// see AppShell.jsx for where `portal` comes from.
export default function Sidebar({ open, onClose }) {
  const { permissions, user, role, logout, portal } = useSession();
  const { isDark, toggle } = useTheme();
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapse();
  const [menuOpen, setMenuOpen] = useState(false);

  const has = (code) => permissions.includes(code);
  const NavTree = PORTAL_NAV[portal] || PersonalNav;
  const isPlatformAdmin = portal === 'platform_admin';

  const initials = `${(user?.first_name || user?.username || '?')[0] || ''}${(user?.last_name || '')[0] || ''}`.toUpperCase();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh flex-col text-ink-dark shadow-[1px_0_0_rgba(255,255,255,0.04)] transition-[transform,width] duration-200 lg:translate-x-0 ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } w-64 ${
          isPlatformAdmin ? 'bg-gradient-to-b from-[#241a2e] to-[#150f1c]' : 'bg-gradient-to-b from-sidebar to-sidebar-deep'
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Link to="/" className={`relative flex h-16 shrink-0 items-center gap-2.5 overflow-hidden border-b border-white/10 px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className={`pointer-events-none absolute -left-6 -top-10 h-28 w-28 rounded-full blur-2xl ${isPlatformAdmin ? 'bg-accent/25' : 'bg-primary/25'}`}></div>
          <div className={`relative shrink-0 ${isPlatformAdmin ? 'text-accent' : 'text-primary-soft'}`}><Logo size="h-8 w-8" /></div>
          <div className={`relative min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="truncate text-[15px] font-bold tracking-tight text-white">Cortex</div>
            <span className={`mt-0.5 inline-flex items-center rounded-full px-1.5 py-[1px] text-[9.5px] font-semibold uppercase leading-[14px] tracking-wide ${isPlatformAdmin ? 'bg-accent/20 text-accent' : 'bg-primary/15 text-primary-soft'}`}>
              {PORTAL_LABEL[portal] || 'Personal'}
            </span>
          </div>
        </Link>

        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4 text-sm">
          <NavTree has={has} />

          <div className="my-3 border-t border-white/10"></div>
          <NavItem to="/profile" icon={UserRound} label="Profile" />
        </nav>

        <button
          onClick={toggleCollapsed}
          className="hidden shrink-0 items-center justify-center gap-2 border-t border-white/10 py-2.5 text-xs font-medium text-muted-dark transition-colors duration-150 hover:bg-primary/15 hover:text-white lg:flex"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <CaretLineRight className="h-4 w-4" /> : <><CaretLineLeft className="h-4 w-4" /> Collapse</>}
        </button>

        <div className="border-t border-white/10 p-3">
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-primary/15 ${collapsed ? 'lg:justify-center' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white ring-2 ring-white/10">
                {initials || 'U'}
              </div>
              <div className={`min-w-0 flex-1 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
                <div className="truncate text-sm font-medium text-white">{user?.first_name || user?.username}</div>
                <div className="truncate text-xs text-muted-dark">{role || 'Member'}</div>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-dark transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''} ${collapsed ? 'lg:hidden' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-56 rounded-xl border border-white/10 bg-sidebar-soft p-1.5 shadow-soft">
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-dark transition-colors duration-150 hover:bg-primary/15">
                  <UserRound className="h-4 w-4 text-muted-dark" /> Profile
                </Link>
                <div className="my-1 border-t border-white/10"></div>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger-dark transition-colors duration-150 hover:bg-danger/10"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggle}
            className={`mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-dark transition-colors duration-150 hover:bg-primary/15 hover:text-white ${collapsed ? 'lg:justify-center' : 'justify-between'}`}
            title={collapsed ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
          >
            <span className="flex items-center gap-2.5">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className={collapsed ? 'lg:hidden' : ''}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </span>
            <span className={`relative h-5 w-9 rounded-full bg-white/10 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : ''}`}></span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
