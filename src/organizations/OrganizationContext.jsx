import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../auth/SessionContext';
import { useMyOrganizations } from '../api/hooks';
import { setActiveOrganizationSlug } from '../api/client';

const OrganizationContext = createContext(null);

// Deliberately a SEPARATE context from SessionContext, not merged into
// it - "who am I" (session) and "which company I'm currently acting
// in" have different lifetimes: session survives a workspace switch,
// this doesn't survive a logout.
//
// Personal vs Company is a one-time signup decision (see
// SessionContext's accountType, sourced from UserProfile.account_type)
// - this context is NOT a Personal<->Company switcher. A "personal"
// account never has organizations and activeOrganization is always
// null for it; a "company" account always has activeOrganization set
// to one of ITS OWN organizations (never null, never Personal) - the
// only thing this context lets a company account choose is WHICH of
// its own companies is active, for the (rare, multi-company) case of
// belonging to more than one. The persisted choice only picks among
// that account's real organizations, never toggles account type.
const STORAGE_KEY = 'cortex-active-company';

export function OrganizationProvider({ children }) {
  const queryClient = useQueryClient();
  const { authenticated, loading: sessionLoading, accountType } = useSession();
  const isCompanyAccount = authenticated && accountType === 'company';
  const { data, isLoading, refetch } = useMyOrganizations(isCompanyAccount);
  const [activeSlug, setActiveSlug] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const organizations = isCompanyAccount ? data?.organizations || [] : [];

  // A Company account's active org is never null: if the persisted
  // choice doesn't match any of this account's real organizations
  // (left over from a previous account, or that org was left/deleted),
  // fall back to the first one (alphabetical - same ordering the
  // backend's own default, org_permission_service.
  // resolve_request_organization(), uses when a request carries no
  // header at all) rather than ever landing on "no active company".
  useEffect(() => {
    if (!isCompanyAccount || isLoading || organizations.length === 0) return;

    if (!activeSlug || !organizations.some((o) => o.slug === activeSlug)) {
      const fallback = organizations[0].slug;
      setActiveSlug(fallback);
      try {
        localStorage.setItem(STORAGE_KEY, fallback);
      } catch {
        // ignore
      }
    }
  }, [isCompanyAccount, isLoading, organizations, activeSlug]);

  useEffect(() => {
    if (!authenticated && !sessionLoading) {
      setActiveSlug(null);
    }
  }, [authenticated, sessionLoading]);

  // Switches which of the account's OWN companies is active - never a
  // Personal Workspace option. Only meaningful for a Company account
  // that belongs to more than one organization.
  const switchWorkspace = useCallback((orgSlug) => {
    if (!orgSlug) return;
    setActiveSlug(orgSlug);
    try {
      localStorage.setItem(STORAGE_KEY, orgSlug);
    } catch {
      // Private-browsing/storage-disabled - the switch still works for this session, just doesn't survive a reload.
    }
  }, []);

  const activeOrganization = useMemo(
    () => (isCompanyAccount && activeSlug ? organizations.find((o) => o.slug === activeSlug) || null : null),
    [isCompanyAccount, activeSlug, organizations],
  );

  // Mirrored into api/client.js, not read from it - every fetch() call
  // needs this synchronously and client.js can't import a React hook,
  // so this effect is the one place the two are kept in sync.
  //
  // Also the one place a real workspace switch invalidates every
  // cached React Query result. None of the data hooks (useDocumentsList,
  // useAskContext, useAiTaskHistory, useReports, ...) key their cache
  // on the active organization - the workspace is carried out-of-band
  // as the X-Organization-Slug header, invisible to React Query's
  // cache. Without this, switching from one company to another would
  // keep serving the previous company's already-cached results until
  // each query happened to refetch on its own - the same "workspaces
  // must stay separate" guarantee this whole feature exists to
  // provide, silently violated in the UI even though the backend was
  // already scoping every request correctly. `undefined` (not yet
  // resolved) is excluded so the very first resolution on page load -
  // nothing has been fetched under the wrong workspace yet - doesn't
  // trigger a redundant blanket refetch.
  const previousWorkspaceKeyRef = useRef(undefined);
  useEffect(() => {
    const workspaceKey = activeOrganization?.slug || null;
    setActiveOrganizationSlug(workspaceKey);

    if (previousWorkspaceKeyRef.current !== undefined && previousWorkspaceKeyRef.current !== workspaceKey) {
      queryClient.invalidateQueries();
    }

    previousWorkspaceKeyRef.current = workspaceKey;
  }, [activeOrganization, queryClient]);

  const value = useMemo(() => ({
    organizations,
    activeOrganization,
    isCompanyAccount,
    loading: isCompanyAccount ? isLoading : false,
    refresh: refetch,
    switchWorkspace,
  }), [organizations, activeOrganization, isCompanyAccount, isLoading, refetch, switchWorkspace]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used inside OrganizationProvider');
  return ctx;
}
