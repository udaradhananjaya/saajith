const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// This function resolves DB path inside userData
function resolveDbPath() {
  const userData = app.getPath("userData");
  const dbPath = path.join(userData, "app.db");

  // Copy template DB from "models" folder on first run
  const sourceDb = path.join(__dirname, "app.db");
  if (!fs.existsSync(dbPath) && fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, dbPath);
  }

  return dbPath;
}

// Only create DB after app is ready
let db;
app.whenReady().then(() => {
  db = new Database(resolveDbPath());

  // Initialize table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL DEFAULT 0,
      category TEXT,
      paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

// Example helpers
function getEntries() {
  return db.prepare("SELECT * FROM entries ORDER BY id DESC").all();
}

function addEntry(entry) {
  const stmt = db.prepare("INSERT INTO entries (title, amount, category, paid) VALUES (?, ?, ?, ?)");
  const info = stmt.run(entry.title, entry.amount || 0, entry.category || null, entry.paid ? 1 : 0);
  return { lastInsertRowid: info.lastInsertRowid };
}

function togglePaid(id, paid) {
  const stmt = db.prepare("UPDATE entries SET paid = ? WHERE id = ?");
  const info = stmt.run(paid ? 1 : 0, id);
  return { changes: info.changes };
}

function deleteEntry(id) {
  const stmt = db.prepare("DELETE FROM entries WHERE id = ?");
  const info = stmt.run(id);
  return { changes: info.changes };
}

function editEntry(id, data) {
  const stmt = db.prepare("UPDATE entries SET title = ?, amount = ? WHERE id = ?");
  const info = stmt.run(data.title, data.amount, id);
  return { changes: info.changes };
}

module.exports = { getEntries, addEntry, togglePaid, deleteEntry, editEntry };
