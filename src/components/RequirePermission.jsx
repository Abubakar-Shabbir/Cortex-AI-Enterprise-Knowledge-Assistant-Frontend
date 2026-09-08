import { ShieldWarningIcon as ShieldAlert } from '@phosphor-icons/react';
import { Outlet } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import EmptyState from './EmptyState';

// Route-level permission gate, the page-rendering counterpart to
// Sidebar.jsx's has('<codename>') nav-visibility check - that only
// hides the link, it never stopped someone reaching the page directly
// by URL, so a page whose data all comes from a permission-gated API
// (e.g. AI Tasks) would otherwise render its full static UI before the
// first request ever 403s. Reads the same useSession().hasPermission()
// source of truth the sidebar does, so the two can't disagree.
export default function RequirePermission({ codename, anyOf }) {
  const { hasPermission } = useSession();

  // Most routes need exactly one codename; a few (e.g. System Logs,
  // gated on either system.view_ai_logs or activity.view_all_logs -
  // same OR the sidebar itself uses) need "holds at least one of
  // these" instead - `anyOf` covers that without forcing every caller
  // through an array for the common single-codename case.
  const allowed = anyOf ? anyOf.some((code) => hasPermission(code)) : hasPermission(codename);

  if (!allowed) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        message="Ask a workspace admin to grant this permission if you think you should have it."
        actionTo="/"
        actionLabel="Back to Dashboard"
      />
    );
  }

  return <Outlet />;
}
