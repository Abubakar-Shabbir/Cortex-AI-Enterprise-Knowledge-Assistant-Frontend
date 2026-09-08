import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'cortex-sidebar-collapsed';
const SidebarCollapseContext = createContext(null);

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

// Context, not a bare hook (unlike useTheme.js's single-consumer
// document.documentElement pattern) - Sidebar, AppShell, and NavItem
// all need to react live to the same toggle, so the collapsed flag has
// to be shared state, not each component independently reading a DOM
// class on mount.
export function SidebarCollapseProvider({ children }) {
  const [collapsed, setCollapsed] = useState(readStored);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Best-effort persistence only - a private window or blocked
        // site data must not break the toggle itself, just its memory
        // across reloads.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);

  return <SidebarCollapseContext.Provider value={value}>{children}</SidebarCollapseContext.Provider>;
}

export function useSidebarCollapse() {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) throw new Error('useSidebarCollapse must be used inside SidebarCollapseProvider');
  return ctx;
}
