import { useState } from 'react';
import { CoinIcon as Coin, PlusIcon as Plus } from '@phosphor-icons/react';
import Modal from '../Modal';
import Spinner from '../Spinner';

// Shared between PersonalBilling.jsx and OrganizationBilling.jsx - a
// Personal Plan's and a Company Plan's credit top-up are two separate
// mutations (different endpoints/hooks), so this stays decoupled from
// either: the caller passes `onAdd(amount)` (an async function - a
// mutateAsync call) and this owns only the form, validation, and
// submit-error display around it.
export default function AddCreditsModal({ onClose, onAdd }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const parsed = parseInt(amount, 10);
    if (!parsed || parsed <= 0) {
      setError('Enter a positive whole number.');
      return;
    }
    setIsPending(true);
    try {
      await onAdd(parsed);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      title="Add AI Credits" icon={Coin} iconBg="bg-warning/10" iconColor="text-warning dark:text-warning-dark"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface dark:text-muted-dark dark:hover:bg-white/5">Cancel</button>
          <button type="submit" form="add-credits-form" disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60">
            {isPending ? <Spinner size={16} /> : <Plus className="h-4 w-4" />} {isPending ? 'Adding…' : 'Add Credits'}
          </button>
        </>
      }
    >
      <form id="add-credits-form" onSubmit={onSubmit} className="space-y-3">
        {error && <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger dark:text-danger-dark">{error}</p>}
        <div>
          <label htmlFor="credits-amount" className="mb-1.5 block text-xs font-medium text-muted dark:text-muted-dark">Credits to add</label>
          <input
            id="credits-amount"
            type="number" min="1" step="1" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none dark:focus:border-ink-dark dark:border-line-dark dark:bg-white/5 dark:text-ink-dark dark:placeholder:text-muted-dark"
          />
        </div>
        <p className="text-xs leading-relaxed text-muted dark:text-muted-dark">1 credit = 1 question asked; an AI Task run costs 1 credit per document processed. Independent of your Plan's monthly limits.</p>
      </form>
    </Modal>
  );
}
