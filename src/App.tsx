import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Download, Menu, Plus, Search, UploadCloud, X } from 'lucide-react';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EquipmentModal } from './components/EquipmentModal';
import { EquipmentTable } from './components/EquipmentTable';
import { LocationModal } from './components/LocationModal';
import { LocationsGrid } from './components/LocationsGrid';
import { MetricsStrip } from './components/MetricsStrip';
import { MovementModal } from './components/MovementModal';
import { MovementsLog } from './components/MovementsLog';
import { Sidebar } from './components/Sidebar';
import { SEED_EQUIPMENT, SEED_LOCATIONS, SEED_MOVEMENTS } from './data/seedData';
import { auth, googleProvider } from './services/firebase';
import {
  createEquipmentInFirestore,
  createLocationInFirestore,
  deleteEquipmentInFirestore,
  deleteLocationInFirestore,
  importWorkspaceToFirestore,
  recordMovementBatchInFirestore,
  subscribeUserEquipment,
  subscribeUserLocations,
  subscribeUserMovements,
  updateEquipmentInFirestore,
  updateLocationInFirestore,
} from './services/firestoreInventory';
import {
  CATEGORY_LABELS,
  EquipmentCategory,
  EquipmentItem,
  InventoryStatusFilter,
  MovementActionType,
  MovementRecord,
  StorageLocation,
  WorkspaceView,
} from './types/inventory';
import {
  computeInventoryMetrics,
  computeLocationStats,
  EquipmentInput,
  filterEquipment,
  formatCsvExport,
  generateSafeId,
  LocationInput,
  MovementOutcome,
} from './utils/inventoryLogic';

