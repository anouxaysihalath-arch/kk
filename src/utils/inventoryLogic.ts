import {
  EquipmentCategory,
  EquipmentItem,
  EquipmentStatus,
  FIELD_LIMITS,
  InventoryStatusFilter,
  MovementActionType,
  StorageLocation,
  ZoneType,
} from '../types/inventory';

export interface LocationInput {
  code: string;
  name: string;
  zoneType: ZoneType;
  capacity: number;
  description: string;
}

export interface EquipmentInput {
  sku: string;
  name: string;
  category: EquipmentCategory;
  locationId: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  status: EquipmentStatus;
  notes: string;
}

export interface MovementInput {
  actionType: MovementActionType;
  quantity: number;
  actorName: string;
  note: string;
}

export interface ValidationResult<T extends string = string> {
  valid: boolean;
  errors: Partial<Record<T, string>>;
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'item';
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${cleanPrefix}_${ts}_${rand}`;
}

export function validateLocationInput(
  input: LocationInput,
  existingLocations: StorageLocation[],
  editingId?: string,
): ValidationResult<'code' | 'name' | 'zoneType' | 'capacity' | 'description'> {
  const errors: Partial<Record<'code' | 'name' | 'zoneType' | 'capacity' | 'description', string>> = {};
  const code = input.code.trim();
  const name = input.name.trim();
  const desc = input.description.trim();

  if (!code) {
    errors.code = 'ກະລຸນາປ້ອນລະຫັດບ່ອນເກັບ (ຕົວຢ່າງ: A-01)';
  } else if (code.length > FIELD_LIMITS.locationCodeMax) {
    errors.code = `ລະຫັດຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.locationCodeMax} ຕົວອັກສອນ`;
  } else {
    const duplicate = existingLocations.find(
      (loc) => loc.id !== editingId && loc.code.trim().toLowerCase() === code.toLowerCase(),
    );
    if (duplicate) {
      errors.code = `ລະຫັດ "${code}" ມີຢູ່ໃນລະບົບແລ້ວ`;
    }
  }

  if (!name) {
    errors.name = 'ກະລຸນາປ້ອນຊື່ບ່ອນເກັບມ້ຽນ';
  } else if (name.length > FIELD_LIMITS.locationNameMax) {
    errors.name = `ຊື່ບ່ອນເກັບຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.locationNameMax} ຕົວອັກສອນ`;
  }

  if (!Number.isFinite(input.capacity) || input.capacity < FIELD_LIMITS.capacityMin || input.capacity > FIELD_LIMITS.capacityMax) {
    errors.capacity = `ຄວາມຈຸຕ້ອງຢູ່ລະຫວ່າງ ${FIELD_LIMITS.capacityMin} ຫາ ${FIELD_LIMITS.capacityMax.toLocaleString()}`;
  }

  if (desc.length > FIELD_LIMITS.locationDescMax) {
    errors.description = `ລາຍລະອຽດຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.locationDescMax} ຕົວອັກສອນ`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateEquipmentInput(
  input: EquipmentInput,
  existingEquipment: EquipmentItem[],
  locations: StorageLocation[],
  editingId?: string,
): ValidationResult<'sku' | 'name' | 'locationId' | 'quantity' | 'minThreshold' | 'unit' | 'notes'> {
  const errors: Partial<Record<'sku' | 'name' | 'locationId' | 'quantity' | 'minThreshold' | 'unit' | 'notes', string>> = {};
  const sku = input.sku.trim();
  const name = input.name.trim();
  const unit = input.unit.trim();
  const notes = input.notes.trim();

  if (!sku) {
    errors.sku = 'ກະລຸນາປ້ອນລະຫັດອຸປະກອນ (SKU)';
  } else if (sku.length > FIELD_LIMITS.skuMax) {
    errors.sku = `ລະຫັດ SKU ຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.skuMax} ຕົວອັກສອນ`;
  } else {
    const duplicate = existingEquipment.find(
      (item) => item.id !== editingId && item.sku.trim().toLowerCase() === sku.toLowerCase(),
    );
    if (duplicate) {
      errors.sku = `ລະຫັດ SKU "${sku}" ຖືກໃຊ້ໄປແລ້ວ`;
    }
  }

  if (!name) {
    errors.name = 'ກະລຸນາປ້ອນຊື່ອຸປະກອນ';
  } else if (name.length > FIELD_LIMITS.equipmentNameMax) {
    errors.name = `ຊື່ອຸປະກອນຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.equipmentNameMax} ຕົວອັກສອນ`;
  }

  if (!input.locationId || !locations.some((loc) => loc.id === input.locationId)) {
    errors.locationId = 'ກະລຸນາເລືອກບ່ອນເກັບມ້ຽນທີ່ຖືກຕ້ອງ';
  }

  if (!Number.isFinite(input.quantity) || input.quantity < 0 || input.quantity > FIELD_LIMITS.quantityMax) {
    errors.quantity = 'ຈຳນວນຕ້ອງເປັນຕົວເລກ 0 ຂຶ້ນໄປ';
  }

  if (!Number.isFinite(input.minThreshold) || input.minThreshold < 0 || input.minThreshold > FIELD_LIMITS.quantityMax) {
    errors.minThreshold = 'ຈຳນວນແຈ້ງເຕືອນຂັ້ນຕ່ຳຕ້ອງເປັນ 0 ຂຶ້ນໄປ';
  }

  if (!unit) {
    errors.unit = 'ກະລຸນາລະບຸໜ່ວຍນັບ (ເຊັ່ນ: ອັນ, ຊຸດ)';
  } else if (unit.length > FIELD_LIMITS.unitMax) {
    errors.unit = `ໜ່ວຍນັບຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.unitMax} ຕົວອັກສອນ`;
  }

  if (notes.length > FIELD_LIMITS.notesMax) {
    errors.notes = `ໝາຍເຫດຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.notesMax} ຕົວອັກສອນ`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface MovementOutcome extends ValidationResult<'quantity' | 'actorName' | 'note'> {
  nextQuantity: number;
  quantityDelta: number;
  nextStatus: EquipmentStatus;
}

export function evaluateMovement(input: MovementInput, equipment: EquipmentItem): MovementOutcome {
  const errors: Partial<Record<'quantity' | 'actorName' | 'note', string>> = {};
  const actorName = input.actorName.trim();
  const note = input.note.trim();
  const qty = Number(input.quantity);

  if (!actorName) {
    errors.actorName = 'ກະລຸນາປ້ອນຊື່ຜູ້ເບີກ ຫຼື ຜູ້ຮັບຜິດຊອບ';
  } else if (actorName.length > FIELD_LIMITS.actorNameMax) {
    errors.actorName = `ຊື່ຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.actorNameMax} ຕົວອັກສອນ`;
  }

  if (note.length > FIELD_LIMITS.movementNoteMax) {
    errors.note = `ໝາຍເຫດຕ້ອງບໍ່ເກີນ ${FIELD_LIMITS.movementNoteMax} ຕົວອັກສອນ`;
  }

  let nextQuantity = equipment.quantity;
  let quantityDelta = 0;
  let nextStatus: EquipmentStatus = equipment.status;

  if (!Number.isFinite(qty) || !Number.isInteger(qty)) {
    errors.quantity = 'ກະລຸນາປ້ອນຈຳນວນເປັນຕົວເລກຖ້ວນ';
  } else if (input.actionType === 'check_out') {
    if (qty <= 0) {
      errors.quantity = 'ຈຳນວນທີ່ເບີກອອກຕ້ອງຫຼາຍກວ່າ 0';
    } else if (qty > equipment.quantity) {
      errors.quantity = `ສະຕັອກບໍ່ພຽງພໍ (ຄົງເຫຼືອ ${equipment.quantity} ${equipment.unit})`;
    } else {
      nextQuantity = equipment.quantity - qty;
      quantityDelta = -qty;
      nextStatus = nextQuantity === 0 ? 'checked_out' : equipment.status === 'maintenance' ? 'maintenance' : 'available';
    }
  } else if (input.actionType === 'check_in') {
    if (qty <= 0) {
      errors.quantity = 'ຈຳນວນທີ່ຮັບຄືນຕ້ອງຫຼາຍກວ່າ 0';
    } else if (equipment.quantity + qty > FIELD_LIMITS.quantityMax) {
      errors.quantity = 'ຈຳນວນລວມເກີນຂອບເຂດທີ່ລະບົບຮອງຮັບ';
    } else {
      nextQuantity = equipment.quantity + qty;
      quantityDelta = qty;
      nextStatus = equipment.status === 'maintenance' ? 'maintenance' : 'available';
    }
  } else {
    if (qty < 0 || qty > FIELD_LIMITS.quantityMax) {
      errors.quantity = 'ຍອດຄົງເຫຼືອໃໝ່ຕ້ອງເປັນ 0 ຂຶ້ນໄປ';
    } else if (qty === equipment.quantity) {
      errors.quantity = 'ຍອດໃໝ່ເທົ່າກັບຍອດປັດຈຸບັນແລ້ວ';
    } else {
      nextQuantity = qty;
      quantityDelta = qty - equipment.quantity;
      if (nextQuantity === 0 && equipment.status === 'available') {
        nextStatus = 'checked_out';
      } else if (nextQuantity > 0 && equipment.status === 'checked_out') {
        nextStatus = 'available';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    nextQuantity,
    quantityDelta,
    nextStatus,
  };
}

export interface InventoryMetrics {
  totalTypes: number;
  totalUnits: number;
  availableTypes: number;
  lowStockCount: number;
  maintenanceCount: number;
  locationCount: number;
}

export function isLowStock(item: EquipmentItem): boolean {
  return item.minThreshold > 0 && item.quantity <= item.minThreshold;
}

export function computeInventoryMetrics(
  equipment: EquipmentItem[],
  locations: StorageLocation[],
): InventoryMetrics {
  let totalUnits = 0;
  let availableTypes = 0;
  let lowStockCount = 0;
  let maintenanceCount = 0;

  for (const item of equipment) {
    totalUnits += item.quantity;
    if (item.status === 'available' && item.quantity > 0) {
      availableTypes += 1;
    }
    if (isLowStock(item)) {
      lowStockCount += 1;
    }
    if (item.status === 'maintenance') {
      maintenanceCount += 1;
    }
  }

  return {
    totalTypes: equipment.length,
    totalUnits,
    availableTypes,
    lowStockCount,
    maintenanceCount,
    locationCount: locations.length,
  };
}

export interface EquipmentFilters {
  search: string;
  category: EquipmentCategory | 'all';
  locationId: string | 'all';
  status: InventoryStatusFilter;
}

export function filterEquipment(
  equipment: EquipmentItem[],
  filters: EquipmentFilters,
): EquipmentItem[] {
  const q = filters.search.trim().toLowerCase();

  return equipment.filter((item) => {
    if (filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    if (filters.locationId !== 'all' && item.locationId !== filters.locationId) {
      return false;
    }
    if (filters.status === 'low_stock') {
      if (!isLowStock(item)) return false;
    } else if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    if (q) {
      const hay = `${item.name} ${item.sku} ${item.notes}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export interface LocationStats {
  location: StorageLocation;
  itemCount: number;
  totalUnits: number;
  utilizationPercent: number;
}

