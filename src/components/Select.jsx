import { useEffect, useRef, useState } from 'react';
import { CaretDownIcon as ChevronDown, CheckIcon as Check } from '@phosphor-icons/react';

// A custom-styled dropdown replacing the browser's native <select> -
// same trigger chrome as every other input in the app (rounded-lg
// border, focus ring), but with a proper floating panel (checkmark on
// the selected option, hover state, optional per-option description)
// instead of the OS-themed native popup that always looked out of
// place next to the rest of this design system. Options accept either
// `{ value, label, description? }` objects or plain `[value, label]`
// tuples (the shape most existing call sites already used with a
// native <select>), so this drops in without reshaping callers' data.
function normalizeOption(opt) {
  if (Array.isArray(opt)) return { value: opt[0], label: opt[1] };
  return opt;
}

export default function Select({ label, value, onChange, options, placeholder = 'Select…', disabled = false, size = 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const normalized = options.map(normalizeOption);
  const current = normalized.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    // A real click-outside check against the trigger+panel's own DOM
    // node - not a full-viewport transparent overlay - so opening this
    // dropdown never blocks clicks/hover on the rest of the page (the
    // "back UI" behind a form field shouldn't become unreachable just
    // because one dropdown nearby is open).
    const onPointerDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2.5 text-sm';

  return (
    <div ref={ref} className="relative">
      {label && <label className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border-2 bg-surface text-left text-ink transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:text-ink-dark ${sizeClasses} ${
          open ? 'border-ink dark:border-ink-dark' : 'border-line hover:border-ink/30 dark:border-line-dark dark:hover:border-ink-dark/30'
        }`}
      >
        <span className={`truncate ${current ? '' : 'text-muted dark:text-muted-dark'}`}>{current ? current.label : placeholder}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-150 dark:text-muted-dark ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1.5 max-h-64 overflow-auto rounded-xl border border-line bg-card p-1 shadow-soft dark:border-line-dark dark:bg-card-dark">
          {normalized.map((opt) => {
            const selected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selected ? 'bg-primary/10 text-primary dark:text-primary-soft' : 'text-ink hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{opt.label}</span>
                  {opt.description && <span className="block truncate text-xs text-muted dark:text-muted-dark">{opt.description}</span>}
                </span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0" weight="bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
