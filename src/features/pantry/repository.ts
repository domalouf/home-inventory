import type { SQLiteDatabase } from 'expo-sqlite';
import type { Item, ItemInput, Location, LocationKind } from './types';

const ITEM_SELECT = `
  SELECT items.*, locations.name AS location_name
  FROM items
  JOIN locations ON locations.id = items.location_id
`;

export function listLocations(db: SQLiteDatabase, kind: LocationKind = 'food') {
  return db.getAllAsync<Location>(
    'SELECT * FROM locations WHERE kind = ? ORDER BY sort_order, name',
    kind,
  );
}

export function listFoodItems(db: SQLiteDatabase) {
  return db.getAllAsync<Item>(
    `${ITEM_SELECT}
     WHERE locations.kind = 'food'
     ORDER BY (items.expires_on IS NULL), items.expires_on, items.name COLLATE NOCASE`,
  );
}

export function getItem(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Item>(`${ITEM_SELECT} WHERE items.id = ?`, id);
}

export async function createItem(db: SQLiteDatabase, input: ItemInput) {
  const result = await db.runAsync(
    `INSERT INTO items (location_id, name, category, quantity, unit, expires_on, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.location_id,
    input.name.trim(),
    input.category ?? null,
    input.quantity,
    input.unit ?? null,
    input.expires_on ?? null,
    input.notes ?? null,
  );
  return result.lastInsertRowId;
}

export async function updateItem(db: SQLiteDatabase, id: number, input: ItemInput) {
  await db.runAsync(
    `UPDATE items
     SET location_id = ?, name = ?, category = ?, quantity = ?, unit = ?,
         expires_on = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    input.location_id,
    input.name.trim(),
    input.category ?? null,
    input.quantity,
    input.unit ?? null,
    input.expires_on ?? null,
    input.notes ?? null,
    id,
  );
}

export async function setQuantity(db: SQLiteDatabase, id: number, quantity: number) {
  await db.runAsync(
    `UPDATE items SET quantity = ?, updated_at = datetime('now') WHERE id = ?`,
    Math.max(0, quantity),
    id,
  );
}

export async function deleteItem(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}