const STORAGE_KEYS = {
  locations: 'khang_oukpakorn_locations_v1',
  equipment: 'khang_oukpakorn_equipment_v1',
  movements: 'khang_oukpakorn_movements_v1',
} as const;

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [localLocations, setLocalLocations] = useState<StorageLocation[]>(() =>
    loadLocal(STORAGE_KEYS.locations, SEED_LOCATIONS),
  );
  const [localEquipment, setLocalEquipment] = useState<EquipmentItem[]>(() =>
    loadLocal(STORAGE_KEYS.equipment, SEED_EQUIPMENT),
  );
  const [localMovements, setLocalMovements] = useState<MovementRecord[]>(() =>
    loadLocal(STORAGE_KEYS.movements, SEED_MOVEMENTS),
  );

  const [cloudLocations, setCloudLocations] = useState<StorageLocation[]>([]);
  const [cloudEquipment, setCloudEquipment] = useState<EquipmentItem[]>([]);
  const [cloudMovements, setCloudMovements] = useState<MovementRecord[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [importingToCloud, setImportingToCloud] = useState(false);

  const [activeView, setActiveView] = useState<WorkspaceView>('inventory');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>('all');

  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);

  const [movementTarget, setMovementTarget] = useState<EquipmentItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'equipment'; item: EquipmentItem }
    | { type: 'location'; location: StorageLocation; itemCount: number }
    | null
  >(null);

  const [saving, setSaving] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    saveLocal(STORAGE_KEYS.locations, localLocations);
  }, [localLocations]);

  useEffect(() => {
    saveLocal(STORAGE_KEYS.equipment, localEquipment);
  }, [localEquipment]);

  useEffect(() => {
    saveLocal(STORAGE_KEYS.movements, localMovements);
  }, [localMovements]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setCloudLocations([]);
      setCloudEquipment([]);
      setCloudMovements([]);
      setCloudLoading(false);
      return;
    }

    setCloudLoading(true);
    let readyCount = 0;
    const markReady = () => {
      readyCount += 1;
      if (readyCount >= 3) setCloudLoading(false);
    };

    const unsubLoc = subscribeUserLocations(
      user.uid,
      (items) => {
        setCloudLocations(items);
        markReady();
      },
      (err) => {
        setBannerError(err.message);
        setCloudLoading(false);
      },
    );

    const unsubEq = subscribeUserEquipment(
      user.uid,
      (items) => {
        setCloudEquipment(items);
        markReady();
      },
      (err) => {
        setBannerError(err.message);
        setCloudLoading(false);
      },
    );

    const unsubMov = subscribeUserMovements(
      user.uid,
      (items) => {
        setCloudMovements(items);
        markReady();
      },
      (err) => {
        setBannerError(err.message);
        setCloudLoading(false);
      },
    );

    return () => {
      unsubLoc();
      unsubEq();
      unsubMov();
    };
  }, [authReady, user]);

  const isCloudMode = Boolean(user);
  const locations = isCloudMode ? cloudLocations : localLocations;
  const equipment = isCloudMode ? cloudEquipment : localEquipment;
  const movements = isCloudMode ? cloudMovements : localMovements;
  const loading = isCloudMode && cloudLoading;

  const metrics = useMemo(
    () => computeInventoryMetrics(equipment, locations),
    [equipment, locations],
  );

  const filteredEquipment = useMemo(
    () =>
      filterEquipment(equipment, {
        search,
        category: categoryFilter,
        locationId: locationFilter,
        status: statusFilter,
      }),
    [equipment, search, categoryFilter, locationFilter, statusFilter],
  );

  const locationStats = useMemo(
    () => computeLocationStats(locations, equipment),
    [locations, equipment],
  );

  const hasActiveFilters =
    search.trim() !== '' ||
    categoryFilter !== 'all' ||
    locationFilter !== 'all' ||
    statusFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setBannerError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setBannerError(
        err instanceof Error
          ? `ບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້: ${err.message}`
          : 'ບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້',
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleImportSampleOrLocalToCloud = async () => {
    if (!user) return;
    setImportingToCloud(true);
    setBannerError(null);
    try {
      await importWorkspaceToFirestore(
        user.uid,
        localLocations,
        localEquipment,
        localMovements,
      );
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'ນຳເຂົ້າຂໍ້ມູນບໍ່ສຳເລັດ');
    } finally {
      setImportingToCloud(false);
    }
  };

  const handleSaveLocation = async (input: LocationInput) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (isCloudMode && user) {
        if (editingLocation) {
          await updateLocationInFirestore(user.uid, editingLocation.id, input);
        } else {
          await createLocationInFirestore(user.uid, generateSafeId('loc'), input);
        }
      } else {
        if (editingLocation) {
          setLocalLocations((prev) =>
            prev.map((loc) =>
              loc.id === editingLocation.id
                ? {
                    ...loc,
                    code: input.code.trim(),
                    name: input.name.trim(),
                    zoneType: input.zoneType,
                    capacity: Math.round(input.capacity),
                    description: input.description.trim(),
                    updatedAt: now,
                  }
                : loc,
            ),
          );
        } else {
          const newLoc: StorageLocation = {
            id: generateSafeId('loc'),
            ownerId: 'local',
            code: input.code.trim(),
            name: input.name.trim(),
            zoneType: input.zoneType,
            capacity: Math.round(input.capacity),
            description: input.description.trim(),
            createdAt: now,
            updatedAt: now,
          };
          setLocalLocations((prev) => [newLoc, ...prev]);
        }
      }
      setLocationModalOpen(false);
      setEditingLocation(null);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEquipment = async (input: EquipmentInput) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (isCloudMode && user) {
        if (editingEquipment) {
          await updateEquipmentInFirestore(user.uid, editingEquipment.id, input);
        } else {
          await createEquipmentInFirestore(user.uid, generateSafeId('eq'), input);
        }
      } else {
        if (editingEquipment) {
          setLocalEquipment((prev) =>
            prev.map((item) =>
              item.id === editingEquipment.id
                ? {
                    ...item,
                    sku: input.sku.trim(),
                    name: input.name.trim(),
                    category: input.category,
                    locationId: input.locationId,
                    quantity: Math.round(input.quantity),
                    minThreshold: Math.round(input.minThreshold),
                    unit: input.unit.trim(),
                    status: input.status,
                    notes: input.notes.trim(),
                    updatedAt: now,
                  }
                : item,
            ),
          );
        } else {
          const newItem: EquipmentItem = {
            id: generateSafeId('eq'),
            ownerId: 'local',
            sku: input.sku.trim(),
            name: input.name.trim(),
            category: input.category,
            locationId: input.locationId,
            quantity: Math.round(input.quantity),
            minThreshold: Math.round(input.minThreshold),
            unit: input.unit.trim(),
            status: input.status,
            notes: input.notes.trim(),
            createdAt: now,
            updatedAt: now,
          };
          setLocalEquipment((prev) => [newItem, ...prev]);
        }
      }
      setEquipmentModalOpen(false);
      setEditingEquipment(null);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordMovement = async (
    item: EquipmentItem,
    actionType: MovementActionType,
    actorName: string,
    note: string,
    outcome: MovementOutcome,
  ) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const movementId = generateSafeId('mov');
      if (isCloudMode && user) {
        await recordMovementBatchInFirestore(
          user.uid,
          item,
          movementId,
          {
            actionType,
            quantity: outcome.nextQuantity,
            actorName,
            note,
          },
          outcome.nextQuantity,
          outcome.quantityDelta,
          outcome.nextStatus,
        );
      } else {
        setLocalEquipment((prev) =>
          prev.map((eq) =>
            eq.id === item.id
              ? {
                  ...eq,
                  quantity: outcome.nextQuantity,
                  status: outcome.nextStatus,
                  updatedAt: now,
                }
              : eq,
          ),
        );
        const newMovement: MovementRecord = {
          id: movementId,
          ownerId: 'local',
          equipmentId: item.id,
          equipmentName: item.name,
          actionType,
          quantityDelta: outcome.quantityDelta,
          actorName: actorName.trim(),
          note: note.trim(),
          createdAt: now,
        };
        setLocalMovements((prev) => [newMovement, ...prev]);
      }
      setMovementTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === 'equipment') {
        if (isCloudMode && user) {
          await deleteEquipmentInFirestore(user.uid, deleteTarget.item.id);
        } else {
          setLocalEquipment((prev) => prev.filter((e) => e.id !== deleteTarget.item.id));
        }
      } else {
        if (deleteTarget.itemCount > 0) return;
        if (isCloudMode && user) {
          await deleteLocationInFirestore(user.uid, deleteTarget.location.id);
        } else {
          setLocalLocations((prev) => prev.filter((l) => l.id !== deleteTarget.location.id));
          if (locationFilter === deleteTarget.location.id) {
            setLocationFilter('all');
          }
        }
      }
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    const csv = formatCsvExport(filteredEquipment, locations);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `khang-oukpakorn-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const viewTitle =
    activeView === 'inventory'
      ? 'ພາບລວມ & ອຸປະກອນ'
      : activeView === 'locations'
        ? 'ບ່ອນເກັບມ້ຽນ'
        : 'ປະຫວັດເຄື່ອນໄຫວ';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        counts={{
          equipment: equipment.length,
          locations: locations.length,
          movements: movements.length,
        }}
        user={user ? { displayName: user.displayName, email: user.email } : null}
        authLoading={authLoading}
        onSignIn={() => void handleSignIn()}
        onSignOut={() => void handleSignOut()}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="ເປີດເມນູ"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">ຄັງອຸປະກອນ</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">/</span>
              <h1 className="font-semibold text-slate-900 truncate">{viewTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeView === 'inventory' && (
              <button
                type="button"
                onClick={() => {
                  setEditingEquipment(null);
                  setEquipmentModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>ເພີ່ມອຸປະກອນ</span>
              </button>
            )}

            {activeView === 'locations' && (
              <button
                type="button"
                onClick={() => {
                  setEditingLocation(null);
                  setLocationModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>ສ້າງບ່ອນເກັບ</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">
          {bannerError && (
            <div
              role="alert"
              className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800"
            >
              <span>{bannerError}</span>
              <button
                type="button"
                onClick={() => setBannerError(null)}
                aria-label="ປິດການແຈ້ງເຕືອນ"
                className="p-1 hover:bg-red-100 rounded cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {isCloudMode && !cloudLoading && locations.length === 0 && equipment.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-slate-900">
                  ບັນຊີ Cloud ຂອງທ່ານຍັງວ່າງຢູ່
                </h2>
                <p className="text-xs text-slate-500">
                  ທ່ານສາມາດນຳເຂົ້າຂໍ້ມູນອຸປະກອນ ແລະ ບ່ອນເກັບມ້ຽນຈາກເຄື່ອງນີ້ຂຶ້ນ Cloud ໄດ້ທັນທີ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleImportSampleOrLocalToCloud()}
                disabled={importingToCloud}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <UploadCloud className="w-4 h-4" aria-hidden="true" />
                <span>{importingToCloud ? 'ກຳລັງນຳເຂົ້າ...' : 'ນຳເຂົ້າຂໍ້ມູນເຂົ້າ Cloud'}</span>
              </button>
            </div>
          )}

          {activeView === 'inventory' && (
            <>
              <MetricsStrip
                metrics={metrics}
                onFilterLowStock={() =>
                  setStatusFilter((prev) => (prev === 'low_stock' ? 'all' : 'low_stock'))
                }
                onOpenLocations={() => setActiveView('locations')}
              />

              <section aria-label="ຕົວກອງອຸປະກອນ" className="space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      aria-label="ຄົ້ນຫາອຸປະກອນ"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ຄົ້ນຫາຊື່ອຸປະກອນ, ລະຫັດ SKU, ຫຼື ໝາຍເຫດ..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="ກອງຕາມບ່ອນເກັບມ້ຽນ"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">ບ່ອນເກັບ: ທັງໝົດ</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.code} — {loc.name}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="ກອງຕາມສະຖານະ"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as InventoryStatusFilter)}
                      className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">ສະຖານະ: ທັງໝົດ</option>
                      <option value="available">ພ້ອມໃຊ້ງານ</option>
                      <option value="checked_out">ກຳລັງຢືມ</option>
                      <option value="maintenance">ຕ້ອງສ້ອມແປງ</option>
                      <option value="low_stock">ສະຕັອກໃກ້ໝົດ</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={filteredEquipment.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>ສົ່ງອອກ CSV</span>
                    </button>
                  </div>
                </div>

                <div
                  role="tablist"
                  aria-label="ກອງຕາມໝວດໝູ່"
                  className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={categoryFilter === 'all'}
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      categoryFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ທັງໝົດ ({equipment.length})
                  </button>
                  {(Object.keys(CATEGORY_LABELS) as EquipmentCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={categoryFilter === cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        categoryFilter === cat
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </section>

              <EquipmentTable
                items={filteredEquipment}
                locations={locations}
                loading={loading}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
                onAddEquipment={() => {
                  setEditingEquipment(null);
                  setEquipmentModalOpen(true);
                }}
                onOpenMovement={(item) => setMovementTarget(item)}
                onEdit={(item) => {
                  setEditingEquipment(item);
                  setEquipmentModalOpen(true);
                }}
                onDelete={(item) => setDeleteTarget({ type: 'equipment', item })}
              />
            </>
          )}

          {activeView === 'locations' && (
            <LocationsGrid
              stats={locationStats}
              onSelectLocationFilter={(locId) => {
                setLocationFilter(locId);
                setActiveView('inventory');
              }}
              onAddLocation={() => {
                setEditingLocation(null);
                setLocationModalOpen(true);
              }}
              onEditLocation={(location) => {
                setEditingLocation(location);
                setLocationModalOpen(true);
              }}
              onDeleteLocation={(location, itemCount) =>
                setDeleteTarget({ type: 'location', location, itemCount })
              }
            />
          )}

          {activeView === 'movements' && (
            <MovementsLog movements={movements} loading={loading} />
          )}
        </main>
      </div>

      <EquipmentModal
        open={equipmentModalOpen}
        editingItem={editingEquipment}
        existingEquipment={equipment}
        locations={locations}
        saving={saving}
        onClose={() => {
          setEquipmentModalOpen(false);
          setEditingEquipment(null);
        }}
        onSubmit={handleSaveEquipment}
        onCreateLocationFirst={() => {
          setEquipmentModalOpen(false);
          setEditingLocation(null);
          setLocationModalOpen(true);
        }}
      />

      <LocationModal
        open={locationModalOpen}
        editingLocation={editingLocation}
        existingLocations={locations}
        saving={saving}
        onClose={() => {
          setLocationModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={handleSaveLocation}
      />

      <MovementModal
        open={Boolean(movementTarget)}
        item={movementTarget}
        saving={saving}
        onClose={() => setMovementTarget(null)}
        onSubmit={handleRecordMovement}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'equipment'
            ? `ລຶບອຸປະກອນ "${deleteTarget.item.name}"?`
            : deleteTarget?.type === 'location'
              ? `ລຶບບ່ອນເກັບ "${deleteTarget.location.name}"?`
              : ''
        }
        description={
          deleteTarget?.type === 'equipment'
            ? 'ການລຶບນີ້ຈະເອົາອຸປະກອນອອກຈາກລາຍການຄັງປັດຈຸບັນ ແລະ ບໍ່ສາມາດກູ້ຄືນໄດ້.'
            : 'ການລຶບບ່ອນເກັບຈະເອົາຕູ້ ຫຼື ຊັ້ນວາງນີ້ອອກຈາກລະບົບ.'
        }
        blockedMessage={
          deleteTarget?.type === 'location' && deleteTarget.itemCount > 0
            ? `ບໍ່ສາມາດລຶບໄດ້ ເພາະຍັງມີອຸປະກອນ ${deleteTarget.itemCount} ລາຍການເກັບຢູ່ໃນຈຸດນີ້. ກະລຸນາຍ້າຍ ຫຼື ລຶບອຸປະກອນອອກກ່ອນ.`
            : null
        }
        deleting={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
