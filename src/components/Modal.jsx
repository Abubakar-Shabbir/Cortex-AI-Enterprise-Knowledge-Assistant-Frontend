import { useEffect } from 'react';
import { XIcon as X } from '@phosphor-icons/react';

// The one dialog shell every popup in the app should mount through -
// previously every modal (billing's "Add Credits"/"New Plan"/"Edit
// Features", sharing, versions, ...) hand-rolled its own
// `fixed inset-0` backdrop + card markup, so entrance animation,
// Escape-to-close, and header/close-button treatment all drifted
// slightly from one another. This is a plain presentational shell
// (title/icon/close in the header, `children` as the body, an
// optional `footer` node for the action row) - callers keep owning
// their own form state and submit handlers exactly as before, just
// render inside <Modal> instead of the raw backdrop+card div.
export default function Modal({
  title, icon: Icon, iconBg = 'bg-primary/10', iconColor = 'text-primary dark:text-primary-soft',
  onClose, children, footer, maxWidth = 'max-w-md', bodyClassName = 'space-y-4 px-6 py-5',
}) {
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Lock the page behind every modal (New Plan, Add Credits, Edit
  // Features, ...) so it can't be scrolled while this is open -
  // scrolling the backdrop while a dialog floats on top of it reads as
  // broken, not as a feature. Compensate for the scrollbar's own width
  // disappearing (body padding-right) so removing it doesn't reflow/
  // shift the page's content sideways for the instant the modal is up.
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const { overflow: prevOverflow, paddingRight: prevPaddingRight } = document.body.style;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const currentPaddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  return (
    <div
      className="modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm dark:bg-black/75"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`modal-pop-in w-full ${maxWidth} overflow-hidden rounded-2xl border border-line bg-card shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:border-line-dark dark:bg-card-dark dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] dark:ring-white/10`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5 dark:border-line-dark">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                <Icon className="h-4 w-4" />
              </span>
            )}
            <h3 className="text-base font-semibold text-ink dark:text-ink-dark">{title}</h3>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink dark:text-muted-dark dark:hover:bg-white/5 dark:hover:text-ink-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={bodyClassName}>{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-line bg-surface/60 px-6 py-4 dark:border-line-dark dark:bg-white/[0.03]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
