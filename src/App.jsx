import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './auth/SessionContext';
import AppShell from './layout/AppShell';
import AppLoader from './components/AppLoader';
import RequirePermission from './components/RequirePermission';
import RequireOrgPermission from './components/RequireOrgPermission';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import PasswordResetSent from './pages/PasswordResetSent';
import PasswordResetConfirm from './pages/PasswordResetConfirm';
import PasswordResetComplete from './pages/PasswordResetComplete';
import InvitationAccept from './pages/organizations/InvitationAccept';
import ChangePasswordForced from './pages/ChangePasswordForced';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Documents = lazy(() => import('./pages/Documents'));
const AskAI = lazy(() => import('./pages/AskAI'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const KnowledgeBrowse = lazy(() => import('./pages/knowledge/Browse'));
const KnowledgeRelationships = lazy(() => import('./pages/knowledge/Relationships'));
const KnowledgeGraph = lazy(() => import('./pages/knowledge/Graph'));
const KnowledgeInsights = lazy(() => import('./pages/knowledge/Insights'));
const KnowledgeCitations = lazy(() => import('./pages/knowledge/Citations'));
const EntityDetail = lazy(() => import('./pages/knowledge/EntityDetail'));
const DocumentKnowledge = lazy(() => import('./pages/knowledge/DocumentKnowledge'));
const AiTasks = lazy(() => import('./pages/AiTasks'));
const AiTaskResults = lazy(() => import('./pages/AiTaskResults'));
const AiTaskHistory = lazy(() => import('./pages/AiTaskHistory'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const Favorites = lazy(() => import('./pages/Favorites'));
const SharedWithMe = lazy(() => import('./pages/SharedWithMe'));
const OrgLibrary = lazy(() => import('./pages/OrgLibrary'));
const Collections = lazy(() => import('./pages/Collections'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));
const SearchHistory = lazy(() => import('./pages/SearchHistory'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const AdminOrganizations = lazy(() => import('./pages/AdminOrganizations'));
const AdminSystemOverview = lazy(() => import('./pages/dashboard/AdminSystemOverview'));
const AdminBillingPlans = lazy(() => import('./pages/AdminBillingPlans'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminUserProfile = lazy(() => import('./pages/AdminUserProfile'));
const AdminRoles = lazy(() => import('./pages/AdminRoles'));
const AdminQueries = lazy(() => import('./pages/AdminQueries'));
const AdminSystemLogs = lazy(() => import('./pages/AdminSystemLogs'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const OrganizationsList = lazy(() => import('./pages/organizations/OrganizationsList'));
const OrganizationOverview = lazy(() => import('./pages/organizations/OrganizationOverview'));
const OrganizationMembers = lazy(() => import('./pages/organizations/OrganizationMembers'));
const OrganizationSettings = lazy(() => import('./pages/organizations/OrganizationSettings'));
const OrganizationAuditLog = lazy(() => import('./pages/organizations/OrganizationAuditLog'));
const OrganizationBilling = lazy(() => import('./pages/organizations/OrganizationBilling'));

function ProtectedLayout() {
  const { loading, authenticated, mustChangePassword } = useSession();
  const location = useLocation();

  if (loading) {
    return <AppLoader variant="fullscreen" />;
  }
  if (!authenticated) {
    // The root path is the public marketing site for signed-out
    // visitors (Landing.jsx) rather than a bounce straight to /login -
    // every other protected route still redirects to login as before.
    if (location.pathname === '/') {
      return <Landing />;
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // A company-registered member's system-generated password
  // (org_member_registration_service.py) must be changed before
  // anything else - same unconditional redirect shape as the
  // !authenticated -> /login case above, just one step further in.
  // /change-password itself is a top-level route outside this layout
  // (see App()) - a standalone AuthLayout page, not the full app
  // chrome with a sidebar full of links that would just bounce back
  // here anyway - so there's no path to exempt from this redirect.
  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/password-reset" element={<ForgotPassword />} />
      <Route path="/password-reset/sent" element={<PasswordResetSent />} />
      <Route path="/reset/done" element={<PasswordResetComplete />} />
      <Route path="/reset/:uidb64/:token" element={<PasswordResetConfirm />} />
      <Route path="/invitations/accept" element={<InvitationAccept />} />
      <Route path="/change-password" element={<ChangePasswordForced />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/ask" element={<AskAI />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/knowledge" element={<KnowledgeBrowse />} />
        <Route path="/knowledge/relationships" element={<KnowledgeRelationships />} />
        <Route path="/knowledge/graph" element={<KnowledgeGraph />} />
        <Route path="/knowledge/insights" element={<KnowledgeInsights />} />
        <Route path="/knowledge/citations" element={<KnowledgeCitations />} />
        <Route path="/knowledge/entities/:entityId" element={<EntityDetail />} />
        <Route path="/knowledge/documents/:docId" element={<DocumentKnowledge />} />
        <Route element={<RequirePermission codename="pages.ai_tasks" />}>
          <Route path="/ai-tasks" element={<AiTasks />} />
          <Route path="/ai-tasks/history" element={<AiTaskHistory />} />
          <Route path="/ai-tasks/:runId/results" element={<AiTaskResults />} />
        </Route>
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/documents/favorites" element={<Favorites />} />
        <Route path="/documents/shared-with-me" element={<SharedWithMe />} />
        <Route path="/documents/org-library" element={<OrgLibrary />} />
        <Route path="/documents/collections" element={<Collections />} />
        <Route path="/documents/collections/:collectionId" element={<CollectionDetail />} />
        <Route path="/history" element={<SearchHistory />} />
        <Route element={<RequirePermission codename="system.view_health" />}>
          <Route path="/admin/system-health" element={<Monitoring />} />
        </Route>
        <Route element={<RequirePermission codename="organizations.view_all" />}>
          <Route path="/admin/companies" element={<AdminOrganizations />} />
          <Route path="/admin/system-overview" element={<AdminSystemOverview />} />
        </Route>
        <Route element={<RequirePermission codename="users.view_all" />}>
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId/profile" element={<AdminUserProfile />} />
        </Route>
        <Route element={<RequirePermission codename="roles.manage" />}>
          <Route path="/admin/roles" element={<AdminRoles />} />
        </Route>
        <Route element={<RequirePermission codename="queries.view_all_logs" />}>
          <Route path="/admin/queries" element={<AdminQueries />} />
        </Route>
        <Route element={<RequirePermission anyOf={['system.view_ai_logs', 'activity.view_all_logs']} />}>
          <Route path="/admin/system-logs" element={<AdminSystemLogs />} />
        </Route>
        <Route element={<RequirePermission anyOf={['settings.manage_llm', 'settings.manage_chunking', 'settings.manage_retrieval', 'settings.manage_embedding', 'settings.manage_database']} />}>
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
        <Route path="/organizations" element={<OrganizationsList />} />
        <Route element={<RequireOrgPermission codename="organization.view" />}>
          <Route path="/organizations/:orgSlug" element={<OrganizationOverview />} />
        </Route>
        <Route element={<RequireOrgPermission codename="members.view" />}>
          <Route path="/organizations/:orgSlug/members" element={<OrganizationMembers />} />
        </Route>
        <Route element={<RequireOrgPermission codename="settings.view" />}>
          <Route path="/organizations/:orgSlug/settings" element={<OrganizationSettings />} />
        </Route>
        <Route element={<RequireOrgPermission codename="audit_logs.view" />}>
          <Route path="/organizations/:orgSlug/audit-logs" element={<OrganizationAuditLog />} />
        </Route>
        <Route element={<RequireOrgPermission codename="billing.view" />}>
          <Route path="/organizations/:orgSlug/billing" element={<OrganizationBilling />} />
        </Route>
        <Route element={<RequirePermission codename="billing.manage_plans" />}>
          <Route path="/admin/billing-plans" element={<AdminBillingPlans />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
