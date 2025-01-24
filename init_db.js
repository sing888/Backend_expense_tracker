const db = require('./db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS USERS (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        USERNAME TEXT UNIQUE,
        EMAIL TEXT UNIQUE,
        HASHED_PASS TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS EXPENSE (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        USER_ID INTEGER,
        AMOUNT REAL,
        CATEGORY TEXT,
        DATE TEXT,
        NOTES TEXT,
        FOREIGN KEY (USER_ID) REFERENCES USERS (ID)
    )`);
});

db.close(() => {
    console.log('Database initialized');
});
