# Security Specification — ຄັງອຸປະກອນ (Equipment Storage App)

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every `locations`, `equipment`, and `movements` document under `/users/{userId}/...` belongs strictly to `userId == request.auth.uid` with `email_verified == true`. Cross-user reads, list queries, creates, updates, or deletes are denied.
2. **Referential Integrity**: An `EquipmentItem` cannot be created or reassigned to a non-existent `locationId` (must exist at `/users/{userId}/locations/{locationId}`, checked via `exists()` / `existsAfter()`). A `MovementRecord` cannot be created for a non-existent `equipmentId` (must exist at `/users/{userId}/equipment/{equipmentId}`).
3. **Immutable Audit Trail & Identity**: `ownerId` and `createdAt` are immutable after creation; `movements` records are append-only (updates and deletes denied).
4. **Strict Schema & Bounds**: All strings enforce explicit `.size()` limits, IDs match `^[a-zA-Z0-9_-]+$`, numbers enforce finite non-negative bounds (`quantity >= 0`, `capacity >= 1`), and unknown shadow fields are blocked via `hasAll` / `hasOnly` and `affectedKeys().hasOnly(...)`.
5. **Temporal Integrity**: `createdAt == request.time` on create; `updatedAt == request.time` on update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-Tenant Read/List**: User B attempts `list` or `get` on `/users/userA/equipment`. -> Rejected (`userId != request.auth.uid`).
2. **Unverified Email Write**: User with `email_verified: false` attempts to create a storage location. -> Rejected (`email_verified == true` gate).
3. **Identity Spoofing on Create**: User A writes `/users/userA/equipment/eq1` with `ownerId: "userB"`. -> Rejected (`data.ownerId == request.auth.uid`).
4. **Shadow / Ghost Field Injection**: User A creates a location with extra field `isAdmin: true`. -> Rejected (`hasOnly` key allowlist).
5. **ID Poisoning**: User A writes `/users/userA/locations/../../bad$id` or 500-char ID. -> Rejected (`isValidId(locationId)`).
6. **Orphaned Equipment Write**: User A creates equipment referencing `locationId: "nonexistent_loc"`. -> Rejected (`exists` / `existsAfter` check).
7. **Negative Quantity Exploit**: User A creates or updates equipment with `quantity: -5`. -> Rejected (`data.quantity >= 0`).
8. **Type Poisoning on Update**: User A updates `quantity` to `"unlimited"` (string) or `status` to `"hacked"`. -> Rejected (`isValidEquipment` on update).
9. **Immutable Field Mutation**: User A updates `ownerId` or `createdAt` on an existing equipment doc. -> Rejected (`affectedKeys().hasOnly(...)` + immutability check).
10. **Client Timestamp Forgery**: User A sets `createdAt` to a past timestamp instead of `request.time`. -> Rejected (`incoming().createdAt == request.time`).
11. **Movement Log Tampering**: User A attempts to update or delete an existing `/users/userA/movements/mov1` audit log. -> Rejected (`allow update, delete: if false`).
12. **Excessive String Exhaustion (DoW)**: User A submits a 50KB `notes` or `name` string. -> Rejected (`size() <= 500` / `<= 120`).
