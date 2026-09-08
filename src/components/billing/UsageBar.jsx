// Shared between PersonalBilling.jsx and OrganizationBilling.jsx -
// one monthly-usage-vs-plan-limit row, `max == null` reading as
// unlimited (no bar, just the count) rather than a bar stuck at 0%.
// `formatter` defaults to a plain integer count (queries, runs, ...);
// pass `formatBytes` for a storage row so it reads "444.4 KB / 2.0 GB"
// instead of a raw byte count, while still getting the same bar every
// other usage row gets - the original storage row skipped the bar
// entirely for exactly this formatting reason.
export default function UsageBar({ label, used, max, formatter = (v) => v.toLocaleString() }) {
  const unlimited = max === null || max === undefined;
  const percent = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100));
  const near = !unlimited && percent >= 90;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-ink dark:text-ink-dark">{label}</span>
        <span className="tabular-nums text-muted dark:text-muted-dark">
          {formatter(used)} {unlimited ? '' : `/ ${formatter(max)}`}{unlimited && ' (unlimited)'}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface dark:bg-white/5">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${near ? 'bg-danger' : 'bg-primary'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
