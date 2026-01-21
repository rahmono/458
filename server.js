import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto'; // For txn_id generation

dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// INCREASED PAYLOAD LIMIT FOR IMAGE UPLOAD (Up to 50MB to be safe)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- LIVE LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url } = req;
  const timestamp = new Date().toLocaleTimeString('tg-TJ');
  const telegramId = req.headers['x-telegram-user-id'] || 'Guest';
  const storeId = req.headers['x-store-id'] || 'None';

  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m'
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    let statusColor = colors.green;
    if (status >= 500) statusColor = colors.red;
    else if (status >= 400) statusColor = colors.yellow;

    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ` +
      `${colors.magenta}[User:${telegramId}]${colors.reset} ` +
      `${colors.blue}[Store:${storeId}]${colors.reset} ` +
      `${colors.cyan}${method}${colors.reset} ${url} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.gray}${duration}ms${colors.reset}`
    );
  });

  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

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

async function initDb() {
  try {
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await tempConnection.end();

    pool = mysql.createPool(dbConfig);
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MySQL database.');

    // 1. Create Stores Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_telegram_id VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE
      )
    `);

    // 2. Create Debtors Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS debtors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        balance DECIMAL(10, 2) DEFAULT 0,
        last_activity DATETIME,
        created_by VARCHAR(100),
        telegram_id VARCHAR(50),
        store_id VARCHAR(50)
      )
    `);

    // 3. Create Transactions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        debtor_id VARCHAR(50),
        amount DECIMAL(10, 2),
        type ENUM('DEBT', 'PAYMENT'),
        description TEXT,
        date DATETIME,
        created_by VARCHAR(100),
        balance_after DECIMAL(10, 2),
        FOREIGN KEY (debtor_id) REFERENCES debtors(id) ON DELETE CASCADE
      )
    `);

    // 4. Create Users Table (For Search & Preferences)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        photo_url TEXT,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active_store_id VARCHAR(50),
        language VARCHAR(10) DEFAULT 'tg',
        phone_number VARCHAR(20)
      )
    `);

    // 5. Create Collaborators Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_collaborators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id VARCHAR(50),
        user_telegram_id VARCHAR(50),
        perm_delete_debtor BOOLEAN DEFAULT FALSE,
        perm_add_debt BOOLEAN DEFAULT TRUE,
        perm_add_payment BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_collab (store_id, user_telegram_id),
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    // 6. Create Verification Requests Table (NEW)
    // Using LONGTEXT to support larger base64 images
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id VARCHAR(50) NOT NULL,
        user_telegram_id VARCHAR(50) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        custom_store_name VARCHAR(255) NOT NULL,
        image_base64 LONGTEXT, 
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    // Migrations
    try { await pool.query(`ALTER TABLE debtors ADD COLUMN telegram_id VARCHAR(50)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE debtors ADD COLUMN store_id VARCHAR(50)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN last_active_store_id VARCHAR(50)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE transactions ADD COLUMN balance_after DECIMAL(10, 2)`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'tg'`); } catch (e) {}
    try { await pool.query(`ALTER TABLE stores ADD COLUMN is_verified BOOLEAN DEFAULT FALSE`); } catch (e) {}
    try { await pool.query(`ALTER TABLE verification_requests MODIFY image_base64 LONGTEXT`); } catch (e) {}
    try { await pool.query(`ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)`); } catch (e) {}

    console.log('\x1b[32m%s\x1b[0m', '✓ Database tables initialized.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '✗ Database initialization failed:', error.message);
  }
}

initDb();

