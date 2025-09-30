//db.js
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

  // Create entries table (if not exists)
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // Create join table for many-to-many relationship
  db.exec(`
    CREATE TABLE IF NOT EXISTS entry_categories (
      entry_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      paid INTEGER DEFAULT 0,
      completed_date TEXT,
      PRIMARY KEY (entry_id, category_id),
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);
});

// Example helpers
function getEntries() {
  const entries = db.prepare("SELECT * FROM entries ORDER BY id DESC").all();
  for (const entry of entries) {
    entry.categories = getEntryCategories(entry.id); // all categories
    entry.paid_categories = getPaidCategories(entry.id); // only paid categories
    entry.completed_dates = getCompletedDates(entry.id); // {category: date, ...}
  }
  return entries;
}

// Helper to get paid categories for an entry
function getPaidCategories(entryId) {
  return db.prepare(`
    SELECT c.name FROM categories c
    JOIN entry_categories ec ON c.id = ec.category_id
    WHERE ec.entry_id = ? AND ec.paid = 1
    ORDER BY c.name
  `).all(entryId).map(row => row.name);
}

// Helper to get completed dates for each paid category
function getCompletedDates(entryId) {
  const rows = db.prepare(`
    SELECT c.name, ec.completed_date
    FROM categories c
    JOIN entry_categories ec ON c.id = ec.category_id
    WHERE ec.entry_id = ? AND ec.paid = 1
  `).all(entryId);
  const result = {};
  for (const row of rows) {
    result[row.name] = row.completed_date;
  }
  return result;
}

function addEntry(entry) {
  const stmt = db.prepare("INSERT INTO entries (title, amount) VALUES (?, ?)");
  const info = stmt.run(entry.title, entry.amount || 0);
  if (entry.categories && Array.isArray(entry.categories)) {
    linkEntryCategories(info.lastInsertRowid, entry.categories);
  }
  return { lastInsertRowid: info.lastInsertRowid };
}

function deleteEntry(id) {
  const stmt = db.prepare("DELETE FROM entries WHERE id = ?");
  const info = stmt.run(id);
  return { changes: info.changes };
}

function editEntry(id, data) {
  const stmt = db.prepare("UPDATE entries SET title = ?, amount = ? WHERE id = ?");
  const info = stmt.run(data.title, data.amount, id);
  if (data.categories && Array.isArray(data.categories)) {
    linkEntryCategories(id, data.categories);
  }
  return { changes: info.changes };
}

// Example helper to get all categories
function getCategories() {
  return db.prepare("SELECT * FROM categories ORDER BY name").all();
}

// Example helper to add a category (returns id)
function addCategory(name) {
  const stmt = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)");
  stmt.run(name);
  return db.prepare("SELECT id FROM categories WHERE name = ?").get(name).id;
}

// Example helper to link entry to categories
function linkEntryCategories(entryId, categoryNames) {
  // Remove existing links
  db.prepare("DELETE FROM entry_categories WHERE entry_id = ?").run(entryId);
  // Add new links
  for (const name of categoryNames) {
    const catId = addCategory(name);
    db.prepare("INSERT OR IGNORE INTO entry_categories (entry_id, category_id) VALUES (?, ?)").run(entryId, catId);
  }
}

// Example: When editing an entry's categories
function editEntryCategories(entryId, categoryNames) {
  linkEntryCategories(entryId, categoryNames);
}

// Example: Get categories for an entry
function getEntryCategories(entryId) {
  return db.prepare(`
    SELECT c.name FROM categories c
    JOIN entry_categories ec ON c.id = ec.category_id
    WHERE ec.entry_id = ?
    ORDER BY c.name
  `).all(entryId).map(row => row.name);
}

// Example: Get a single entry by ID
function getEntryById(id) {
  const entry = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
  if (entry) {
    entry.categories = getEntryCategories(entry.id);
    entry.paid_categories = getPaidCategories(entry.id);
    entry.completed_dates = getCompletedDates(entry.id);
  }
  return entry;
}

function markEntryCategoriesPaid(entryId, categoryNames, paid) {
  const catIds = categoryNames.map(name =>
    db.prepare("SELECT id FROM categories WHERE name = ?").get(name).id
  );
  for (const catId of catIds) {
    if (paid) {
      db.prepare("UPDATE entry_categories SET paid = 1, completed_date = datetime('now') WHERE entry_id = ? AND category_id = ?")
        .run(entryId, catId);
    } else {
      db.prepare("UPDATE entry_categories SET paid = 0, completed_date = NULL WHERE entry_id = ? AND category_id = ?")
        .run(entryId, catId);
    }
  }
}

function titleExists(title) {
  const row = db.prepare("SELECT 1 FROM entries WHERE title = ? LIMIT 1").get(title);
  return !!row;
}

module.exports = {
  getCategories,
  addCategory,
  addEntry,
  editEntry,
  editEntryCategories,
  getEntryCategories,
  getEntries,
  getEntryById,
  deleteEntry,
  markEntryCategoriesPaid,
  titleExists,
};
