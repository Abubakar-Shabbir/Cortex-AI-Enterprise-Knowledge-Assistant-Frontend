import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GAP = 8; // space between trigger and panel, and the viewport-edge safety margin

// The one "..." action-menu dropdown every row-actions button in the
// app should mount through - AdminUsers.jsx/AdminOrganizations.jsx/
// OrganizationMembers.jsx/Collections.jsx/RecentDocumentsTable.jsx
// each used to hand-roll their own `absolute right-0 mt-2` panel
// sitting inside the same `overflow-hidden`/`overflow-auto` table
// card its own corner-radius fix needs (see AdminOrganizations.jsx/
// AdminUsers.jsx) - which meant the panel was ALWAYS one clipped
// ancestor away from getting cut off, and "open upward for the last
// row" was a hardcoded guess rather than a real fix (it broke down
// for the second-to-last row, a short viewport, a resized window,
// ...). This portals the panel straight to `document.body` and
// measures the actual trigger + panel rects at open time (a two-pass
// render: measure invisibly, then place it) so it can never be
// clipped by a table's own scroll/rounded-corner container, always
// flips to open upward when there isn't room below (re-measured live,
// not guessed from row index), and always clamps inside the
// viewport horizontally so it can't run off either edge on a narrow
// screen. `trigger` is a render-prop so every caller keeps its own
// exact button markup/styling (icon, disabled state, data-testid) -
// this component only owns open state, positioning, portaling,
// outside-click/Escape-to-close, and re-measuring on scroll/resize.
export default function ActionMenu({ trigger, children, align = 'end', panelClassName = 'w-56' }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const close = () => setOpen(false);

  // Positions the portaled panel by writing directly to its own DOM
  // node (imperative, via the ref) rather than through React state -
  // there is no rendered output that depends on the computed
  // coordinates, only a side effect on an element that already exists,
  // so routing it through setState would just schedule an extra
  // render for nothing (and re-fire on every resize/scroll tick while
  // open). useLayoutEffect still runs before the browser paints, so
  // the very first frame is already correctly placed - no flash at
  // the (0,0)/hidden fallback below.
  useLayoutEffect(() => {
    if (!open) return undefined;

    const place = () => {
      const trigger_ = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger_ || !panel) return;

      const triggerRect = trigger_.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const spaceBelow = vh - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const openUpward = spaceBelow < panelRect.height + GAP && spaceAbove > spaceBelow;

      let left = align === 'start' ? triggerRect.left : triggerRect.right - panelRect.width;
      left = Math.min(Math.max(left, GAP), vw - panelRect.width - GAP);

      const top = openUpward ? triggerRect.top - panelRect.height - GAP : triggerRect.bottom + GAP;

      panel.style.top = `${Math.round(top)}px`;
      panel.style.left = `${Math.round(left)}px`;
      panel.style.visibility = 'visible';
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') close(); };
    const onPointerDown = (e) => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  return (
    <>
      {trigger({ ref: triggerRef, open, toggle: () => setOpen((v) => !v) })}
      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
          className={`z-[60] space-y-0.5 overflow-hidden rounded-xl border border-line bg-card p-1.5 shadow-soft dark:border-line-dark dark:bg-card-dark ${panelClassName}`}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>,
        document.body,
      )}
    </>
  );
}