// --- TELEGRAM BOT SETUP ---
if (process.env.BOT_TOKEN) {
  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
  console.log('\x1b[36m%s\x1b[0m', '✓ Telegram Bot started with Polling.');

  // Handle /start command
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    const startParam = match[1] ? match[1].trim() : '';

    if (!user) return;

    try {
      // 1. Register User in Database (Upsert)
      await pool.query(`
        INSERT INTO users (telegram_id, first_name, username, photo_url, last_seen, language)
        VALUES (?, ?, ?, ?, NOW(), ?)
        ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        username = VALUES(username),
        last_seen = NOW()
      `, [
        user.id.toString(),
        user.first_name,
        user.username || null,
        null, 
        user.language_code === 'ru' ? 'ru' : 'tg'
      ]);

      // Check for phone verification param
      if (startParam === 'phone') {
          const opts = {
              reply_markup: {
                  keyboard: [
                      [{
                          text: "📱 Равон кардани рақам",
                          request_contact: true
                      }]
                  ],
                  resize_keyboard: true,
                  one_time_keyboard: true
              }
          };
          bot.sendMessage(chatId, "Лутфан тугмаи зерро пахш кунед, то рақами телефонатон ба аккаунти шумо пайваст шавад.", opts);
          return;
      }

      // Normal Start Flow
      const welcomeMsg = `Салом ${user.first_name}! 👋\n\nХуш омадед ба **Дафтар** - дафтари рақамии шумо.\n\nБарои идоракунии қарзҳо ва мағозаи худ тугмаи зеринро зер кунед:`;
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📒 Кушодани Дафтар",
                web_app: { url: "https://steppay.fun" } 
              }
            ]
          ]
        },
        parse_mode: 'Markdown'
      };

      bot.sendMessage(chatId, welcomeMsg, opts);

    } catch (error) {
      console.error('[Bot] Error in /start handler:', error);
      bot.sendMessage(chatId, "Хатогӣ рух дод. Лутфан дертар кӯшиш кунед.");
    }
  });

  // Handle Contact Sharing
  bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const contact = msg.contact;

      if (!contact || !contact.phone_number) return;

      // Security check: ensure the contact belongs to the sender
      if (contact.user_id !== msg.from.id) {
          bot.sendMessage(chatId, "Лутфан рақами худро равон кунед.");
          return;
      }

      try {
          // Format phone (remove + if exists)
          let phone = contact.phone_number.replace('+', '');
          
          await pool.query('UPDATE users SET phone_number = ? WHERE telegram_id = ?', [phone, contact.user_id.toString()]);
          
          const opts = {
            reply_markup: {
                remove_keyboard: true,
                inline_keyboard: [
                    [
                      {
                        text: "📒 Кушодани Дафтар",
                        web_app: { url: "https://steppay.fun" } 
                      }
                    ]
                ]
            }
          };

          bot.sendMessage(chatId, "Раҳмат! Рақами шумо бо муваффақият пайваст шуд. Акнун метавонед барномаро кушоед. ✅", opts);

      } catch (error) {
          console.error("Error saving phone:", error);
          bot.sendMessage(chatId, "Хатогӣ ҳангоми сабти рақам.");
      }
  });

  bot.on('polling_error', (error) => {
    console.error('[Bot] Polling Error:', error.code); 
  });
} else {
  console.log('\x1b[33m%s\x1b[0m', '! BOT_TOKEN not found in .env. Bot features disabled.');
}

// --- HELPER ---
const getTelegramId = (req) => {
  const id = req.headers['x-telegram-user-id'];
  return id || 'public'; 
};

const getStoreId = (req) => {
    return req.headers['x-store-id'];
};

// Check permissions helper
async function checkStoreAccess(storeId, telegramId) {
    if (!storeId || !telegramId) return { hasAccess: false };

    // 1. Check if owner
    const [stores] = await pool.query('SELECT owner_telegram_id FROM stores WHERE id = ?', [storeId]);
    if (stores.length && stores[0].owner_telegram_id === telegramId) {
        return { hasAccess: true, isOwner: true, permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true } };
    }

    // 2. Check if collaborator
    const [collabs] = await pool.query('SELECT * FROM store_collaborators WHERE store_id = ? AND user_telegram_id = ?', [storeId, telegramId]);
    if (collabs.length) {
        return { 
            hasAccess: true, 
            isOwner: false, 
            permissions: {
                canDeleteDebtor: !!collabs[0].perm_delete_debtor,
                canAddDebt: !!collabs[0].perm_add_debt,
                canAddPayment: !!collabs[0].perm_add_payment
            }
        };
    }

    return { hasAccess: false, isOwner: false };
}

// --- ADMIN API ROUTES (Protected by simple credential check) ---

