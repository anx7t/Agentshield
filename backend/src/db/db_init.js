const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/agentshield.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
}

function initDb() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  migrate(db);

  console.log('DB initialized. Tables verified.');
  return db;
}

// Columns added after the first release: CREATE TABLE IF NOT EXISTS won't add them to an existing DB.
function migrate(database) {
  const txnCols = database.prepare('PRAGMA table_info(transactions)').all().map((c) => c.name);
  if (!txnCols.includes('request_status')) {
    database.exec('ALTER TABLE transactions ADD COLUMN request_status TEXT');
  }
}

module.exports = { initDb, getDb };
