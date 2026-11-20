import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Schema notes
 *
 * Everything the app tracks is an `item` that lives in a `location`.
 * Locations have a `kind`:
 *   - 'food'  → Pantry, Fridge, Freezer (used by the pantry and recipe features)
 *   - 'room'  → reserved for the upcoming room-by-room house inventory
 *
 * Keeping one items table means room inventory, barcode scanning and the
 * camera/vision feature can all write to the same place later.
 */
const MIGRATIONS: string[] = [
  // v1
  `
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('food', 'room')),
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT,
    expires_on TEXT,
    notes TEXT,
    barcode TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_items_location ON items(location_id);
  CREATE INDEX IF NOT EXISTS idx_items_expires ON items(expires_on);

  INSERT INTO locations (name, kind, sort_order) VALUES
    ('Pantry', 'food', 1),
    ('Fridge', 'food', 2),
    ('Freezer', 'food', 3);
  `,
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
