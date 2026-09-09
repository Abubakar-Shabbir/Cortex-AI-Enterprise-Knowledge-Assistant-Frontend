import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiBaseUrl, getCsrfToken, setCsrfToken } from './client';

// Every mutation's `onSuccess` below that calls qc.invalidateQueries()
// does so from a BLOCK-bodied arrow function (`() => { ...; }`), never
// a bare expression (`() => qc.invalidateQueries(...)`) - TanStack
// Query v5 awaits whatever a mutation's onSuccess *returns* before
// settling the mutation (resolving mutateAsync()'s promise / firing
// the per-call onSuccess passed to .mutate()), and invalidateQueries()
// returns a promise that only resolves once every matching *active*
// query has refetched. An implicit-return arrow here would silently
// tie the mutation's own completion - and therefore the caller's
// "it worked, now navigate/close the dialog" logic - to however long
// some unrelated invalidated query takes to refetch in the background,
// found the hard way via Playwright's multi-tenancy suite: creating an
// organization appeared to hang for 6-12s because invalidating
// ['organizations'] re-triggered the (slow, unrelated) workspace-list
// query, and only its refetch completion unblocked the "org created"
// callback. A block body with no `return` sidesteps this entirely -
// invalidation still happens, just without holding up anything else.

// ── Dashboard ────────────────────────────────────────────────────────
export function useDashboard(range = 7) {
  return useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => api.get(`/dashboard/?range=${range}`),
  });
}

export function useAdminOverview(range = 7) {
  return useQuery({
    queryKey: ['dashboard', 'admin', range],
    queryFn: () => api.get(`/dashboard/admin/?range=${range}`),
  });
}

// Whole-platform overview (every organization + every Personal
// Workspace at once) - distinct from useAdminOverview above, which is
// scoped to whichever single workspace is active. Backs
// AdminSystemOverview.jsx.
export function useAdminSystemOverview() {
  return useQuery({ queryKey: ['admin', 'system-overview'], queryFn: () => api.get('/admin/system-overview/') });
}

// A document mutation (upload/delete/embed/bulk action/new version)
// changes exactly the numbers every Overview page's stat cards show
// (document/chunk counts, storage used) - but those pages are backed
// by entirely separate queries (['dashboard', ...], ['organizations',
// orgSlug, 'stats']) that invalidating ['documents'] alone never
// touches. Without this, Documents itself updates immediately while
// the Dashboard/Company Overview a user navigates to next still shows
// numbers from before the upload until that query's own staleTime
// happens to expire - the "stats are late" gap this closes. Matches
// every `predicate` invalidation already used with a `queryKey[n]`
// check (see useAddAiCredits below for the org-stats key shape).
function invalidateWorkspaceStats(qc) {
  qc.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'dashboard' ||
      (query.queryKey[0] === 'organizations' && query.queryKey[2] === 'stats'),
  });
}

// ── Documents ────────────────────────────────────────────────────────
// Documents list is keyed by its filter params, so switching filters
// (or navigating away and back with the same filters) reuses cached
// data instead of always refetching - staleTime keeps a just-fetched
// page from refetching again on quick re-navigation, while a
// processing-status poll (below) still invalidates it on its own.
export function useDocuments(params) {
  const search = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null)),
  ).toString();
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => api.get(`/documents/${search ? `?${search}` : ''}`),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useDocumentsMeta() {
  return useQuery({ queryKey: ['documents', 'meta'], queryFn: () => api.get('/documents/meta/'), staleTime: 60_000 });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.postForm('/documents/upload/', formData),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); invalidateWorkspaceStats(qc); },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); invalidateWorkspaceStats(qc); },
  });
}

export function useEmbedDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/documents/${id}/embed/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); invalidateWorkspaceStats(qc); },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/documents/${id}/favorite/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); },
  });
}

export function useToggleArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/documents/${id}/archive/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); },
  });
}

