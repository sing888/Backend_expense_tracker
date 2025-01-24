const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./expense_tracker.db');

module.exports = db;
