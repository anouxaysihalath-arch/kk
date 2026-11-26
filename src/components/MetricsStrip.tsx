import { AlertTriangle, CheckCircle2, MapPin, Package } from 'lucide-react';
import { InventoryMetrics } from '../utils/inventoryLogic';

interface MetricsStripProps {
  metrics: InventoryMetrics;
  onFilterLowStock: () => void;
  onOpenLocations: () => void;
}

export function MetricsStrip({
  metrics,
  onFilterLowStock,
  onOpenLocations,
}: MetricsStripProps) {
  return (
    <section
      aria-label="ສະຫຼຸບຂໍ້ມູນຄັງອຸປະກອນ"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>ອຸປະກອນທັງໝົດ</span>
          <Package className="w-4 h-4 text-slate-400" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics.totalTypes.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            ລາຍການ · {metrics.totalUnits.toLocaleString()} ໜ່ວຍ
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>ພ້ອມໃຊ້ງານ</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics.availableTypes.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">ລາຍການປົກກະຕິ</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onFilterLowStock}
        className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4 flex flex-col justify-between gap-2 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between w-full text-xs font-medium text-slate-500">
          <span>ໃກ້ໝົດ / ຕ້ອງກວດສອບ</span>
          <AlertTriangle
            className={`w-4 h-4 ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold font-mono tabular-nums ${
              metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {metrics.lowStockCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            ສ້ອມແປງ {metrics.maintenanceCount}
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenLocations}
        className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col justify-between gap-2 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between w-full text-xs font-medium text-slate-500">
          <span>ບ່ອນເກັບມ້ຽນ</span>
          <MapPin className="w-4 h-4 text-blue-600" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {metrics.locationCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">ຈຸດຈັດເກັບ</span>
        </div>
      </button>
    </section>
  );
}
