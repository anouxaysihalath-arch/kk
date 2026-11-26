import {
  Archive,
  ArrowLeftRight,
  Cloud,
  HardDrive,
  LogIn,
  LogOut,
  MapPin,
  Package,
  X,
} from 'lucide-react';
import { WorkspaceView } from '../types/inventory';

interface SidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  counts: {
    equipment: number;
    locations: number;
    movements: number;
  };
  user: {
    displayName: string | null;
    email: string | null;
  } | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  counts,
  user,
  authLoading,
  onSignIn,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: {
    id: WorkspaceView;
    label: string;
    count: number;
    icon: typeof Package;
  }[] = [
    { id: 'inventory', label: 'ພາບລວມ & ອຸປະກອນ', count: counts.equipment, icon: Package },
    { id: 'locations', label: 'ບ່ອນເກັບມ້ຽນ', count: counts.locations, icon: MapPin },
    { id: 'movements', label: 'ປະຫວັດເຄື່ອນໄຫວ', count: counts.movements, icon: ArrowLeftRight },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 shrink-0">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
            ຄັງອຸປະກອນ
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="ປິດເມນູ"
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="ເມນູຫຼັກ" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0 truncate">
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              <span
                className={`text-xs font-mono tabular-nums shrink-0 ${
                  isActive ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.displayName || 'ບັນຊີ Google'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              disabled={authLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ອອກຈາກລະບົບ</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <HardDrive className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
              <span className="leading-snug">
                ບັນທຶກໃນເຄື່ອງ · ເຂົ້າສູ່ລະບົບເພື່ອຊິ້ງຂໍ້ມູນຂຶ້ນ Cloud
              </span>
            </div>
            <button
              type="button"
              onClick={onSignIn}
              disabled={authLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{authLoading ? 'ກຳລັງເຊື່ອມຕໍ່...' : 'ເຊື່ອມຕໍ່ Google Cloud'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <button
            type="button"
            aria-label="ປິດພື້ນຫຼັງເມນູ"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40"
          />
          <div className="relative z-10 flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
