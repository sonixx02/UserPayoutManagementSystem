const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');


function openDb(filename = 'payouts.db') {
  const db = new Database(filename);

  
  db.pragma('foreign_keys = ON');

  db.pragma('journal_mode = WAL');

  // if another connection holds the write lock wait up to 5s instead of erroring
  db.pragma('busy_timeout = 5000');

  // create all tables and indexes safe to run every time
  db.exec(schema);

  return db;
}

module.exports = { openDb };
