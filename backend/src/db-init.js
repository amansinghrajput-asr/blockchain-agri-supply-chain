import db from "./db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'Farmer',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS batches(
    id TEXT PRIMARY KEY,
    farmer TEXT NOT NULL,
    crop TEXT NOT NULL,
    quantity REAL NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'HARVESTED',
    harvest_score REAL,
    delivery_score REAL,
    user_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS batch_events(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );
`);

console.log("Database initialized with users, batches, and batch_events tables (SQLite)");
db.close();
