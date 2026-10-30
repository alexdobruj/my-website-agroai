// Простое файловое хранилище для MVP: один JSON-файл, атомарная запись.
// При переходе к продакшену заменить на Postgres (схема та же: leads, farmers, offers, requests).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY = { leads: [], farmers: [], offers: [], requests: [] };

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch (err) {
    if (err.code === 'ENOENT') return structuredClone(EMPTY);
    throw err;
  }
}

let db = load();

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function insert(collection, record) {
  const row = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...record };
  db[collection].push(row);
  save();
  return row;
}

function update(collection, id, patch) {
  const row = db[collection].find((r) => r.id === id);
  if (!row) return null;
  Object.assign(row, patch, { updatedAt: new Date().toISOString() });
  save();
  return row;
}

function all(collection) {
  return db[collection];
}

function find(collection, id) {
  return db[collection].find((r) => r.id === id) || null;
}

module.exports = { insert, update, all, find };
