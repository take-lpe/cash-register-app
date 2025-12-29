const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const dbPath = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'cash.db')
    : path.join(__dirname, 'cash.db');

const db = new sqlite3.Database(dbPath);

console.log('Database path:', dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS registers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            system_amount INTEGER,
            cash_amount INTEGER,
            difference INTEGER,
            memo TEXT
        )
    `);
});

app.get('/api/registers', (req, res) => {
    const sql = "SELECT * FROM registers ORDER BY date DESC LIMIT 7";

    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/graph-data', (req, res) => {
    const sql = "SELECT * FROM registers ORDER BY date ASC";

    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});



app.post('/api/registers', (req, res) => {
    const { date, system_amount, cash_amount, memo } = req.body;
    const difference = Number(cash_amount) - Number(system_amount);
    const sql = `INSERT INTO registers ( date, system_amount, cash_amount, difference, memo ) VALUES ( ?, ?, ?, ?, ? )`;

    db.run(sql, [date, system_amount, cash_amount, difference, memo], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Saved!", id: this.lastID });
    });
});

app.delete('/api/registers/:id', (req, res) => {
    db.run("DELETE FROM registers WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

app.listen(PORT, () => {
    console.log(`Cash App server running: http://localhost:${PORT}`);
});