import { Link } from 'react-router-dom';
import { FileTextIcon as FileText } from '@phosphor-icons/react';
import ChartCanvas from '../ChartCanvas';
import EmptyState from '../EmptyState';

// Shared across every Overview page (Admin/Company Owner/User) - see
// DocumentsOverTimeCard.jsx's note on why this lives here instead of
// being redefined per page. Originally lived inline in
// AdminOverview.jsx.
export default function DocumentTypesCard({ data, isDark }) {
  const breakdown = data?.breakdown || [];

  const chartConfig = {
    type: 'doughnut',
    data: {
      labels: breakdown.map((item) => item.type),
      datasets: [{
        data: breakdown.map((item) => item.count),
        backgroundColor: breakdown.map((item) => item.color),
        hoverOffset: 6,
        borderWidth: 2,
        borderColor: isDark ? '#1c1414' : '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(item) {
              const entry = breakdown[item.dataIndex];
              return ` ${entry.type}: ${entry.count} (${entry.percent}%)`;
            },
          },
        },
      },
    },
  };

  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-soft dark:border-line-dark dark:bg-card-dark">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Document Types</h2>
        <Link to="/documents" className="text-xs font-medium text-primary hover:underline dark:text-primary-soft">View all</Link>
      </div>

      {breakdown.length > 0 ? (
        <>
          <div className="relative mx-auto h-24 w-24">
            <ChartCanvas config={chartConfig} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-tight text-ink dark:text-ink-dark">{data.total}</span>
              <span className="text-xs text-muted dark:text-muted-dark">Total</span>
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {breakdown.map((item) => (
              <div key={item.type} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-ink dark:text-ink-dark">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.type}
                </span>
                <span className="text-muted dark:text-muted-dark">{item.percent}% ({item.count})</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={FileText} title="No documents yet" message="Upload a document to see its type breakdown here." actionTo="/documents" actionLabel="Go to Documents" />
      )}
    </div>
  );
}
