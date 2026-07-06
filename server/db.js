const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, 'tempchat.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS room (
      id         TEXT PRIMARY KEY,
      party_a    TEXT NOT NULL,
      party_b    TEXT NOT NULL,
      password   TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id    TEXT NOT NULL REFERENCES room(id),
      sender     TEXT NOT NULL,
      content    TEXT DEFAULT '',
      file_name  TEXT,
      file_path  TEXT,
      file_size  INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_message_room
      ON message(room_id, created_at);
  `);
  console.log('Database initialized');
}

module.exports = { db, initDB };
