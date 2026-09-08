import { useEffect, useRef, useState } from 'react';
import { WarningCircleIcon as AlertCircle, CaretDownIcon as ChevronDown, TrendUpIcon as TrendingUp } from '@phosphor-icons/react';
import ChartCanvas from '../ChartCanvas';
import EmptyState from '../EmptyState';

const GRID_COLOR = 'rgba(106, 106, 106, 0.12)';
const PRIMARY = '#FF385C';

// Shared across every Overview page (Admin/Company Owner/User) so the
// "growth over time" chart looks identical regardless of who's
// viewing it - only the underlying data differs (platform-wide,
// organization-wide, or scoped to just the viewer's own uploads, see
// stats_service._workspace_scope()'s scope_to_own param). Originally
// lived inline in AdminOverview.jsx.
//
// `onRangeChange` is optional - omit it (Company Owner Overview,
// whose backend endpoint doesn't yet support switching ranges) to
// render the "last N days" label without the interactive dropdown.
export default function DocumentsOverTimeCard({ data, hasDocuments, range, ranges = [7, 14, 30], onRangeChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const series = data?.series || [];
  const daily = data?.daily || [];
  const periodAdded = data?.period_added ?? 0;
  const growthPct = data?.growth_pct ?? 0;

  const chartConfig = {
    type: 'bar',
    data: {
      labels: data?.labels || [],
      datasets: [
        {
          type: 'bar',
          label: 'New that day',
          data: daily,
          yAxisID: 'yDaily',
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return 'rgba(255, 56, 92, 0.22)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(255, 56, 92, 0.38)');
            gradient.addColorStop(1, 'rgba(255, 56, 92, 0.12)');
            return gradient;
          },
          hoverBackgroundColor: 'rgba(255, 56, 92, 0.55)',
          borderRadius: 6,
          maxBarThickness: 26,
          order: 3,
        },
        {
          type: 'line',
          label: 'Total documents',
          data: series,
          yAxisID: 'yTotal',
          borderColor: PRIMARY,
          // Small-dot line, not a solid stroke - a short dash + a wide
          // gap + round caps reads as a dotted trend line rather than a
          // dashed one, which pairs nicely with the emphasized points
          // below (the line becomes a light "connect the dots" guide,
          // the points carry the visual weight).
          borderDash: [1, 7],
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(255, 56, 92, 0.32)');
            gradient.addColorStop(0.6, 'rgba(255, 56, 92, 0.06)');
            gradient.addColorStop(1, 'rgba(255, 56, 92, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          cubicInterpolationMode: 'monotone',
          // Every point styled individually so the most recent day
          // (the last index) stands out as a bigger, brighter "you are
          // here" marker instead of blending in with the rest.
          pointRadius: series.map((_, i) => (i === series.length - 1 ? 7 : 4)),
          pointHitRadius: 14,
          pointHoverRadius: 9,
          pointBackgroundColor: series.map((_, i) => (i === series.length - 1 ? '#fff' : PRIMARY)),
          pointBorderColor: series.map((_, i) => (i === series.length - 1 ? PRIMARY : '#fff')),
          pointBorderWidth: series.map((_, i) => (i === series.length - 1 ? 3 : 2)),
          pointHoverBackgroundColor: PRIMARY,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3,
          borderWidth: 3,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 650, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 10,
          cornerRadius: 10,
          titleFont: { weight: '600' },
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label(item) {
              const suffix = item.dataset.yAxisID === 'yDaily' ? ' new' : ' total';
              return ` ${item.dataset.label}: ${item.formattedValue}${suffix}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        yTotal: {
          position: 'left',
          grid: { color: GRID_COLOR, drawTicks: false, borderDash: [3, 4] },
          border: { display: false },
          beginAtZero: true,
          ticks: { precision: 0, padding: 8 },
        },
        yDaily: {
          position: 'right',
          grid: { drawOnChartArea: false },
          border: { display: false },
          beginAtZero: true,
          suggestedMax: Math.max(1, ...daily) * 3,
          ticks: { precision: 0, maxTicksLimit: 3 },
        },
      },
    },
  };

  return (
    <div className="min-w-0 rounded-xl border border-line bg-card p-4 shadow-soft transition-shadow hover:shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.06)_0_4px_12px_0,rgba(0,0,0,0.14)_0_8px_20px_0] dark:border-line-dark dark:bg-card-dark">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Documents Over Time</h2>
          {hasDocuments && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-ink dark:text-ink-dark">{series[series.length - 1] ?? 0}</span>
              {periodAdded > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success dark:text-success-dark">
                  <TrendingUp className="h-3 w-3" /> +{periodAdded} ({growthPct}%)
                </span>
              )}
              <span className="text-[11px] text-muted dark:text-muted-dark">last {range} days</span>
            </div>
          )}
        </div>
        {hasDocuments && onRangeChange && (
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-medium text-ink transition-colors hover:bg-surface dark:border-line-dark dark:text-ink-dark dark:hover:bg-white/5"
            >
              {range} Days <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="fade-in-up absolute right-0 z-20 mt-1 w-28 rounded-xl border border-line bg-card p-1.5 shadow-soft dark:border-line-dark dark:bg-card-dark">
                {ranges.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => { onRangeChange(option); setOpen(false); }}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${option === range ? 'font-semibold text-primary dark:text-primary-soft' : 'text-ink hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5'}`}
                  >
                    {option} Days
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {hasDocuments ? (
        <>
          <div className="relative h-44 w-full"><ChartCanvas config={chartConfig} /></div>
          <div className="mt-3 flex items-center gap-3 border-t border-line pt-2.5 text-[11px] text-muted dark:border-line-dark dark:text-muted-dark">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Total documents</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary/30" /> New that day</span>
          </div>
        </>
      ) : (
        <EmptyState icon={AlertCircle} title="No activity yet" message="Upload a document to start tracking growth over time." actionTo="/documents" actionLabel="Go to Documents" />
      )}
    </div>
  );
}
