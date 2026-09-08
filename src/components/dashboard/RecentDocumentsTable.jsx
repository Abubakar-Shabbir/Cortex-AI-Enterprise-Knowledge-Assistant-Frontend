import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon as Eye, FileTextIcon as FileText, DotsThreeIcon as MoreHorizontal, TrashIcon as Trash2 } from '@phosphor-icons/react';
import { useDeleteDocument } from '../../api/hooks';
import EmptyState from '../EmptyState';
import Spinner from '../Spinner';
import { timeAgo } from '../../lib/timeAgo';

const DOC_STATUS_STYLES = {
  Processed: 'bg-success/10 text-success dark:text-success-dark',
  Partial: 'bg-warning/10 text-warning dark:text-warning-dark',
};

// Shared across every Overview page (Admin/Company Owner/User) - see
// DocumentsOverTimeCard.jsx's note on why this lives here instead of
// being redefined per page. Originally lived inline in
// AdminOverview.jsx. `showOwner` defaults to true (an Organization's
// table spans every member's uploads - see stats_service.
// get_recent_documents_table()'s docstring); User Overview passes
// `false` since every row there already belongs to the one viewer, by
// construction - an Owner column would just repeat the same name.
export default function RecentDocumentsTable({ rows, showOwner = true }) {
  const [openRowId, setOpenRowId] = useState(null);
  const deleteMutation = useDeleteDocument();

  return (
    <div className="rounded-xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2 dark:border-line-dark">
        <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Recent Documents</h2>
        <Link to="/documents" className="text-xs font-medium text-primary hover:underline dark:text-primary-soft">View all</Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet" message="Upload your first document to see it here." />
      ) : (
        <div className="max-h-[260px] overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card dark:bg-card-dark">
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted dark:border-line-dark dark:text-muted-dark">
                <th className="px-3.5 py-2">Name</th>
                {showOwner && <th className="px-2.5 py-2">Owner</th>}
                <th className="px-2.5 py-2">Type</th>
                <th className="px-2.5 py-2 text-right">Chunks</th>
                <th className="px-2.5 py-2 text-right">Size</th>
                <th className="px-2.5 py-2">Uploaded</th>
                <th className="px-2.5 py-2">Status</th>
                <th className="px-3.5 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-line-dark">
              {rows.map((doc) => {
                const isDeletePending = deleteMutation.isPending && deleteMutation.variables === doc.id;
                return (
                <tr key={doc.id} className={`transition-colors hover:bg-surface dark:hover:bg-white/5 ${isDeletePending ? 'opacity-50' : ''}`}>
                  <td className="max-w-[220px] truncate px-3.5 py-2 font-medium text-ink dark:text-ink-dark">
                    <span className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-primary dark:text-primary-soft" />
                      <span className="truncate">{doc.title}</span>
                    </span>
                  </td>
                  {showOwner && <td className="px-2.5 py-2 text-muted dark:text-muted-dark">{doc.owner}</td>}
                  <td className="px-2.5 py-2 text-muted dark:text-muted-dark">{doc.file_type}</td>
                  <td className="px-2.5 py-2 text-right text-muted dark:text-muted-dark">{doc.chunk_count}</td>
                  <td className="px-2.5 py-2 text-right text-muted dark:text-muted-dark">{doc.size}</td>
                  <td className="px-2.5 py-2 text-muted dark:text-muted-dark">{timeAgo(doc.uploaded_at)} ago</td>
                  <td className="px-2.5 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DOC_STATUS_STYLES[doc.status] || 'bg-muted/10 text-muted dark:text-muted-dark'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() => setOpenRowId((id) => (id === doc.id ? null : doc.id))}
                        disabled={isDeletePending}
                        className="rounded-lg p-1.5 text-muted hover:bg-surface disabled:opacity-50 dark:text-muted-dark dark:hover:bg-white/5"
                        aria-label="Row actions"
                      >
                        {isDeletePending ? <Spinner size={16} /> : <MoreHorizontal className="h-4 w-4" />}
                      </button>
                      {openRowId === doc.id && (
                        <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-line bg-card p-1.5 shadow-soft dark:border-line-dark dark:bg-card-dark">
                          <Link to="/documents" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface dark:text-ink-dark dark:hover:bg-white/5">
                            <Eye className="h-3.5 w-3.5 text-muted dark:text-muted-dark" /> View
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenRowId(null);
                              if (window.confirm('Delete this document?')) deleteMutation.mutate(doc.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 dark:text-danger-dark"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
