import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeInventoryMetrics,
  computeLocationStats,
  evaluateMovement,
  filterEquipment,
  formatCsvExport,
  validateEquipmentInput,
  validateLocationInput,
} from './inventoryLogic';
import { EquipmentItem, StorageLocation } from '../types/inventory';

const sampleLocations: StorageLocation[] = [
  {
    id: 'loc_a1',
    ownerId: 'local',
    code: 'A-01',
    name: 'ຕູ້ເຄື່ອງມືຊ່າງຊັ້ນ 1',
    zoneType: 'cabinet',
    capacity: 50,
    description: 'ເຄື່ອງມືໄຟຟ້າ',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'loc_b2',
    ownerId: 'local',
    code: 'B-02',
    name: 'ຫ້ອງ Server',
    zoneType: 'room',
    capacity: 20,
    description: 'ອຸປະກອນໄອທີ',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

const sampleEquipment: EquipmentItem[] = [
  {
    id: 'eq_1',
    ownerId: 'local',
    sku: 'TLS-001',
    name: 'ສະຫວ່ານໄຟຟ້າ Makita 18V',
    category: 'tools',
    locationId: 'loc_a1',
    quantity: 6,
    minThreshold: 2,
    unit: 'ເຄື່ອງ',
    status: 'available',
    notes: 'ພ້ອມແບັດເຕີຣີ 2 ກ້ອນ',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'eq_2',
    ownerId: 'local',
    sku: 'IT-014',
    name: 'ສາຍ LAN Cat6 10m',
    category: 'it',
    locationId: 'loc_b2',
    quantity: 3,
    minThreshold: 5,
    unit: 'ເສັ້ນ',
    status: 'available',
    notes: 'ໃກ້ໝົດສະຕັອກ',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'eq_3',
    ownerId: 'local',
    sku: 'SAF-002',
    name: 'ໝວກກັນກະແທກ',
    category: 'safety',
    locationId: 'loc_a1',
    quantity: 10,
    minThreshold: 4,
    unit: 'ອັນ',
    status: 'maintenance',
    notes: 'ກຳລັງກວດສອບສາຍຮັດ',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

test('validateLocationInput rejects empty code/name and duplicate codes', () => {
  const emptyRes = validateLocationInput(
    { code: '', name: '', zoneType: 'cabinet', capacity: 10, description: '' },
    sampleLocations,
  );
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.errors.code);
  assert.ok(emptyRes.errors.name);

  const dupRes = validateLocationInput(
    { code: 'a-01', name: 'ຊື່ໃໝ່', zoneType: 'shelf', capacity: 10, description: '' },
    sampleLocations,
  );
  assert.equal(dupRes.valid, false);
  assert.ok(dupRes.errors.code);

  const editSelfRes = validateLocationInput(
    { code: 'A-01', name: 'ຕູ້ເຄື່ອງມືຊ່າງຊັ້ນ 1 ອັບເດດ', zoneType: 'cabinet', capacity: 60, description: '' },
    sampleLocations,
    'loc_a1',
  );
  assert.equal(editSelfRes.valid, true);
});

test('validateEquipmentInput rejects missing location, negative qty, and duplicate SKU', () => {
  const invalidRes = validateEquipmentInput(
    {
      sku: 'TLS-001',
      name: '',
      category: 'tools',
      locationId: 'missing',
      quantity: -1,
      minThreshold: 0,
      unit: '',
      status: 'available',
      notes: '',
    },
    sampleEquipment,
    sampleLocations,
  );
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.sku);
  assert.ok(invalidRes.errors.name);
  assert.ok(invalidRes.errors.locationId);
  assert.ok(invalidRes.errors.quantity);
  assert.ok(invalidRes.errors.unit);
});

test('evaluateMovement handles check_out, over-borrow prevention, check_in, and adjust', () => {
  const tooMany = evaluateMovement(
    { actionType: 'check_out', quantity: 10, actorName: 'ສົມຊາຍ', note: '' },
    sampleEquipment[0],
  );
  assert.equal(tooMany.valid, false);
  assert.ok(tooMany.errors.quantity);

  const validBorrow = evaluateMovement(
    { actionType: 'check_out', quantity: 6, actorName: 'ສົມຊາຍ', note: 'ນຳໄປໜ້າວຽກ' },
    sampleEquipment[0],
  );
  assert.equal(validBorrow.valid, true);
  assert.equal(validBorrow.nextQuantity, 0);
  assert.equal(validBorrow.quantityDelta, -6);
  assert.equal(validBorrow.nextStatus, 'checked_out');

  const validReturn = evaluateMovement(
    { actionType: 'check_in', quantity: 4, actorName: 'ສົມຊາຍ', note: 'ສົ່ງຄືນ' },
    { ...sampleEquipment[0], quantity: 0, status: 'checked_out' },
  );
  assert.equal(validReturn.valid, true);
  assert.equal(validReturn.nextQuantity, 4);
  assert.equal(validReturn.quantityDelta, 4);
  assert.equal(validReturn.nextStatus, 'available');

  const validAdjust = evaluateMovement(
    { actionType: 'adjust', quantity: 8, actorName: 'ແອັດມິນ', note: 'ນັບສະຕັອກ' },
    sampleEquipment[0],
  );
  assert.equal(validAdjust.valid, true);
  assert.equal(validAdjust.nextQuantity, 8);
  assert.equal(validAdjust.quantityDelta, 2);
});

test('computeInventoryMetrics and computeLocationStats aggregate accurately', () => {
  const metrics = computeInventoryMetrics(sampleEquipment, sampleLocations);
  assert.equal(metrics.totalTypes, 3);
  assert.equal(metrics.totalUnits, 19);
  assert.equal(metrics.availableTypes, 2);
  assert.equal(metrics.lowStockCount, 1);
  assert.equal(metrics.maintenanceCount, 1);
  assert.equal(metrics.locationCount, 2);

  const stats = computeLocationStats(sampleLocations, sampleEquipment);
  assert.equal(stats[0].itemCount, 2);
  assert.equal(stats[0].totalUnits, 16);
  assert.equal(stats[0].utilizationPercent, 32);
  assert.equal(stats[1].itemCount, 1);
  assert.equal(stats[1].totalUnits, 3);
  assert.equal(stats[1].utilizationPercent, 15);
});

test('filterEquipment filters by search, category, location, and low_stock', () => {
  const bySearch = filterEquipment(sampleEquipment, {
    search: 'makita',
    category: 'all',
    locationId: 'all',
    status: 'all',
  });
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 'eq_1');

  const byLowStock = filterEquipment(sampleEquipment, {
    search: '',
    category: 'all',
    locationId: 'all',
    status: 'low_stock',
  });
  assert.equal(byLowStock.length, 1);
  assert.equal(byLowStock[0].id, 'eq_2');
});

test('formatCsvExport outputs BOM and properly escaped rows', () => {
  const csv = formatCsvExport(sampleEquipment, sampleLocations);
  assert.ok(csv.startsWith('\uFEFFSKU,'));
  assert.ok(csv.includes('TLS-001'));
  assert.ok(csv.includes('A-01 - ຕູ້ເຄື່ອງມືຊ່າງຊັ້ນ 1'));
});