export function computeLocationStats(
  locations: StorageLocation[],
  equipment: EquipmentItem[],
): LocationStats[] {
  return locations.map((location) => {
    const itemsInLoc = equipment.filter((e) => e.locationId === location.id);
    const totalUnits = itemsInLoc.reduce((sum, item) => sum + item.quantity, 0);
    const utilizationPercent =
      location.capacity > 0 ? Math.min(100, Math.round((totalUnits / location.capacity) * 100)) : 0;

    return {
      location,
      itemCount: itemsInLoc.length,
      totalUnits,
      utilizationPercent,
    };
  });
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCsvExport(
  equipment: EquipmentItem[],
  locations: StorageLocation[],
): string {
  const locationMap = new Map(locations.map((l) => [l.id, `${l.code} - ${l.name}`]));
  const headers = ['SKU', 'ຊື່ອຸປະກອນ', 'ໝວດໝູ່', 'ບ່ອນເກັບມ້ຽນ', 'ຈຳນວນ', 'ຂັ້ນຕ່ຳ', 'ໜ່ວຍນັບ', 'ສະຖານະ', 'ໝາຍເຫດ'];
  const rows = equipment.map((item) => [
    item.sku,
    item.name,
    item.category,
    locationMap.get(item.locationId) ?? item.locationId,
    item.quantity,
    item.minThreshold,
    item.unit,
    item.status,
    item.notes,
  ]);
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return '\uFEFF' + lines.join('\r\n');
}
