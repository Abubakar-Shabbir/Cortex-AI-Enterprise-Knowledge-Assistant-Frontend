import { BuildingsIcon as Buildings, CaretDownIcon as ChevronDown, PlusIcon as Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrganization } from '../organizations/OrganizationContext';
import { useSidebarCollapse } from './SidebarCollapseContext';

// Company-to-company only - NEVER a Personal<->Company switcher.
// Personal vs Company is a one-time signup decision (see
// SessionContext's accountType / OrganizationContext's docstring), so
// this control only ever renders inside the Company portal's nav
// (CompanyNav.jsx) - a "company" account never sees "Personal
// Workspace" as an option here, only its own organizations, for the
// (rare) multi-company case.
export default function WorkspaceSwitcher() {
  const { organizations, activeOrganization, switchWorkspace } = useOrganization();
  const { collapsed } = useSidebarCollapse();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (organizations.length === 0) return null;

  const select = (orgSlug) => {
    switchWorkspace(orgSlug);
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="relative px-3 pb-1 pt-3">
      <button
        type="button" onClick={() => setOpen((v) => !v)} data-testid="workspace-switcher-trigger"
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2.5 text-left transition-colors duration-150 hover:border-white/15 hover:bg-white/[0.08]"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary-soft ring-1 ring-white/5">
          <Buildings className="h-4 w-4" weight="fill" />
        </div>
        <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
          <div className="truncate text-[13px] font-semibold leading-tight text-white">{activeOrganization?.name || '…'}</div>
          {activeOrganization?.my_role && (
            <span className="mt-1 inline-flex items-center rounded-full bg-primary/15 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase leading-[14px] tracking-wide text-primary-soft">
              {activeOrganization.my_role.replace('org_', '')}
            </span>
          )}
        </div>
        {organizations.length > 1 && (
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-dark transition-transform duration-150 ${open ? 'rotate-180' : ''} ${collapsed ? 'lg:hidden' : ''}`} />
        )}
      </button>

      {open && organizations.length > 1 && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)}></div>
          <div className="absolute left-3 right-3 z-30 mt-1.5 max-h-72 space-y-0.5 overflow-y-auto rounded-xl border border-white/10 bg-sidebar-soft p-1.5 shadow-soft">
            {organizations.map((org) => (
              <button
                key={org.slug} type="button" onClick={() => select(org.slug)} data-testid={`workspace-option-${org.slug}`}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-primary/15 ${activeOrganization?.slug === org.slug ? 'text-white' : 'text-muted-dark'}`}
              >
                <Buildings className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{org.name}</span>
              </button>
            ))}

            <div className="my-1 border-t border-white/10"></div>
            <Link
              to="/organizations" onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-dark transition-colors duration-150 hover:bg-primary/15"
            >
              <Plus className="h-4 w-4 shrink-0" /> Manage Companies
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
