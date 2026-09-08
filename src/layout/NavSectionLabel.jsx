import { useSidebarCollapse } from './SidebarCollapseContext';

// Shared section-header label (Workspace / Insights / Administration /
// Company) used by PersonalNav/CompanyNav/SuperAdminNav - hides itself
// on a collapsed desktop sidebar instead of overflowing a ~76px rail.
export default function NavSectionLabel({ children }) {
  const { collapsed } = useSidebarCollapse();
  return (
    <div className={`mb-1.5 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-dark ${collapsed ? 'lg:hidden' : ''}`}>
      {children}
    </div>
  );
}