export function useFavoriteDocuments(params) {
  return useQuery({
    queryKey: ['documents', 'favorites', params],
    queryFn: () => api.get(`/documents/favorites/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useSharedWithMe(params) {
  return useQuery({
    queryKey: ['documents', 'shared-with-me', params],
    queryFn: () => api.get(`/documents/shared-with-me/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useOrgLibrary(params) {
  return useQuery({
    queryKey: ['documents', 'org-library', params],
    queryFn: () => api.get(`/documents/org-library/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useCollections() {
  return useQuery({ queryKey: ['collections'], queryFn: () => api.get('/documents/collections/') });
}

export function useCollectionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/documents/collections/', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collections'] }); },
  });
}

export function useCollectionDetail(collectionId, params) {
  return useQuery({
    queryKey: ['collections', collectionId, params],
    queryFn: () => api.get(`/documents/collections/${collectionId}/${qs(params)}`),
    enabled: !!collectionId,
    placeholderData: (prev) => prev,
  });
}

export function useCollectionDetailAction(collectionId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`/documents/collections/${collectionId}/`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collections', collectionId] }); },
  });
}

export function useToggleOrgLibrary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/documents/org-library/${id}/toggle/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents', 'org-library'] }); },
  });
}

export function useBulkDocumentAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/documents/bulk/', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); invalidateWorkspaceStats(qc); },
  });
}

export async function fetchDocumentShares(docId) {
  return api.get(`/documents/${docId}/share/`);
}

export async function createDocumentShare(docId, payload) {
  return api.post(`/documents/${docId}/share/`, payload);
}

export async function revokeDocumentShare(shareId) {
  return api.post(`/documents/shares/${shareId}/revoke/`);
}

export async function fetchDocumentVersions(docId) {
  return api.get(`/documents/${docId}/versions/`);
}

export function useUploadDocumentVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, formData }) => api.postForm(`/documents/${docId}/versions/upload/`, formData),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); invalidateWorkspaceStats(qc); },
  });
}

export async function fetchDocumentStatus(id) {
  return api.get(`/documents/${id}/status/`);
}

export async function fetchDocumentPreview(id) {
  return api.get(`/documents/${id}/preview/`);
}

// ── Ask AI ───────────────────────────────────────────────────────────
export function useAskContext() {
  return useQuery({ queryKey: ['ask', 'context'], queryFn: () => api.get('/ask/context/') });
}

export function useAskLog(logId) {
  return useQuery({
    queryKey: ['ask', 'log', logId],
    queryFn: () => api.get(`/ask/log/${logId}/`),
    enabled: !!logId,
  });
}

export function useAsk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/ask/', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ask', 'context'] }); },
  });
}

// Streaming isn't a TanStack Query mutation (it needs incremental
// partial state as tokens arrive, not one final value) - a small
// hand-rolled async generator consumer instead, mirroring
// ask_ai.html's streamAnswer() exactly (same SSE framing, same
// AbortController stop/retry semantics), just returning structured
// JSON on 'done' instead of swapping in server-rendered HTML.
export async function streamAsk(payload, { onToken, onDone, onError, signal }) {
  const response = await fetch(`${getApiBaseUrl()}/api/ask/stream/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() || '' },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    onError(new Error('stream unavailable'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (!frame.startsWith('data: ')) continue;

      const payloadEvent = JSON.parse(frame.slice(6));
      if (payloadEvent.type === 'token') onToken(payloadEvent.text);
      else if (payloadEvent.type === 'done') onDone(payloadEvent.result);
      else if (payloadEvent.type === 'error') onError(new Error('stream error'));
    }
  }
}

// ── Knowledge Base ───────────────────────────────────────────────────
function qs(params) {
  const search = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null)),
  ).toString();
  return search ? `?${search}` : '';
}

export function useKnowledgeBrowse(params) {
  return useQuery({
    queryKey: ['knowledge', 'browse', params],
    queryFn: () => api.get(`/knowledge/browse/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useEntityDetail(entityId) {
  return useQuery({
    queryKey: ['knowledge', 'entity', entityId],
    queryFn: () => api.get(`/knowledge/entities/${entityId}/`),
    enabled: !!entityId,
  });
}

export function useRelationships(params) {
  return useQuery({
    queryKey: ['knowledge', 'relationships', params],
    queryFn: () => api.get(`/knowledge/relationships/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useKnowledgeGraph() {
  return useQuery({ queryKey: ['knowledge', 'graph'], queryFn: () => api.get('/knowledge/graph/') });
}

export function useGraphNodeDetail(entityId) {
  return useQuery({
    queryKey: ['knowledge', 'graph', 'node', entityId],
    queryFn: () => api.get(`/knowledge/graph/nodes/${entityId}/`),
    enabled: !!entityId,
  });
}

export async function fetchGraphEdgeDetail(a, b) {
  return api.get(`/knowledge/graph/edge/?a=${a}&b=${b}`);
}

export function useCitationExplorer() {
  return useQuery({ queryKey: ['knowledge', 'citations'], queryFn: () => api.get('/knowledge/citations/') });
}

export function useKnowledgeInsights() {
  return useQuery({ queryKey: ['knowledge', 'insights'], queryFn: () => api.get('/knowledge/insights/') });
}

export function useDocumentKnowledge(docId) {
  return useQuery({
    queryKey: ['knowledge', 'document', docId],
    queryFn: () => api.get(`/knowledge/documents/${docId}/`),
    enabled: !!docId,
  });
}

// ── AI Tasks ─────────────────────────────────────────────────────────
export function useAiTasksConfig() {
  return useQuery({ queryKey: ['ai-tasks', 'config'], queryFn: () => api.get('/ai-tasks/config/'), staleTime: Infinity });
}

export function useCreateAiTask() {
  return useMutation({ mutationFn: (payload) => api.post('/ai-tasks/create/', payload) });
}

export function useAiTaskStatus(runId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['ai-tasks', 'status', runId],
    queryFn: () => api.get(`/ai-tasks/${runId}/status/`),
    enabled: !!runId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'running' ? 2000 : false;
    },
  });
}

export function useCancelAiTask() {
  return useMutation({ mutationFn: (runId) => api.post(`/ai-tasks/${runId}/cancel/`) });
}

export function useDeleteAiTask() {
  return useMutation({ mutationFn: (runId) => api.post(`/ai-tasks/${runId}/delete/`) });
}

export function useAiTaskResults(runId) {
  return useQuery({
    queryKey: ['ai-tasks', 'results', runId],
    queryFn: () => api.get(`/ai-tasks/${runId}/results/`),
    enabled: !!runId,
  });
}

export function useAiTaskHistory(params) {
  return useQuery({
    queryKey: ['ai-tasks', 'history', params],
    queryFn: () => api.get(`/ai-tasks/history/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

// ── Analytics ────────────────────────────────────────────────────────
// `organization` is a company slug, or "personal" - only ever honored
// server-side for a platform Admin (see RAG.api.analytics_views'
// module docstring, same mechanism Reports uses below); omitted
// entirely for every other viewer, who gets their ordinary
// active-workspace analytics exactly as before this existed.
export function useAnalytics(organization) {
  return useQuery({
    queryKey: ['analytics', organization || null],
    queryFn: () => api.get(`/analytics/${qs({ organization })}`),
  });
}

// ── Reports ──────────────────────────────────────────────────────────
// `organization` is a company slug, or "personal" - only ever honored
// server-side for a platform Admin (see RAG.api.reports_views.
// _resolve_report_organization()'s docstring); omitted entirely for
// every other viewer, who gets their ordinary active-workspace report
// exactly as before this existed.
export function useReports(organization) {
  return useQuery({
    queryKey: ['reports', organization || null],
    queryFn: () => api.get(`/reports/${qs({ organization })}`),
  });
}

// ── Search History ───────────────────────────────────────────────────
export function useSearchHistory(params) {
  return useQuery({
    queryKey: ['search-history', params],
    queryFn: () => api.get(`/history/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

// ── Monitoring ───────────────────────────────────────────────────────
export function useMonitoring() {
  return useQuery({
    queryKey: ['monitoring'],
    queryFn: () => api.get('/monitoring/'),
    refetchInterval: 15_000,
  });
}

export async function fetchMonitoringLive() {
  return api.get('/monitoring/?live=1');
}

// ── Admin: Users ─────────────────────────────────────────────────────
export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: () => api.get('/admin/users/') });
}

export function useAdminUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/users/action/', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });
}

export function useAdminUserProfile(userId) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'profile'],
    queryFn: () => api.get(`/admin/users/${userId}/profile/`),
    enabled: !!userId,
  });
}

