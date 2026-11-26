import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  EquipmentItem,
  FIELD_LIMITS,
  MovementRecord,
  StorageLocation,
} from '../types/inventory';
import { EquipmentInput, LocationInput, MovementInput } from '../utils/inventoryLogic';
import { db, handleFirestoreError, OperationType } from './firebase';

function formatTimestamp(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

export function subscribeUserLocations(
  uid: string,
  onData: (locations: StorageLocation[]) => void,
  onError: (err: Error) => void,
): () => void {
  const path = `users/${uid}/locations`;
  const q = query(
    collection(db, path),
    where('ownerId', '==', uid),
    orderBy('code', 'asc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: StorageLocation[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          ownerId: String(data.ownerId ?? uid),
          code: String(data.code ?? ''),
          name: String(data.name ?? ''),
          zoneType: data.zoneType,
          capacity: Number(data.capacity ?? 1),
          description: String(data.description ?? ''),
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    },
  );
}

export function subscribeUserEquipment(
  uid: string,
  onData: (equipment: EquipmentItem[]) => void,
  onError: (err: Error) => void,
): () => void {
  const path = `users/${uid}/equipment`;
  const q = query(
    collection(db, path),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: EquipmentItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          ownerId: String(data.ownerId ?? uid),
          sku: String(data.sku ?? ''),
          name: String(data.name ?? ''),
          category: data.category,
          locationId: String(data.locationId ?? ''),
          quantity: Number(data.quantity ?? 0),
          minThreshold: Number(data.minThreshold ?? 0),
          unit: String(data.unit ?? 'ອັນ'),
          status: data.status,
          notes: String(data.notes ?? ''),
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    },
  );
}

export function subscribeUserMovements(
  uid: string,
  onData: (movements: MovementRecord[]) => void,
  onError: (err: Error) => void,
): () => void {
  const path = `users/${uid}/movements`;
  const q = query(
    collection(db, path),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: MovementRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          ownerId: String(data.ownerId ?? uid),
          equipmentId: String(data.equipmentId ?? ''),
          equipmentName: String(data.equipmentName ?? ''),
          actionType: data.actionType,
          quantityDelta: Number(data.quantityDelta ?? 0),
          actorName: String(data.actorName ?? ''),
          note: String(data.note ?? ''),
          createdAt: formatTimestamp(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    },
  );
}

