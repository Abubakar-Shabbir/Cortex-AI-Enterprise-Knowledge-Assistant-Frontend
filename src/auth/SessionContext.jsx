import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getCsrfToken, setCsrfToken } from '../api/client';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState({ loading: true, authenticated: false, user: null, role: null, permissions: [], canViewAdminArea: false, accountType: null, portal: null, mustChangePassword: false });

  const refresh = useCallback(async () => {
    const data = await api.get('/auth/session/');
    setCsrfToken(data.csrf_token);
    if (data.authenticated) {
      setSession({
        loading: false,
        authenticated: true,
        user: data.user,
        role: data.role,
        permissions: data.permissions || [],
        canViewAdminArea: data.can_view_admin_area,
        // "personal" or "company" - decided once at signup, read-only
        // here (see UserProfile.account_type's help_text on the
        // backend). Drives whether the sidebar shows a Company
        // workspace switcher at all - never a Personal<->Company one.
        accountType: data.account_type || 'personal',
        // Backend-computed: "personal" | "company" | "platform_admin" -
        // the single source of truth for which portal layout renders
        // (see AppShell.jsx) - never derived independently client-side.
        portal: data.portal || 'personal',
        // True only for a company-registered member's system-generated
        // password (org_member_registration_service.py) - App.jsx's
        // ProtectedLayout redirects to /change-password and refuses
        // every other route until this clears, exactly like the
        // !authenticated -> /login redirect it already does.
        mustChangePassword: !!data.must_change_password,
      });
    } else {
      setSession({ loading: false, authenticated: false, user: null, role: null, permissions: [], canViewAdminArea: false, accountType: null, portal: null, mustChangePassword: false });
    }
    return data;
  }, []);

  useEffect(() => {
    refresh().catch(() => setSession((s) => ({ ...s, loading: false })));
  }, [refresh]);

  const login = useCallback(async (username, password, rememberMe) => {
    // Login is CSRF-protected; ensure we have a token from /api/auth/session/
    // before the first POST (e.g. if the user submits before bootstrap finishes).
    if (!getCsrfToken()) {
      try {
        await refresh();
      } catch {
        return { error: 'Unable to reach the server. Please try again.' };
      }
    }

    let data;
    try {
      data = await api.post('/auth/login/', { username, password, remember_me: rememberMe });
    } catch (err) {
      return { error: err.message };
    }

    if (data.csrf_token) setCsrfToken(data.csrf_token);

    if (data.pending_verification) {
      return { pendingVerification: true, redirect: data.redirect };
    }

    setSession({
      loading: false,
      authenticated: true,
      user: data.user,
      role: data.role,
      permissions: data.permissions || [],
      canViewAdminArea: data.can_view_admin_area,
      accountType: data.account_type || 'personal',
      portal: data.portal || 'personal',
      mustChangePassword: !!data.must_change_password,
    });
    return { ok: true };
  }, [refresh]);

  const logout = useCallback(async () => {
    const data = await api.post('/auth/logout/');
    setCsrfToken(data.csrf_token);
    setSession({ loading: false, authenticated: false, user: null, role: null, permissions: [], canViewAdminArea: false, accountType: null, portal: null, mustChangePassword: false });
  }, []);

  const hasPermission = useCallback(
    (codename) => session.permissions.includes(codename),
    [session.permissions],
  );

  return (
    <SessionContext.Provider value={{ ...session, login, logout, hasPermission, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