// ── Admin: Roles ─────────────────────────────────────────────────────
export function useAdminRoles() {
  return useQuery({ queryKey: ['admin', 'roles'], queryFn: () => api.get('/admin/roles/') });
}

export function useCreateAdminRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/roles/create/', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); },
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissions }) => api.post(`/admin/roles/${roleId}/permissions/`, { permissions }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); },
  });
}

export function useDeleteAdminRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId) => api.post(`/admin/roles/${roleId}/delete/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); },
  });
}

// ── Admin: Queries ───────────────────────────────────────────────────
export function useAdminQueries(params) {
  return useQuery({
    queryKey: ['admin', 'queries', params],
    queryFn: () => api.get(`/admin/queries/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useToggleQueryFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId) => api.post(`/admin/queries/${logId}/toggle-flag/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'queries'] }); },
  });
}

// ── Admin: System Logs ───────────────────────────────────────────────
export function useAdminSystemLogs(params) {
  return useQuery({
    queryKey: ['admin', 'system-logs', params],
    queryFn: () => api.get(`/admin/system-logs/${qs(params)}`),
    placeholderData: (prev) => prev,
  });
}

export async function fetchAdminTraceDetail(traceId) {
  return api.get(`/admin/system-logs/traces/${traceId}/`);
}

export async function fetchAdminErrorGroupDetail(groupId) {
  return api.get(`/admin/system-logs/errors/${groupId}/`);
}

// ── Admin: Settings ──────────────────────────────────────────────────
export function useAdminSettings() {
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api.get('/admin/settings/') });
}

export function useSaveAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/settings/', payload),
    onSuccess: (data) => qc.setQueryData(['admin', 'settings'], data),
  });
}

export function useTestLlmProvider() {
  return useMutation({ mutationFn: (provider) => api.post('/admin/settings/health-check/', { provider }) });
}

// ── Notifications ────────────────────────────────────────────────────
export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count/'),
    refetchInterval: 25_000,
    staleTime: 0,
  });
}

export function useNotificationList(limit = 10) {
  return useQuery({
    queryKey: ['notifications', 'list', limit],
    queryFn: () => api.get(`/notifications/list/?limit=${limit}`),
    enabled: false, // lazy-fetched on first dropdown open, matching the classic bell
    staleTime: 0,
  });
}

export function useNotifications(params) {
  const search = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null)),
  ).toString();
  return useQuery({
    queryKey: ['notifications', 'center', params],
    queryFn: () => api.get(`/notifications/${search ? `?${search}` : ''}`),
    placeholderData: (prev) => prev,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/notifications/${id}/read/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read/'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

// ── Profile ──────────────────────────────────────────────────────────
export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: () => api.get('/profile/') });
}

export function useUpdatePersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/profile/personal/', payload),
    onSuccess: (data) => qc.setQueryData(['profile'], data),
  });
}

export function useUpdateExtendedProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/profile/extended/', payload),
    onSuccess: (data) => qc.setQueryData(['profile'], data),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.postForm('/profile/avatar/', formData);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emailCategories) => api.post('/profile/notifications/', { email_categories: emailCategories }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: (payload) => api.post('/profile/password/', payload) });
}

// ── Auth (signup / OTP / password reset) ────────────────────────────
export function useSignup() {
  return useMutation({ mutationFn: (payload) => api.post('/auth/signup/', payload) });
}

export function useVerifyOtpStatus() {
  return useQuery({ queryKey: ['auth', 'verify-otp', 'status'], queryFn: () => api.get('/auth/verify-otp/status/') });
}

export function useVerifyOtp() {
  return useMutation({ mutationFn: (code) => api.post('/auth/verify-otp/', { code }) });
}

export function useResendOtp() {
  return useMutation({ mutationFn: () => api.post('/auth/verify-otp/resend/') });
}

export function usePasswordResetRequest() {
  return useMutation({ mutationFn: (email) => api.post('/auth/password-reset/', { email }) });
}

export function usePasswordResetValidate(uidb64, token) {
  return useQuery({
    queryKey: ['auth', 'password-reset', 'validate', uidb64, token],
    queryFn: () => api.get(`/auth/password-reset/validate/${uidb64}/${token}/`),
    enabled: !!uidb64 && !!token,
    retry: false,
  });
}

export function usePasswordResetConfirm(uidb64, token) {
  return useMutation({
    mutationFn: (payload) => api.post(`/auth/password-reset/confirm/${uidb64}/${token}/`, payload),
  });
}

// ── Organizations ────────────────────────────────────────────────────
export function useMyOrganizations(enabled = true) {
  return useQuery({ queryKey: ['organizations'], queryFn: () => api.get('/organizations/'), enabled });
}

export function useOrganizationTypes() {
  return useQuery({ queryKey: ['organizations', 'types'], queryFn: () => api.get('/organizations/types/'), staleTime: 300_000 });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/organizations/', payload),
    onSuccess: (organization) => {
      // Seeds the new organization into ['organizations'] synchronously,
      // in the SAME shape organizations_view's GET already returns
      // per-entry (_serialize_organization) - not just invalidating and
      // waiting for a background refetch. OrganizationContext.jsx
      // switches the active workspace to this org's slug immediately
      // after this resolves, and its own "the persisted workspace
      // isn't in the list, fall back to Personal" guard would otherwise
      // misfire in the window before that refetch completes, since
      // invalidateQueries() below is intentionally fire-and-forget
      // (see the module-level note at the top of this file).
      qc.setQueryData(['organizations'], (old) => (
        old ? { ...old, organizations: [...old.organizations, organization] } : old
      ));
      qc.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useOrganizationDetail(orgSlug) {
  return useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => api.get(`/organizations/${orgSlug}/`),
    enabled: !!orgSlug,
  });
}

// URL-slug-scoped, not header-scoped - correct even when this
// organization isn't the currently "active" workspace in the sidebar.
// See organizations_views.organization_stats_view's docstring.
export function useOrganizationStats(orgSlug) {
  return useQuery({
    queryKey: ['organizations', orgSlug, 'stats'],
    queryFn: () => api.get(`/organizations/${orgSlug}/stats/`),
    enabled: !!orgSlug,
  });
}

// AI Credits - an Owner-only spendable balance, independent of the
// Plan's monthly caps (see RAG/services/billing_service.py). GET
// returns the balance + recent ledger entries; POST tops it up.
export function useOrganizationAiCredits(orgSlug) {
  return useQuery({
    queryKey: ['organizations', orgSlug, 'ai-credits'],
    queryFn: () => api.get(`/organizations/${orgSlug}/ai-credits/`),
    enabled: !!orgSlug,
  });
}

export function useAddAiCredits(orgSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount) => api.post(`/organizations/${orgSlug}/ai-credits/`, { amount }),
    onSuccess: (data) => {
      qc.setQueryData(['organizations', orgSlug, 'ai-credits'], data);
      qc.invalidateQueries({ queryKey: ['organizations', orgSlug, 'stats'] });
    },
  });
}

export function useUpdateOrganization(orgSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.patch(`/organizations/${orgSlug}/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations', orgSlug] });
      qc.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useOrganizationMembers(orgSlug) {
  return useQuery({
    queryKey: ['organizations', orgSlug, 'members'],
    queryFn: () => api.get(`/organizations/${orgSlug}/members/`),
    enabled: !!orgSlug,
  });
}

export function useOrganizationMemberAction(orgSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`/organizations/${orgSlug}/members/action/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations', orgSlug, 'members'] });
      qc.invalidateQueries({ queryKey: ['organizations', orgSlug, 'audit-logs'] });
    },
  });
}

// The 2026-09-06 replacement for the email-invitation-link flow - the
// Owner submits a name + email, the backend generates a username and
// password and emails the new member their credentials directly
// (see RAG/services/org_member_registration_service.py). No token,
// no self-signup step, no role picker - a registered member is always
// created as Member; promoting to Owner happens afterward via the
// existing "Make Owner" role-change action.
export function useRegisterMember(orgSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`/organizations/${orgSlug}/members/register/`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations', orgSlug, 'members'] }); },
  });
}

export function useOrganizationInvitations(orgSlug) {
  return useQuery({
    queryKey: ['organizations', orgSlug, 'invitations'],
    queryFn: () => api.get(`/organizations/${orgSlug}/invitations/`),
    enabled: !!orgSlug,
  });
}

export function useCreateInvitation(orgSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(`/organizations/${orgSlug}/invitations/`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations', orgSlug, 'invitations'] }); },
  });
}

export function useRevokeInvitation(orgSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId) => api.post(`/organizations/${orgSlug}/invitations/${invitationId}/revoke/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations', orgSlug, 'invitations'] }); },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token) => api.post('/organizations/invitations/accept/', { token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations'] }); },
  });
}

