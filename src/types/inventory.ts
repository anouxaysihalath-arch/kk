export type EquipmentCategory = 'tools' | 'it' | 'office' | 'safety' | 'other';
export type EquipmentStatus = 'available' | 'checked_out' | 'maintenance';
export type ZoneType = 'cabinet' | 'shelf' | 'room' | 'box';
export type MovementActionType = 'check_out' | 'check_in' | 'adjust';
export type InventoryStatusFilter = 'all' | EquipmentStatus | 'low_stock';
export type WorkspaceView = 'inventory' | 'locations' | 'movements';

export interface StorageLocation {
  id: string;
  ownerId: string;
  code: string;
  name: string;
  zoneType: ZoneType;
  capacity: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: string;
  ownerId: string;
  sku: string;
  name: string;
  category: EquipmentCategory;
  locationId: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  status: EquipmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovementRecord {
  id: string;
  ownerId: string;
  equipmentId: string;
  equipmentName: string;
  actionType: MovementActionType;
  quantityDelta: number;
  actorName: string;
  note: string;
  createdAt: string;
}

/**
 * Limits synchronized strictly with firebase-blueprint.json & firestore.rules.
 */
export const FIELD_LIMITS = {
  idMax: 128,
  idPattern: /^[a-zA-Z0-9_-]+$/,
  locationCodeMax: 32,
  locationNameMax: 100,
  locationDescMax: 300,
  capacityMin: 1,
  capacityMax: 10000,
  skuMax: 40,
  equipmentNameMax: 120,
  quantityMax: 1000000,
  unitMax: 24,
  notesMax: 500,
  actorNameMax: 100,
  movementNoteMax: 300,
} as const;

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  tools: 'ເຄື່ອງມືຊ່າງ',
  it: 'ອຸປະກອນໄອທີ',
  office: 'ເຄື່ອງໃຊ້ສຳນັກງານ',
  safety: 'ອຸປະກອນຄວາມປອດໄພ',
  other: 'ອື່ນໆ',
};

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  cabinet: 'ຕູ້ເກັບ',
  shelf: 'ຊັ້ນວາງ',
  room: 'ຫ້ອງສາງ',
  box: 'ກ່ອງເກັບ',
};

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'ພ້ອມໃຊ້ງານ',
  checked_out: 'ກຳລັງຢືມ',
  maintenance: 'ຕ້ອງສ້ອມແປງ',
};

export const MOVEMENT_ACTION_LABELS: Record<MovementActionType, string> = {
  check_out: 'ເບີກອອກ',
  check_in: 'ຮັບຄືນ / ເພີ່ມເຂົ້າ',
  adjust: 'ປັບຍອດສະຕັອກ',
};

export const COMMON_UNITS = ['ອັນ', 'ເຄື່ອງ', 'ຊຸດ', 'ກ່ອງ', 'ແມັດ', 'ຄູ່'] as const;
