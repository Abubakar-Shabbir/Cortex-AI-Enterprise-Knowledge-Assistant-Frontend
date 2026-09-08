// Port of templates/partials/_page_header.html. `action` is an
// optional right-aligned node (a button, a filter control, ...) for
// the slot this row already reserves - omit it and nothing renders
// there, exactly like every existing caller today.
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-ink-dark">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted dark:text-muted-dark">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
