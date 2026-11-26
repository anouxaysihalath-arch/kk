import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  FIELD_LIMITS,
  StorageLocation,
  ZONE_TYPE_LABELS,
  ZoneType,
} from '../types/inventory';
import { LocationInput, validateLocationInput } from '../utils/inventoryLogic';

interface LocationModalProps {
  open: boolean;
  editingLocation: StorageLocation | null;
  existingLocations: StorageLocation[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: LocationInput) => Promise<void>;
}

export function LocationModal({
  open,
  editingLocation,
  existingLocations,
  saving,
  onClose,
  onSubmit,
}: LocationModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<ZoneType>('cabinet');
  const [capacity, setCapacity] = useState('40');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingLocation) {
      setCode(editingLocation.code);
      setName(editingLocation.name);
      setZoneType(editingLocation.zoneType);
      setCapacity(String(editingLocation.capacity));
      setDescription(editingLocation.description);
    } else {
      setCode('');
      setName('');
      setZoneType('cabinet');
      setCapacity('40');
      setDescription('');
    }
    setErrors({});
    setSubmitError(null);
  }, [open, editingLocation]);

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

    const payload: LocationInput = {
      code,
      name,
      zoneType,
      capacity: capacity === '' ? NaN : Number(capacity),
      description,
    };

    const result = validateLocationInput(payload, existingLocations, editingLocation?.id);
    if (!result.valid) {
      setErrors(result.errors as Record<string, string>);
      return;
    }

    setErrors({});
    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'ບໍ່ສາມາດບັນທຶກບ່ອນເກັບມ້ຽນໄດ້');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 id="location-modal-title" className="text-base font-bold text-slate-900">
            {editingLocation ? 'ແກ້ໄຂບ່ອນເກັບມ້ຽນ' : 'ສ້າງບ່ອນເກັບມ້ຽນໃໝ່'}
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

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="loc-code" className="block text-xs font-medium text-slate-700 mb-1">
                ລະຫັດ <span className="text-red-600">*</span>
              </label>
              <input
                id="loc-code"
                type="text"
                maxLength={FIELD_LIMITS.locationCodeMax}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="A-01"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="loc-name" className="block text-xs font-medium text-slate-700 mb-1">
                ຊື່ບ່ອນເກັບ <span className="text-red-600">*</span>
              </label>
              <input
                id="loc-name"
                type="text"
                maxLength={FIELD_LIMITS.locationNameMax}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ເຊັ່ນ ຕູ້ເຄື່ອງມືຊັ້ນ 1"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="loc-type" className="block text-xs font-medium text-slate-700 mb-1">
                ປະເພດບ່ອນເກັບ
              </label>
              <select
                id="loc-type"
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value as ZoneType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {(Object.keys(ZONE_TYPE_LABELS) as ZoneType[]).map((zt) => (
                  <option key={zt} value={zt}>
                    {ZONE_TYPE_LABELS[zt]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="loc-capacity" className="block text-xs font-medium text-slate-700 mb-1">
                ຄວາມຈຸສູງສຸດ (ໜ່ວຍ)
              </label>
              <input
                id="loc-capacity"
                type="number"
                min={FIELD_LIMITS.capacityMin}
                max={FIELD_LIMITS.capacityMax}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.capacity && (
                <p className="mt-1 text-xs text-red-600">{errors.capacity}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="loc-desc" className="block text-xs font-medium text-slate-700 mb-1">
              ລາຍລະອຽດ
            </label>
            <textarea
              id="loc-desc"
              rows={2}
              maxLength={FIELD_LIMITS.locationDescMax}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ລະບຸຕຳແໜ່ງຫ້ອງ ຫຼື ປະເພດອຸປະກອນທີ່ເກັບ..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
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
                : editingLocation
                  ? 'ບັນທຶກການແກ້ໄຂ'
                  : 'ສ້າງບ່ອນເກັບມ້ຽນ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
