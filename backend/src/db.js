import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "agri_chain.db");
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// Postgres-compatible wrapper so the rest of the code doesn't change much
export const pool = {
  query(sql, params = []) {
    // Normalize $1, $2... placeholders to ?
    let idx = 0;
    const normalizedSql = sql.replace(/\$\d+/g, () => "?");

    const trimmed = normalizedSql.trim().toUpperCase();
    const isSelect = trimmed.startsWith("SELECT");
    const isReturning = normalizedSql.toUpperCase().includes("RETURNING");

    if (isSelect) {
      const rows = db.prepare(normalizedSql).all(...params);
      return { rows, rowCount: rows.length };
    } else if (isReturning) {
      // SQLite doesn't support RETURNING — split into execute + select
      const withoutReturning = normalizedSql.replace(/\s+RETURNING\s+.*/i, "");
      db.prepare(withoutReturning).run(...params);

      // For INSERT INTO batches... return the inserted row
      if (trimmed.startsWith("INSERT")) {
        const table = normalizedSql.match(/INTO\s+(\w+)/i)?.[1];
        if (table && params[0]) {
          const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(params[0]);
          return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
        }
      }
      // For UPDATE ... WHERE id=$N RETURNING * — the id is the last param typically
      if (trimmed.startsWith("UPDATE")) {
        const table = normalizedSql.match(/UPDATE\s+(\w+)/i)?.[1];
        // Find the id param — look for WHERE id=? pattern
        const whereMatch = withoutReturning.match(/WHERE\s+id\s*=\s*\?/i);
        if (table && whereMatch) {
          // The id is the last parameter
          const id = params[params.length - 1];
          const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
          return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
        }
      }
      return { rows: [], rowCount: 0 };
    } else {
      const result = db.prepare(normalizedSql).run(...params);
      return { rows: [], rowCount: result.changes };
    }
  },
  end() {
    db.close();
    return Promise.resolve();
  },
};

export default db;
