import Spinner from './Spinner';

// A quiet "numbers are refreshing" cue for a stat row that's
// mid-background-refetch - React Query keeps showing the last cached
// values while a refetch is in flight (see useDocuments'/useDashboard's
// placeholderData/cache behavior), so without this a stat card just
// sits on a stale number with no indication anything is happening
// until it silently flips. Render only while `show` is true - never
// on the very first load, which already has its own skeleton state
// (StatCardSkeleton/PageSkeleton) further up the same page.
export default function StatsSyncBadge({ show }) {
  if (!show) return null;
  return (
    <div className="mb-2 flex items-center justify-end gap-1.5 text-xs font-medium text-muted dark:text-muted-dark">
      <Spinner size={12} /> Updating stats…
    </div>
  );
}
