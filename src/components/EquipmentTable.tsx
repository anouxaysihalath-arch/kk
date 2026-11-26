import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  EquipmentItem,
  STATUS_LABELS,
  StorageLocation,
} from '../types/inventory';
import { isLowStock } from '../utils/inventoryLogic';

interface EquipmentTableProps {
  items: EquipmentItem[];
  locations: StorageLocation[];
  loading: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onAddEquipment: () => void;
  onOpenMovement: (item: EquipmentItem) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
}

function StatusDisplay({ item }: { item: EquipmentItem }) {
  const low = isLowStock(item);
  if (item.status === 'maintenance') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <Wrench className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{STATUS_LABELS.maintenance}</span>
      </span>
    );
  }
  if (item.status === 'checked_out') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{STATUS_LABELS.checked_out}</span>
      </span>
    );
  }
  if (low) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>ສະຕັອກໃກ້ໝົດ</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{STATUS_LABELS.available}</span>
    </span>
  );
}

export function EquipmentTable({
  items,
  locations,
  loading,
  hasActiveFilters,
  onResetFilters,
  onAddEquipment,
  onOpenMovement,
  onEdit,
  onDelete,
}: EquipmentTableProps) {
  const locationMap = new Map(locations.map((loc) => [loc.id, loc]));

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" aria-busy="true">
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="px-4 py-3.5 flex items-center gap-4 animate-pulse">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 flex-1 bg-slate-200 rounded" />
              <div className="h-4 w-28 bg-slate-200 rounded hidden sm:block" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-900">
          {hasActiveFilters
            ? 'ບໍ່ພົບອຸປະກອນທີ່ຕົງກັບເງື່ອນໄຂການຄົ້ນຫາ'
            : 'ຍັງບໍ່ມີລາຍການອຸປະກອນໃນຄັງເທື່ອ'}
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {hasActiveFilters
            ? 'ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ລ້າງຕົວກອງເພື່ອສະແດງອຸປະກອນທັງໝົດ.'
            : 'ເລີ່ມຕົ້ນດ້ວຍການເພີ່ມອຸປະກອນໃໝ່ ແລະ ກຳນົດບ່ອນເກັບມ້ຽນ.'}
        </p>
        <div className="pt-1">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ລ້າງຕົວກອງ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddEquipment}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ເພີ່ມອຸປະກອນທຳອິດ</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Desktop High-Density Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4 whitespace-nowrap">ລະຫັດ SKU</th>
              <th className="py-3 px-4">ຊື່ອຸປະກອນ & ໝວດໝູ່</th>
              <th className="py-3 px-4 whitespace-nowrap">ບ່ອນເກັບມ້ຽນ</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">ຄົງເຫຼືອ</th>
              <th className="py-3 px-4 whitespace-nowrap">ສະຖານະ</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">ຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((item) => {
              const loc = locationMap.get(item.locationId);
              const low = isLowStock(item);
              return (
                <tr
                  key={item.id}
                  data-testid={`equipment-row-${item.id}`}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap align-top">
                    {item.sku}
                  </td>
                  <td className="py-3 px-4 align-top max-w-sm">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{CATEGORY_LABELS[item.category]}</span>
                      {item.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-xs">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    {loc ? (
                      <div className="text-xs">
                        <span className="font-mono font-medium text-slate-700">{loc.code}</span>
                        <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
                        <span className="text-slate-600">{loc.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">ບໍ່ລະບຸ</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        low ? 'text-amber-700' : 'text-slate-900'
                      }`}
                    >
                      {item.quantity.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                    {item.minThreshold > 0 && (
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        ຂັ້ນຕ່ຳ {item.minThreshold}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    <StatusDisplay item={item} />
                  </td>
                  <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenMovement(item)}
                        aria-label={`ເບີກ ຫຼື ຮັບຄືນ ${item.name}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>ເບີກ/ຮັບ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        aria-label={`ແກ້ໄຂ ${item.name}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        aria-label={`ລຶບ ${item.name}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Clean List */}
      <div className="md:hidden divide-y divide-slate-100">
        {items.map((item) => {
          const loc = locationMap.get(item.locationId);
          return (
            <div key={item.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-mono text-slate-500">{item.sku}</div>
                  <div className="font-semibold text-sm text-slate-900">{item.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-bold tabular-nums text-slate-900">
                    {item.quantity} {item.unit}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span>{CATEGORY_LABELS[item.category]}</span>
                <span aria-hidden="true">·</span>
                <span>{loc ? `${loc.code} (${loc.name})` : 'ບໍ່ລະບຸ'}</span>
                <span aria-hidden="true">·</span>
                <StatusDisplay item={item} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenMovement(item)}
                  aria-label={`ເບີກ ຫຼື ຮັບຄືນ ${item.name}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>ເບີກ/ຮັບຄືນ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  aria-label={`ແກ້ໄຂ ${item.name}`}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  ແກ້ໄຂ
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  aria-label={`ລຶບ ${item.name}`}
                  className="p-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
