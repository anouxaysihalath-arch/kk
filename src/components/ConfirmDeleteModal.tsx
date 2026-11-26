import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  blockedMessage?: string | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteModal({
  open,
  title,
  description,
  blockedMessage,
  deleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, deleting, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h2 id="confirm-delete-title" className="text-sm font-bold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            aria-label="ປິດ"
            className="p-1 text-slate-400 hover:text-slate-900 rounded cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

        {blockedMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            {blockedMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            {blockedMessage ? 'ເຂົ້າໃຈແລ້ວ' : 'ຍົກເລີກ'}
          </button>
          {!blockedMessage && (
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={deleting}
              className="px-3.5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'ກຳລັງລຶບ...' : 'ຢືນຢັນການລຶບ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
