import { useState } from 'react';
import { CoinIcon as Coin, PlusIcon as Plus } from '@phosphor-icons/react';
import AddCreditsModal from './AddCreditsModal';

// Shared between PersonalBilling.jsx and OrganizationBilling.jsx - the
// spendable AI-credits balance card plus its "Add Credits" modal,
// fully self-contained (owns its own modal-open state). The caller
// only supplies the data (from whichever credits hook applies to that
// workspace) and `onAdd`, an async function wired to that workspace's
// own add-credits mutation.
export default function AiCreditsCard({ balance, transactions = [], isLoading, onAdd }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 dark:border-line-dark">
        <div>
          <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">AI Credits</h3>
          <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">A spendable balance, separate from your Plan's monthly limits</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark">
          <Plus className="h-3.5 w-3.5" /> Add Credits
        </button>
      </div>

      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning dark:text-warning-dark"><Coin className="h-5 w-5" weight="fill" /></div>
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none text-ink dark:text-ink-dark">
            {isLoading ? '—' : balance == null ? 'Unlimited' : balance.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted dark:text-muted-dark">{balance == null ? 'no limit set yet' : 'credits remaining'}</p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="max-h-56 divide-y divide-line overflow-y-auto border-t border-line dark:divide-line-dark dark:border-line-dark">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-xs">
              <div className="min-w-0">
                <p className="truncate text-ink dark:text-ink-dark">{t.reason}</p>
                <p className="text-muted dark:text-muted-dark">{t.actor || 'System'} · {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</p>
              </div>
              <span className={`shrink-0 font-semibold tabular-nums ${t.amount > 0 ? 'text-success dark:text-success-dark' : 'text-muted dark:text-muted-dark'}`}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <AddCreditsModal onAdd={onAdd} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
