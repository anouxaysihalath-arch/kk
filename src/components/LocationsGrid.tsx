import { Archive, Box, Layers, MapPin, Pencil, Plus, Trash2, Warehouse } from 'lucide-react';
import { StorageLocation, ZONE_TYPE_LABELS, ZoneType } from '../types/inventory';
import { LocationStats } from '../utils/inventoryLogic';

interface LocationsGridProps {
  stats: LocationStats[];
  onSelectLocationFilter: (locationId: string) => void;
  onAddLocation: () => void;
  onEditLocation: (location: StorageLocation) => void;
  onDeleteLocation: (location: StorageLocation, itemCount: number) => void;
}

function ZoneIcon({ zoneType }: { zoneType: ZoneType }) {
  switch (zoneType) {
    case 'cabinet':
      return <Archive className="w-4 h-4 text-slate-600" aria-hidden="true" />;
    case 'shelf':
      return <Layers className="w-4 h-4 text-slate-600" aria-hidden="true" />;
    case 'room':
      return <Warehouse className="w-4 h-4 text-slate-600" aria-hidden="true" />;
    case 'box':
      return <Box className="w-4 h-4 text-slate-600" aria-hidden="true" />;
  }
}

export function LocationsGrid({
  stats,
  onSelectLocationFilter,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
}: LocationsGridProps) {
  if (stats.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
        <MapPin className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-900">ຍັງບໍ່ມີບ່ອນເກັບມ້ຽນ</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ສ້າງຕູ້ເກັບ, ຊັ້ນວາງ, ຫຼື ຫ້ອງສາງກ່ອນ ເພື່ອຈັດລະບຽບອຸປະກອນຂອງທ່ານໃຫ້ຊອກຫາງ່າຍ.
        </p>
        <div className="pt-1">
          <button
            type="button"
            onClick={onAddLocation}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>ສ້າງບ່ອນເກັບທຳອິດ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {stats.map(({ location, itemCount, totalUnits, utilizationPercent }) => (
        <article
          key={location.id}
          data-testid={`location-card-${location.id}`}
          className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ZoneIcon zoneType={location.zoneType} />
                  <span className="font-mono font-semibold text-slate-700">{location.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ZONE_TYPE_LABELS[location.zoneType]}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-1 truncate">
                  {location.name}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditLocation(location)}
                  aria-label={`ແກ້ໄຂບ່ອນເກັບ ${location.name}`}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteLocation(location, itemCount)}
                  aria-label={`ລຶບບ່ອນເກັບ ${location.name}`}
                  className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {location.description && (
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {location.description}
              </p>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  ບັນຈຸ <strong className="font-mono tabular-nums text-slate-900">{itemCount}</strong> ລາຍການ ·{' '}
                  <strong className="font-mono tabular-nums text-slate-900">{totalUnits.toLocaleString()}</strong> ໜ່ວຍ
                </span>
                <span className="font-mono tabular-nums text-slate-500">
                  {totalUnits} / {location.capacity}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    utilizationPercent >= 90
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${utilizationPercent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectLocationFilter(location.id)}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
            >
              ເບິ່ງອຸປະກອນໃນຈຸດນີ້ ({itemCount})
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
