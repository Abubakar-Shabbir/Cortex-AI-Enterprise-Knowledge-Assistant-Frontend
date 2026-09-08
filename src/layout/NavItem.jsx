import { Link, useLocation } from 'react-router-dom';
import { useSidebarCollapse } from './SidebarCollapseContext';

// Port of templates/dashboard/_nav_item.html. `to` is an internal SPA
// route (React Router Link, no full page reload); `href` is used
// instead for a page this migration hasn't ported yet, so it still
// navigates (full reload) straight to the working classic Django page
// rather than a dead link or a fake placeholder.
//
// Reads the sidebar collapse state directly (no prop threading) so
// PersonalNav/CompanyNav/SuperAdminNav need zero changes to support
// collapsing - every nav tree is built entirely out of these.
export default function NavItem({ to, href, icon: Icon, label, activeMatch }) {
  const location = useLocation();
  const { collapsed } = useSidebarCollapse();
  const isActive = to ? (activeMatch ? location.pathname.startsWith(activeMatch) : location.pathname === to) : false;

  const className = `flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-all duration-150 ease-out ${
    isActive
      ? 'bg-white/[0.08] text-white shadow-[inset_2.5px_0_0_0_#FF6B85]'
      : 'text-muted-dark hover:bg-white/[0.05] hover:text-white'
  } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`;
  const iconClassName = `h-4 w-4 shrink-0 ${isActive ? 'text-primary-soft' : ''}`;
  const labelClassName = collapsed ? 'lg:hidden' : '';

  if (to) {
    return (
      <Link to={to} className={className} title={collapsed ? label : undefined}>
        <Icon className={iconClassName} /> <span className={labelClassName}>{label}</span>
      </Link>
    );
  }

  return (
    <a href={href} className={className} title={collapsed ? label : undefined}>
      <Icon className={iconClassName} /> <span className={labelClassName}>{label}</span>
    </a>
  );
}