const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer mock-admin-token-123') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded credentials as requested
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, token: 'mock-admin-token-123' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/admin/verifications', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT vr.*, u.first_name as owner_name, u.username as owner_username
            FROM verification_requests vr
            LEFT JOIN users u ON vr.user_telegram_id = u.telegram_id
            ORDER BY vr.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/verifications/:id/status', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update Request Status
        await connection.query('UPDATE verification_requests SET status = ? WHERE id = ?', [status, id]);

        // 2. If Approved, Update Store Verification Status & Name
        if (status === 'APPROVED') {
            const [rows] = await connection.query('SELECT store_id, custom_store_name FROM verification_requests WHERE id = ?', [id]);
            if (rows.length > 0) {
                const { store_id, custom_store_name } = rows[0];
                await connection.query('UPDATE stores SET is_verified = TRUE, name = ? WHERE id = ?', [custom_store_name, store_id]);
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Admin: Get Users with Pagination & Search
app.get('/api/admin/users', isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const q = req.query.q || '';
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT * FROM users';
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        let params = [];

        if (q) {
            const searchClause = ' WHERE first_name LIKE ? OR username LIKE ? OR phone_number LIKE ?';
            query += searchClause;
            countQuery += searchClause;
            const searchParam = `%${q}%`;
            params = [searchParam, searchParam, searchParam];
        }

        // Add Limit/Offset
        query += ' ORDER BY last_seen DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [users] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, params);
        
        res.json({
            users,
            total: countResult[0].total,
            page,
            totalPages: Math.ceil(countResult[0].total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get User's Stores
app.get('/api/admin/users/:telegramId/stores', isAdmin, async (req, res) => {
    const { telegramId } = req.params;
    try {
        // Fetch stores owned by this user, include count of debtors
        const [stores] = await pool.query(`
            SELECT s.*, 
            (SELECT COUNT(*) FROM debtors WHERE store_id = s.id) as debtors_count
            FROM stores s
            WHERE owner_telegram_id = ?
            ORDER BY s.created_at DESC
        `, [telegramId]);
        res.json(stores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get Store's Debtors
app.get('/api/admin/stores/:storeId/debtors', isAdmin, async (req, res) => {
    const { storeId } = req.params;
    try {
        const [debtors] = await pool.query(`
            SELECT * FROM debtors 
            WHERE store_id = ?
            ORDER BY balance DESC
        `, [storeId]);
        res.json(debtors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- CLIENT API ROUTES ---

// AUTH: Sync User Data (Upsert) and Return Preferences + Phone
app.post('/api/auth/sync', async (req, res) => {
    const { id, first_name, username, photo_url } = req.body;
    if (!id) return res.status(400).send('ID required');

    try {
        await pool.query(`
            INSERT INTO users (telegram_id, first_name, username, photo_url, last_seen)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            username = VALUES(username),
            photo_url = VALUES(photo_url),
            last_seen = NOW()
        `, [id.toString(), first_name, username, photo_url]);

        // Retrieve user data including last_active_store_id, language AND PHONE NUMBER
        const [rows] = await pool.query('SELECT last_active_store_id, language, phone_number FROM users WHERE telegram_id = ?', [id.toString()]);
        
        res.json({ 
            success: true, 
            lastActiveStoreId: rows.length > 0 ? rows[0].last_active_store_id : null,
            language: rows.length > 0 ? rows[0].language : 'tg',
            phoneNumber: rows.length > 0 ? rows[0].phone_number : null // Return phone
        });
    } catch (error) {
        console.error('Sync error', error);
        res.status(500).json({ error: error.message });
    }
});

// USER: Update Last Active Store
app.put('/api/users/me/store', async (req, res) => {
    const telegramId = getTelegramId(req);
    const { storeId } = req.body;
    
    if (telegramId === 'public') return res.status(200).json({ success: true }); // No-op for public

    try {
        await pool.query('UPDATE users SET last_active_store_id = ? WHERE telegram_id = ?', [storeId, telegramId]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// USER: Update Language
app.put('/api/users/me/language', async (req, res) => {
    const telegramId = getTelegramId(req);
    const { language } = req.body;
    
    if (telegramId === 'public') return res.status(200).json({ success: true }); 

    try {
        await pool.query('UPDATE users SET language = ? WHERE telegram_id = ?', [language, telegramId]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// USERS: Search (Updated to include Phone Number)
app.get('/api/users/search', async (req, res) => {
    const q = req.query.q;
    const telegramId = getTelegramId(req); // Exclude self
    if (!q || q.length < 2) return res.json([]);

    try {
        // Added OR phone_number LIKE ? to the WHERE clause
        const [users] = await pool.query(`
            SELECT telegram_id, first_name, username, photo_url 
            FROM users 
            WHERE (first_name LIKE ? OR username LIKE ? OR phone_number LIKE ?) 
            AND telegram_id != ?
            LIMIT 5
        `, [`%${q}%`, `%${q}%`, `%${q}%`, telegramId]);
        
        res.json(users.map(u => ({
            telegramId: u.telegram_id,
            firstName: u.first_name,
            username: u.username,
            photoUrl: u.photo_url
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// COLLABORATORS: Get List
app.get('/api/stores/:storeId/collaborators', async (req, res) => {
    const { storeId } = req.params;
    const telegramId = getTelegramId(req);

    // Only owner can see list (or maybe other collabs? let's stick to owner for now)
    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner && !access.hasAccess) return res.status(403).json({ error: 'Access denied' });

    try {
        const [collabs] = await pool.query(`
            SELECT sc.*, u.first_name, u.username, u.photo_url 
            FROM store_collaborators sc
            LEFT JOIN users u ON sc.user_telegram_id = u.telegram_id
            WHERE sc.store_id = ?
        `, [storeId]);

        res.json(collabs.map(c => ({
            id: c.id,
            userTelegramId: c.user_telegram_id,
            firstName: c.first_name || 'Unknown',
            username: c.username,
            photoUrl: c.photo_url,
            permissions: {
                canDeleteDebtor: !!c.perm_delete_debtor,
                canAddDebt: !!c.perm_add_debt,
                canAddPayment: !!c.perm_add_payment
            }
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// COLLABORATORS: Add
app.post('/api/stores/:storeId/collaborators', async (req, res) => {
    const { storeId } = req.params;
    const { userTelegramId, permissions } = req.body;
    const telegramId = getTelegramId(req);

    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner) return res.status(403).json({ error: 'Only owner can add collaborators' });

    try {
        await pool.query(`
            INSERT INTO store_collaborators 
            (store_id, user_telegram_id, perm_delete_debtor, perm_add_debt, perm_add_payment)
            VALUES (?, ?, ?, ?, ?)
        `, [
            storeId, 
            userTelegramId, 
            permissions.canDeleteDebtor, 
            permissions.canAddDebt, 
            permissions.canAddPayment
        ]);
        res.status(201).json({ success: true });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'User is already a collaborator' });
        }
        res.status(500).json({ error: error.message });
    }
});

// COLLABORATORS: Delete
app.delete('/api/stores/:storeId/collaborators/:userId', async (req, res) => {
    const { storeId, userId } = req.params;
    const telegramId = getTelegramId(req);

    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner) return res.status(403).json({ error: 'Only owner can remove collaborators' });

    try {
        await pool.query('DELETE FROM store_collaborators WHERE store_id = ? AND user_telegram_id = ?', [storeId, userId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// STORES: Get all stores (Modified to include shared stores)
app.get('/api/stores', async (req, res) => {
    const telegramId = getTelegramId(req);
    
    try {
        // 1. Fetch Owned Stores with Verification Status
        // We select the STATUS of the LATEST request for this store.
        const [ownedStores] = await pool.query(`
            SELECT s.*,
            (SELECT status FROM verification_requests WHERE store_id = s.id ORDER BY created_at DESC LIMIT 1) as latest_verification_status
            FROM stores s
            WHERE owner_telegram_id = ? 
            ORDER BY created_at ASC
        `, [telegramId]);
        
        // 2. Fetch Shared Stores
        const [sharedStores] = await pool.query(`
            SELECT s.*, sc.perm_delete_debtor, sc.perm_add_debt, sc.perm_add_payment,
            (SELECT status FROM verification_requests WHERE store_id = s.id ORDER BY created_at DESC LIMIT 1) as latest_verification_status
            FROM stores s
            JOIN store_collaborators sc ON s.id = sc.store_id
            WHERE sc.user_telegram_id = ?
        `, [telegramId]);

        // Map owned
        const result = ownedStores.map(s => ({
            id: s.id,
            name: s.name,
            ownerTelegramId: s.owner_telegram_id,
            createdAt: s.created_at,
            isOwner: true,
            isVerified: !!s.is_verified,
            verificationStatus: s.latest_verification_status || 'NONE', // Map the new field
            permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true }
        }));

        // Map shared
        sharedStores.forEach(s => {
            result.push({
                id: s.id,
                name: s.name + ' (Ҳамкор)',
                ownerTelegramId: s.owner_telegram_id,
                createdAt: s.created_at,
                isOwner: false,
                isVerified: !!s.is_verified,
                verificationStatus: s.latest_verification_status || 'NONE',
                permissions: {
                    canDeleteDebtor: !!s.perm_delete_debtor,
                    canAddDebt: !!s.perm_add_debt,
                    canAddPayment: !!s.perm_add_payment
                }
            });
        });

        // 3. Create default if absolutely nothing exists
        if (result.length === 0) {
            const defaultStoreId = Date.now().toString();
            const defaultStoreName = 'Мағозаи асосӣ';
            await pool.query('INSERT INTO stores (id, name, owner_telegram_id) VALUES (?, ?, ?)', [defaultStoreId, defaultStoreName, telegramId]);
            return res.json([{
                id: defaultStoreId,
                name: defaultStoreName,
                ownerTelegramId: telegramId,
                createdAt: new Date(),
                isOwner: true,
                isVerified: false,
                verificationStatus: 'NONE',
                permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true }
            }]);
        }

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stores', async (req, res) => {
    const telegramId = getTelegramId(req);
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Store name is required' });

    try {
        const newStoreId = Date.now().toString();
        await pool.query('INSERT INTO stores (id, name, owner_telegram_id) VALUES (?, ?, ?)', [newStoreId, name, telegramId]);
        res.status(201).json({ 
            message: 'Store created',
            store: {
                id: newStoreId,
                name: name,
                ownerTelegramId: telegramId,
                isOwner: true,
                isVerified: false,
                permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// STORES: Verify Request (NEW)
app.post('/api/stores/:storeId/verify', async (req, res) => {
    const { storeId } = req.params;
    const telegramId = getTelegramId(req);
    const { documentType, imageBase64, customStoreName } = req.body;

    console.log(`[Verify] Request received for store: ${storeId} from user: ${telegramId}`);

    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner) {
        console.error(`[Verify] Access denied for store ${storeId}`);
        return res.status(403).json({ error: 'Only owner can submit verification' });
    }

    try {
        console.log(`[Verify] Inserting into database...`);
        await pool.query(`
            INSERT INTO verification_requests 
            (store_id, user_telegram_id, document_type, custom_store_name, image_base64)
            VALUES (?, ?, ?, ?, ?)
        `, [storeId, telegramId, documentType, customStoreName, imageBase64]);
        
        console.log(`[Verify] Insert successful`);
        res.status(201).json({ success: true, message: 'Request submitted' });
    } catch (error) {
        console.error("===== VERIFICATION SUBMIT ERROR =====");
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// DEBTORS: Get All
app.get('/api/debtors', async (req, res) => {
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);

  try {
    const access = await checkStoreAccess(storeId, telegramId);
    
    // Allow public for demo/guest if no auth headers, else restrict
    if (!access.hasAccess && telegramId !== 'public') {
        // If not owner/collab, maybe return empty or error.
        // For backwards compatibility with "guest" mode:
        if (storeId && storeId !== 'undefined') return res.status(403).json({ error: 'Access denied to this store' });
    }

    let query = 'SELECT * FROM debtors WHERE 1=1';
    let params = [];

    if (storeId && storeId !== 'undefined') {
        query += ' AND store_id = ?';
        params.push(storeId);
    } else {
        // Legacy/Guest behavior: get by telegram_id if not specific store
         query += ' AND telegram_id = ?';
         params.push(telegramId);
    }
    
    query += ' ORDER BY last_activity DESC';

    const [debtors] = await pool.query(query, params);

    if (debtors.length === 0) return res.json([]);

    const debtorIds = debtors.map(d => d.id);
    let transactions = [];
    if (debtorIds.length > 0) {
      const placeholders = debtorIds.map(() => '?').join(',');
      const [trx] = await pool.query(
        `SELECT * FROM transactions WHERE debtor_id IN (${placeholders}) ORDER BY date DESC`,
        debtorIds
      );
      transactions = trx;
    }

    // MAP DB SNAKE_CASE TO FRONTEND CAMELCASE
    const result = debtors.map(d => {
      const debtorTransactions = transactions
        .filter(t => t.debtor_id === d.id)
        .map(t => ({
            id: t.id,
            amount: parseFloat(t.amount), // Ensure number
            type: t.type,
            description: t.description,
            date: t.date,
            createdBy: t.created_by, // Map from DB column
            balanceAfter: t.balance_after !== null ? parseFloat(t.balance_after) : undefined // Map from DB column
        }));

      return {
          id: d.id,
          name: d.name,
          phone: d.phone,
          balance: parseFloat(d.balance),
          lastActivity: d.last_activity,
          createdBy: d.created_by, // Map from DB column
          storeId: d.store_id,
          transactions: debtorTransactions
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debtors', async (req, res) => {
  const { id, name, phone, balance, lastActivity, createdBy } = req.body;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);

  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });
  
  try {
    await pool.query(
      'INSERT INTO debtors (id, name, phone, balance, last_activity, created_by, telegram_id, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, balance, new Date(lastActivity), createdBy, telegramId, storeId]
    );
    res.status(201).json({ message: 'Debtor created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Debtor (Name/Phone)
app.put('/api/debtors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);

  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });

  // Currently allowing update if you have access. 
  // Stricter: if (!access.isOwner && !access.permissions.canDeleteDebtor) ...

  try {
      await pool.query('UPDATE debtors SET name = ?, phone = ? WHERE id = ?', [name, phone, id]);
      res.json({ success: true });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { id, debtorId, amount, type, description, date, createdBy } = req.body;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);
  
  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });

  // Permission Check
  if (!access.isOwner && telegramId !== 'public') {
      if (type === 'DEBT' && !access.permissions.canAddDebt) {
          return res.status(403).json({ error: 'Permission denied: Cannot add debt' });
      }
      if (type === 'PAYMENT' && !access.permissions.canAddPayment) {
          return res.status(403).json({ error: 'Permission denied: Cannot add payment' });
      }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update Debtor Balance first
    const balanceChange = type === 'DEBT' ? amount : -amount;
    await connection.query(
      'UPDATE debtors SET balance = balance + ?, last_activity = ? WHERE id = ?',
      [balanceChange, new Date(date), debtorId]
    );

    // 2. Fetch the new balance to store as history
    const [debtorRows] = await connection.query('SELECT balance FROM debtors WHERE id = ?', [debtorId]);
    const currentBalance = debtorRows.length > 0 ? parseFloat(debtorRows[0].balance) : 0;

    // 3. Insert Transaction with balance_after
    await connection.query(
      'INSERT INTO transactions (id, debtor_id, amount, type, description, date, created_by, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, debtorId, amount, type, description, new Date(date), createdBy, currentBalance]
    );

    await connection.commit();
    res.status(201).json({ message: 'Transaction added' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/debtors/:id', async (req, res) => {
  const { id } = req.params;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);

  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });

  // Permission Check
  if (!access.isOwner && !access.permissions.canDeleteDebtor && telegramId !== 'public') {
      return res.status(403).json({ error: 'Permission denied: Cannot delete debtor' });
  }

  try {
    // Check if debtor belongs to this store
    const [d] = await pool.query('SELECT id FROM debtors WHERE id = ? AND store_id = ?', [id, storeId]);
    if (d.length === 0) return res.status(404).json({ message: 'Debtor not found in this store' });

    await pool.query('DELETE FROM debtors WHERE id = ?', [id]);
    res.json({ message: 'Debtor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req); 
  // Frontend might not send storeId on delete transaction depending on implementation, 
  // but we should verify the transaction belongs to a debtor in a store we have access to.

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(`
      SELECT t.*, d.store_id 
      FROM transactions t
      JOIN debtors d ON t.debtor_id = d.id
      WHERE t.id = ?
    `, [id]);

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = rows[0];
    const tStoreId = transaction.store_id;

    const access = await checkStoreAccess(tStoreId, telegramId);
    if (!access.hasAccess && telegramId !== 'public') {
        throw new Error("Access denied");
    }

    // Permission Check: Deleting a transaction essentially modifies debt/payment history.
    // Usually "Delete Debtor" is the high-risk permission. 
    // Let's assume you need the specific permission matching the transaction type to delete it.
    if (!access.isOwner && telegramId !== 'public') {
        if (transaction.type === 'DEBT' && !access.permissions.canAddDebt) {
             throw new Error("Permission denied");
        }
        if (transaction.type === 'PAYMENT' && !access.permissions.canAddPayment) {
             throw new Error("Permission denied");
        }
    }

    const reverseAmount = transaction.type === 'DEBT' ? -transaction.amount : transaction.amount;
    await connection.query('UPDATE debtors SET balance = balance + ? WHERE id = ?', [reverseAmount, transaction.debtor_id]);
    await connection.query('DELETE FROM transactions WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// --- SMS SENDING ENDPOINT ---
app.post('/api/sms/send', async (req, res) => {
    const telegramId = getTelegramId(req);
    const storeId = getStoreId(req);
    const { debtorId } = req.body;

    // 1. Check Store Access
    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.hasAccess) return res.status(403).json({ error: 'Access denied' });

    try {
        // 2. Check Verification Status (STRICT)
        const [storeRows] = await pool.query('SELECT is_verified, name FROM stores WHERE id = ?', [storeId]);
        if (storeRows.length === 0 || !storeRows[0].is_verified) {
             return res.status(403).json({ 
                 error: 'VERIFICATION_REQUIRED', 
                 message: 'Store must be verified to send SMS' 
             });
        }
        
        const storeName = storeRows[0].name;

        // 3. Get Debtor Details
        const [debtorRows] = await pool.query('SELECT name, phone, balance FROM debtors WHERE id = ?', [debtorId]);
        if (debtorRows.length === 0) {
            return res.status(404).json({ error: 'Debtor not found' });
        }
        
        const debtor = debtorRows[0];
        const balance = parseFloat(debtor.balance);

        if (balance <= 0) {
            return res.status(400).json({ error: 'No debt to remind about' });
        }

        // 4. Construct Message
        const message = `Салом, Шумо аз дукони ${storeName} ${balance} сомонӣ қарздор ҳастед, агар қарзатонро сари вақт омада супоред хушҳол мешавем.`;
        
        // 5. Format Phone (Ensure 992 prefix, strip +)
        let phone = debtor.phone.replace(/\D/g, ''); // Remove non-digits
        if (phone.length === 9 && phone.startsWith('9')) {
             phone = '992' + phone;
        } else if (phone.startsWith('00')) {
             phone = phone.substring(2);
        }

        // 6. Call OsonSMS API
        // Params: from, phone_number, msg, login, txn_id, str_hash (Bearer token used instead if docs imply standard oauth, but snippet says "Token and login provided". We use Bearer as per snippet "Authorization: Bearer ...")
        
        const txn_id = crypto.randomUUID();
        const smsLogin = process.env.SMS_LOGIN;
        const smsToken = process.env.SMS_TOKEN;
        const smsSender = process.env.SMS_SENDER || 'OsonSMS';
        const smsServer = process.env.SMS_SERVER || 'https://api.osonsms.com/sendsms_v1.php';

        const smsUrl = new URL(smsServer);
        smsUrl.searchParams.append('from', smsSender);
        smsUrl.searchParams.append('phone_number', phone);
        smsUrl.searchParams.append('msg', message);
        smsUrl.searchParams.append('login', smsLogin);
        smsUrl.searchParams.append('txn_id', txn_id);
        
        // Note: Using GET as per documentation snippet
        const response = await fetch(smsUrl.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${smsToken}`
            }
        });

        const responseData = await response.json();

        // OsonSMS typically returns { status: "ok", ... } or error
        if (responseData.status === 'ok' || responseData.error_code === 0) {
             res.json({ success: true, txn_id });
        } else {
             console.error("SMS API Error:", responseData);
             res.status(500).json({ error: 'SMS Provider Error', details: responseData });
        }

    } catch (error) {
        console.error("SMS Send Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- GLOBAL ERROR HANDLER ---
// Catches payload errors (413) that middleware doesn't catch locally
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON Error:', err.message);
    return res.status(400).send({ error: 'Invalid JSON syntax' });
  }
  
  if (err && err.type === 'entity.too.large') {
     console.error('Payload Too Large Error:', err.message);
     return res.status(413).send({ error: 'Суръати расм аз ҳад зиёд аст. Лутфан расми хурдтарро интихоб кунед.' });
  }

  console.error('Unhandled Global Error:', err);
  next(err);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
console.clear();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Collaborator system active...');
});