export function useOrganizationAuditLogs(orgSlug, { page = 1, action = '' } = {}) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (action) params.set('action', action);
  const qs = params.toString();
  return useQuery({
    queryKey: ['organizations', orgSlug, 'audit-logs', page, action],
    queryFn: () => api.get(`/organizations/${orgSlug}/audit-logs/${qs ? `?${qs}` : ''}`),
    enabled: !!orgSlug,
  });
}

// Billing (org-scoped, Owner-only; platform-wide management is Super Admin only, below).
// Payload now also carries available_plans (this org's plan_type=company
// catalog) and pending_request (this org's own pending PlanChangeRequest,
// if any) - see billing_views.organization_billing_view.
export function useOrganizationBilling(orgSlug) {
  return useQuery({
    queryKey: ['organizations', orgSlug, 'billing'],
    queryFn: () => api.get(`/organizations/${orgSlug}/billing/`),
    enabled: !!orgSlug,
  });
}

// Owner requests a Plan change - stays Pending until a Platform Admin
// approves/rejects it (see usePlanRequestAction below).
export function useRequestPlan(orgSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId) => api.post(`/organizations/${orgSlug}/billing/request-plan/`, { plan_id: planId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations', orgSlug, 'billing'] }); },
  });
}

// Platform Super Admin oversight (organizations.view_all / organizations.manage).
export function usePlatformOrganizations() {
  return useQuery({ queryKey: ['admin', 'organizations'], queryFn: () => api.get('/admin/organizations/') });
}