export async function createLocationInFirestore(
  uid: string,
  id: string,
  input: LocationInput,
): Promise<void> {
  const path = `users/${uid}/locations/${id}`;
  try {
    await setDoc(doc(db, path), {
      id,
      ownerId: uid,
      code: input.code.trim().slice(0, FIELD_LIMITS.locationCodeMax),
      name: input.name.trim().slice(0, FIELD_LIMITS.locationNameMax),
      zoneType: input.zoneType,
      capacity: Math.max(FIELD_LIMITS.capacityMin, Math.min(FIELD_LIMITS.capacityMax, Math.round(input.capacity))),
      description: input.description.trim().slice(0, FIELD_LIMITS.locationDescMax),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLocationInFirestore(
  uid: string,
  id: string,
  input: LocationInput,
): Promise<void> {
  const path = `users/${uid}/locations/${id}`;
  try {
    await updateDoc(doc(db, path), {
      code: input.code.trim().slice(0, FIELD_LIMITS.locationCodeMax),
      name: input.name.trim().slice(0, FIELD_LIMITS.locationNameMax),
      zoneType: input.zoneType,
      capacity: Math.max(FIELD_LIMITS.capacityMin, Math.min(FIELD_LIMITS.capacityMax, Math.round(input.capacity))),
      description: input.description.trim().slice(0, FIELD_LIMITS.locationDescMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLocationInFirestore(uid: string, id: string): Promise<void> {
  const path = `users/${uid}/locations/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createEquipmentInFirestore(
  uid: string,
  id: string,
  input: EquipmentInput,
): Promise<void> {
  const path = `users/${uid}/equipment/${id}`;
  try {
    await setDoc(doc(db, path), {
      id,
      ownerId: uid,
      sku: input.sku.trim().slice(0, FIELD_LIMITS.skuMax),
      name: input.name.trim().slice(0, FIELD_LIMITS.equipmentNameMax),
      category: input.category,
      locationId: input.locationId,
      quantity: Math.max(0, Math.min(FIELD_LIMITS.quantityMax, Math.round(input.quantity))),
      minThreshold: Math.max(0, Math.min(FIELD_LIMITS.quantityMax, Math.round(input.minThreshold))),
      unit: input.unit.trim().slice(0, FIELD_LIMITS.unitMax),
      status: input.status,
      notes: input.notes.trim().slice(0, FIELD_LIMITS.notesMax),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEquipmentInFirestore(
  uid: string,
  id: string,
  input: EquipmentInput,
): Promise<void> {
  const path = `users/${uid}/equipment/${id}`;
  try {
    await updateDoc(doc(db, path), {
      sku: input.sku.trim().slice(0, FIELD_LIMITS.skuMax),
      name: input.name.trim().slice(0, FIELD_LIMITS.equipmentNameMax),
      category: input.category,
      locationId: input.locationId,
      quantity: Math.max(0, Math.min(FIELD_LIMITS.quantityMax, Math.round(input.quantity))),
      minThreshold: Math.max(0, Math.min(FIELD_LIMITS.quantityMax, Math.round(input.minThreshold))),
      unit: input.unit.trim().slice(0, FIELD_LIMITS.unitMax),
      status: input.status,
      notes: input.notes.trim().slice(0, FIELD_LIMITS.notesMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEquipmentInFirestore(uid: string, id: string): Promise<void> {
  const path = `users/${uid}/equipment/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordMovementBatchInFirestore(
  uid: string,
  equipment: EquipmentItem,
  movementId: string,
  input: MovementInput,
  nextQuantity: number,
  quantityDelta: number,
  nextStatus: EquipmentItem['status'],
): Promise<void> {
  const eqPath = `users/${uid}/equipment/${equipment.id}`;
  const movPath = `users/${uid}/movements/${movementId}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, eqPath), {
      quantity: nextQuantity,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, movPath), {
      id: movementId,
      ownerId: uid,
      equipmentId: equipment.id,
      equipmentName: equipment.name.slice(0, FIELD_LIMITS.equipmentNameMax),
      actionType: input.actionType,
      quantityDelta,
      actorName: input.actorName.trim().slice(0, FIELD_LIMITS.actorNameMax),
      note: input.note.trim().slice(0, FIELD_LIMITS.movementNoteMax),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, movPath);
  }
}

export async function importWorkspaceToFirestore(
  uid: string,
  locations: StorageLocation[],
  equipment: EquipmentItem[],
  movements: MovementRecord[],
): Promise<void> {
  const batchPath = `users/${uid}`;
  try {
    const batch = writeBatch(db);
    for (const loc of locations) {
      batch.set(doc(db, `users/${uid}/locations/${loc.id}`), {
        id: loc.id,
        ownerId: uid,
        code: loc.code.slice(0, FIELD_LIMITS.locationCodeMax),
        name: loc.name.slice(0, FIELD_LIMITS.locationNameMax),
        zoneType: loc.zoneType,
        capacity: loc.capacity,
        description: loc.description.slice(0, FIELD_LIMITS.locationDescMax),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const item of equipment) {
      batch.set(doc(db, `users/${uid}/equipment/${item.id}`), {
        id: item.id,
        ownerId: uid,
        sku: item.sku.slice(0, FIELD_LIMITS.skuMax),
        name: item.name.slice(0, FIELD_LIMITS.equipmentNameMax),
        category: item.category,
        locationId: item.locationId,
        quantity: item.quantity,
        minThreshold: item.minThreshold,
        unit: item.unit.slice(0, FIELD_LIMITS.unitMax),
        status: item.status,
        notes: item.notes.slice(0, FIELD_LIMITS.notesMax),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const mov of movements) {
      batch.set(doc(db, `users/${uid}/movements/${mov.id}`), {
        id: mov.id,
        ownerId: uid,
        equipmentId: mov.equipmentId,
        equipmentName: mov.equipmentName.slice(0, FIELD_LIMITS.equipmentNameMax),
        actionType: mov.actionType,
        quantityDelta: mov.quantityDelta,
        actorName: mov.actorName.slice(0, FIELD_LIMITS.actorNameMax),
        note: mov.note.slice(0, FIELD_LIMITS.movementNoteMax),
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, batchPath);
  }
}
