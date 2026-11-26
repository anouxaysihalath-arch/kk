import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  EquipmentItem,
  FIELD_LIMITS,
  MOVEMENT_ACTION_LABELS,
  MovementActionType,
} from '../types/inventory';
import { evaluateMovement, MovementOutcome } from '../utils/inventoryLogic';

interface MovementModalProps {
  open: boolean;
  item: EquipmentItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    item: EquipmentItem,
    actionType: MovementActionType,
    actorName: string,
    note: string,
    outcome: MovementOutcome,
  ) => Promise<void>;
}

export function MovementModal({
  open,
  item,
  saving,
  onClose,
  onSubmit,
}: MovementModalProps) {
  const [actionType, setActionType] = useState<MovementActionType>('check_out');
  const [quantity, setQuantity] = useState('1');
  const [actorName, setActorName] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !item) return;
    setActionType(item.quantity > 0 ? 'check_out' : 'check_in');
    setQuantity(item.quantity > 0 ? '1' : '1');
    setActorName('');
    setNote('');
    setErrors({});
    setSubmitError(null);
  }, [open, item]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, saving, onClose]);

  if (!open || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const outcome = evaluateMovement(
      {
        actionType,
        quantity: quantity === '' ? NaN : Number(quantity),
        actorName,
        note,
      },
      item,
    );

    if (!outcome.valid) {
      setErrors(outcome.errors as Record<string, string>);
      return;
    }

    setErrors({});
    try {
      await onSubmit(item, actionType, actorName, note, outcome);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'ບໍ່ສາມາດບັນທຶກລາຍການໄດ້');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movement-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 id="movement-modal-title" className="text-base font-bold text-slate-900">
              ເບີກ-ຮັບຄືນ / ປັບສະຕັອກ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {item.name} · ຄົງເຫຼືອ{' '}
              <strong className="font-mono tabular-nums text-slate-800">
                {item.quantity} {item.unit}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="ປິດໜ້າຕ່າງ"
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {submitError}
            </div>
          )}

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              ປະເພດລາຍການ
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
              {(['check_out', 'check_in', 'adjust'] as MovementActionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setActionType(type);
                    if (type === 'adjust') setQuantity(String(item.quantity));
                    else setQuantity('1');
                    setErrors({});
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    actionType === type
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'check_out'
                    ? 'ເບີກອອກ'
                    : type === 'check_in'
                      ? 'ຮັບຄືນ'
                      : 'ປັບຍອດ'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mov-qty" className="block text-xs font-medium text-slate-700 mb-1">
              {actionType === 'adjust'
                ? `ຍອດຄົງເຫຼືອໃໝ່ (${item.unit})`
                : `ຈຳນວນທີ່${MOVEMENT_ACTION_LABELS[actionType]} (${item.unit})`}{' '}
              <span className="text-red-600">*</span>
            </label>
            <input
              id="mov-qty"
              type="number"
              min={actionType === 'adjust' ? 0 : 1}
              max={FIELD_LIMITS.quantityMax}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
          </div>

          <div>
            <label htmlFor="mov-actor" className="block text-xs font-medium text-slate-700 mb-1">
              ຊື່ຜູ້ເບີກ / ຜູ້ຮັບຜິດຊອບ <span className="text-red-600">*</span>
            </label>
            <input
              id="mov-actor"
              type="text"
              maxLength={FIELD_LIMITS.actorNameMax}
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="ເຊັ່ນ ທ້າວ ບຸນມີ"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.actorName && (
              <p className="mt-1 text-xs text-red-600">{errors.actorName}</p>
            )}
          </div>

          <div>
            <label htmlFor="mov-note" className="block text-xs font-medium text-slate-700 mb-1">
              ໝາຍເຫດ
            </label>
            <input
              id="mov-note"
              type="text"
              maxLength={FIELD_LIMITS.movementNoteMax}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ເຊັ່ນ ເບີກໄປໃຊ້ໜ້າວຽກໂຄງການ"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.note && <p className="mt-1 text-xs text-red-600">{errors.note}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນລາຍການ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