export function usePlatformOrganizationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgSlug, ...payload }) => api.post(`/admin/organizations/${orgSlug}/action/`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'organizations'] }); },
  });
}

// Platform Super Admin billing oversight (billing.manage_plans / billing.view_all).
// `planType` ('company'/'personal') filters server-side - AdminBillingPlans.jsx's
// two tabs are two separate calls to this same hook/endpoint.
export function usePlatformPlans(planType) {
  return useQuery({
    queryKey: ['admin', 'billing', 'plans', planType || 'all'],
    queryFn: () => api.get(`/admin/billing/plans/${planType ? `?plan_type=${planType}` : ''}`),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/billing/plans/', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'billing', 'plans'] }); },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...payload }) => api.patch(`/admin/billing/plans/${planId}/`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'billing', 'plans'] }); },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId) => api.delete(`/admin/billing/plans/${planId}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'billing', 'plans'] }); },
  });
}

// Plan Requests - the Owner/Personal-user self-service "request a plan"
// queue a Platform Admin approves/rejects (see billing_service.
// approve_plan_request()/reject_plan_request()). Separate from the
// direct assign/unassign dropdown above, which stays instant/admin-only.
export function usePlatformPlanRequests(status) {
  return useQuery({
    queryKey: ['admin', 'billing', 'plan-requests', status || 'all'],
    queryFn: () => api.get(`/admin/billing/plan-requests/${status ? `?status=${status}` : ''}`),
  });
}

export function usePlanRequestAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, ...payload }) => api.post(`/admin/billing/plan-requests/${requestId}/action/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'billing', 'plan-requests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'billing', 'organizations'] });
    },
  });
}

export { setCsrfToken };
