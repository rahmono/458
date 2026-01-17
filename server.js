const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daftar_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Initialize Database and Tables
async function initDb() {
  try {
    // Create connection specifically to create DB if not exists
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await tempConnection.end();

    // Now connect to the database
    pool = mysql.createPool(dbConfig);
    console.log('Connected to MySQL database.');

    // Create Debtors Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS debtors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        balance DECIMAL(10, 2) DEFAULT 0,
        last_activity DATETIME,
        created_by VARCHAR(100)
      )
    `);

    // Create Transactions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        debtor_id VARCHAR(50),
        amount DECIMAL(10, 2),
        type ENUM('DEBT', 'PAYMENT'),
        description TEXT,
        date DATETIME,
        created_by VARCHAR(100),
        FOREIGN KEY (debtor_id) REFERENCES debtors(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Database tables initialized.');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initDb();

// --- API ROUTES ---

// Get All Debtors with their transactions
app.get('/api/debtors', async (req, res) => {
  try {
    const [debtors] = await pool.query('SELECT * FROM debtors ORDER BY last_activity DESC');
    const [transactions] = await pool.query('SELECT * FROM transactions ORDER BY date DESC');

    // Combine transactions into debtors
    const result = debtors.map(debtor => {
      const debtorTransactions = transactions.filter(t => t.debtor_id === debtor.id);
      return {
        ...debtor,
        transactions: debtorTransactions
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add New Debtor
app.post('/api/debtors', async (req, res) => {
  const { id, name, phone, balance, lastActivity, createdBy } = req.body;
  try {
    await pool.query(
      'INSERT INTO debtors (id, name, phone, balance, last_activity, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, phone, balance, new Date(lastActivity), createdBy]
    );
    res.status(201).json({ message: 'Debtor created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Transaction
app.post('/api/transactions', async (req, res) => {
  const { id, debtorId, amount, type, description, date, createdBy } = req.body;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert Transaction
    await connection.query(
      'INSERT INTO transactions (id, debtor_id, amount, type, description, date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, debtorId, amount, type, description, new Date(date), createdBy]
    );

    // 2. Update Debtor Balance and Last Activity
    const balanceChange = type === 'DEBT' ? amount : -amount;
    await connection.query(
      'UPDATE debtors SET balance = balance + ?, last_activity = ? WHERE id = ?',
      [balanceChange, new Date(date), debtorId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Transaction added and balance updated' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Catch-all handler for any request that doesn't match the above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});