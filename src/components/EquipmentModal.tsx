import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  COMMON_UNITS,
  EquipmentCategory,
  EquipmentItem,
  EquipmentStatus,
  FIELD_LIMITS,
  STATUS_LABELS,
  StorageLocation,
} from '../types/inventory';
import { EquipmentInput, validateEquipmentInput } from '../utils/inventoryLogic';

interface EquipmentModalProps {
  open: boolean;
  editingItem: EquipmentItem | null;
  existingEquipment: EquipmentItem[];
  locations: StorageLocation[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: EquipmentInput) => Promise<void>;
  onCreateLocationFirst: () => void;
}

export function EquipmentModal({
  open,
  editingItem,
  existingEquipment,
  locations,
  saving,
  onClose,
  onSubmit,
  onCreateLocationFirst,
}: EquipmentModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('tools');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minThreshold, setMinThreshold] = useState('1');
  const [unit, setUnit] = useState('ອັນ');
  const [status, setStatus] = useState<EquipmentStatus>('available');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setSku(editingItem.sku);
      setName(editingItem.name);
      setCategory(editingItem.category);
      setLocationId(editingItem.locationId);
      setQuantity(String(editingItem.quantity));
      setMinThreshold(String(editingItem.minThreshold));
      setUnit(editingItem.unit);
      setStatus(editingItem.status);
      setNotes(editingItem.notes);
    } else {
      const nextNum = existingEquipment.length + 101;
      setSku(`EQ-${nextNum}`);
      setName('');
      setCategory('tools');
      setLocationId(locations[0]?.id ?? '');
      setQuantity('1');
      setMinThreshold('1');
      setUnit('ອັນ');
      setStatus('available');
      setNotes('');
    }
    setErrors({});
    setSubmitError(null);
  }, [open, editingItem, existingEquipment.length, locations]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: EquipmentInput = {
      sku,
      name,
      category,
      locationId,
      quantity: quantity === '' ? NaN : Number(quantity),
      minThreshold: minThreshold === '' ? NaN : Number(minThreshold),
      unit,
      status,
      notes,
    };

    const result = validateEquipmentInput(
      payload,
      existingEquipment,
      locations,
      editingItem?.id,
    );

    if (!result.valid) {
      setErrors(result.errors as Record<string, string>);
      return;
    }

    setErrors({});
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipment-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 id="equipment-modal-title" className="text-base font-bold text-slate-900">
            {editingItem ? 'ແກ້ໄຂຂໍ້ມູນອຸປະກອນ' : 'ເພີ່ມອຸປະກອນໃໝ່'}
          </h2>
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

        {locations.length === 0 ? (
          <div className="p-6 space-y-4 text-center">
            <p className="text-sm text-slate-700">
              ກະລຸນາສ້າງບ່ອນເກັບມ້ຽນ (ເຊັ່ນ: ຕູ້ ຫຼື ຊັ້ນວາງ) ຢ່າງໜ້ອຍ 1 ບ່ອນກ່ອນເພີ່ມອຸປະກອນ.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={onCreateLocationFirst}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                ສ້າງບ່ອນເກັບມ້ຽນເລີຍ
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="eq-sku" className="block text-xs font-medium text-slate-700 mb-1">
                  ລະຫັດ SKU <span className="text-red-600">*</span>
                </label>
                <input
                  id="eq-sku"
                  type="text"
                  value={sku}
                  maxLength={FIELD_LIMITS.skuMax}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="ເຊັ່ນ TLS-101"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="eq-name" className="block text-xs font-medium text-slate-700 mb-1">
                  ຊື່ອຸປະກອນ <span className="text-red-600">*</span>
                </label>
                <input
                  id="eq-name"
                  type="text"
                  value={name}
                  maxLength={FIELD_LIMITS.equipmentNameMax}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ເຊັ່ນ ສະຫວ່ານໄຟຟ້າ Makita 18V"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eq-category" className="block text-xs font-medium text-slate-700 mb-1">
                  ໝວດໝູ່
                </label>
                <select
                  id="eq-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {(Object.keys(CATEGORY_LABELS) as EquipmentCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="eq-location" className="block text-xs font-medium text-slate-700 mb-1">
                  ບ່ອນເກັບມ້ຽນ <span className="text-red-600">*</span>
                </label>
                <select
                  id="eq-location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} — {loc.name}
                    </option>
                  ))}
                </select>
                {errors.locationId && (
                  <p className="mt-1 text-xs text-red-600">{errors.locationId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="eq-qty" className="block text-xs font-medium text-slate-700 mb-1">
                  ຈຳນວນ <span className="text-red-600">*</span>
                </label>
                <input
                  id="eq-qty"
                  type="number"
                  min={0}
                  max={FIELD_LIMITS.quantityMax}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label htmlFor="eq-min" className="block text-xs font-medium text-slate-700 mb-1">
                  ແຈ້ງເຕືອນຂັ້ນຕ່ຳ
                </label>
                <input
                  id="eq-min"
                  type="number"
                  min={0}
                  max={FIELD_LIMITS.quantityMax}
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.minThreshold && (
                  <p className="mt-1 text-xs text-red-600">{errors.minThreshold}</p>
                )}
              </div>

              <div>
                <label htmlFor="eq-unit" className="block text-xs font-medium text-slate-700 mb-1">
                  ໜ່ວຍນັບ <span className="text-red-600">*</span>
                </label>
                <input
                  id="eq-unit"
                  type="text"
                  list="unit-suggestions"
                  maxLength={FIELD_LIMITS.unitMax}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <datalist id="unit-suggestions">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
                {errors.unit && <p className="mt-1 text-xs text-red-600">{errors.unit}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="eq-status" className="block text-xs font-medium text-slate-700 mb-1">
                ສະຖານະອຸປະກອນ
              </label>
              <select
                id="eq-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {(Object.keys(STATUS_LABELS) as EquipmentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="eq-notes" className="block text-xs font-medium text-slate-700 mb-1">
                ໝາຍເຫດ / ລາຍລະອຽດເພີ່ມເຕີມ
              </label>
              <textarea
                id="eq-notes"
                rows={2}
                maxLength={FIELD_LIMITS.notesMax}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ລະບຸລຸ້ນ, ອຸປະກອນເສີມ, ຫຼື ຂໍ້ຄວນລະວັງ..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
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
                {saving
                  ? 'ກຳລັງບັນທຶກ...'
                  : editingItem
                    ? 'ບັນທຶກການແກ້ໄຂ'
                    : 'ບັນທຶກອຸປະກອນ'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
