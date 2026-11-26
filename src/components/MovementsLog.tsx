import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { MOVEMENT_ACTION_LABELS, MovementRecord } from '../types/inventory';

interface MovementsLogProps {
  movements: MovementRecord[];
  loading: boolean;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

export function MovementsLog({ movements, loading }: MovementsLogProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-5 bg-slate-200 rounded w-full" />
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-900">ຍັງບໍ່ມີປະຫວັດການເຄື່ອນໄຫວ</p>
        <p className="text-xs text-slate-500">
          ເມື່ອທ່ານເບີກອອກ, ຮັບຄືນ, ຫຼື ປັບຍອດສະຕັອກອຸປະກອນ ບັນທຶກຈະສະແດງຢູ່ບ່ອນນີ້.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
              <th className="py-3 px-4 whitespace-nowrap">ວັນເວລາ</th>
              <th className="py-3 px-4 whitespace-nowrap">ປະເພດ</th>
              <th className="py-3 px-4">ອຸປະກອນ</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">ຈຳນວນປ່ຽນແປງ</th>
              <th className="py-3 px-4 whitespace-nowrap">ຜູ້ດຳເນີນການ</th>
              <th className="py-3 px-4">ໝາຍເຫດ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {movements.map((mov) => {
              const isOut = mov.actionType === 'check_out';
              const isIn = mov.actionType === 'check_in';
              return (
                <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                    {formatDateTime(mov.createdAt)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        isOut
                          ? 'text-amber-700'
                          : isIn
                            ? 'text-emerald-700'
                            : 'text-slate-700'
                      }`}
                    >
                      {isOut ? (
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : isIn ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{MOVEMENT_ACTION_LABELS[mov.actionType]}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {mov.equipmentName}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                      mov.quantityDelta > 0
                        ? 'text-emerald-700'
                        : mov.quantityDelta < 0
                          ? 'text-amber-700'
                          : 'text-slate-600'
                    }`}
                  >
                    {mov.quantityDelta > 0 ? `+${mov.quantityDelta}` : mov.quantityDelta}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                    {mov.actorName}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                    {mov.note || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
