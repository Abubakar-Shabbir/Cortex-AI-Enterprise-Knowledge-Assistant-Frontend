import { LightningIcon as Lightning } from '@phosphor-icons/react';
import EmptyState from '../EmptyState';

// Shared by CompanyOwnerOverview.jsx and OrganizationOverview.jsx - same
// organization_stats_view.ai_performance payload (observability_service.
// get_performance_summary()) either way.
export default function AiUsageCard({ aiPerformance }) {
  if (!aiPerformance?.has_data) {
    return (
      <div className="rounded-xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
        <div className="border-b border-line px-5 py-4 dark:border-line-dark">
          <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">AI Usage</h3>
        </div>
        <EmptyState icon={Lightning} title="No AI activity yet" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
      <div className="border-b border-line px-5 py-4 dark:border-line-dark">
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">AI Usage</h3>
        <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">{aiPerformance.total_requests} requests · {aiPerformance.success_rate}% success · {aiPerformance.avg_latency_ms}ms avg</p>
      </div>
      {(aiPerformance.provider_stats || []).length > 0 && (
        <div className="divide-y divide-line dark:divide-line-dark">
          {aiPerformance.provider_stats.map((p) => (
            <div key={p.provider} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="font-medium text-ink dark:text-ink-dark">{p.provider}</span>
              <span className="text-xs text-muted dark:text-muted-dark">{p.total} requests · {p.success_rate}% success</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
