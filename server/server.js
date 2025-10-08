// server.js — อิงไฟล์เดิมของคุณ 100% + เพิ่ม dev route + /api/me + ปรับ CSP ให้เชื่อมต่อได้

import 'dotenv/config';
import bcrypt from 'bcrypt';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

import adminOrders from './routes/adminOrders.js';
import adminProducts from './routes/adminProducts.js';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import addressesRoutes from './routes/addresses.js';
import requireAdmin from './middleware/requireAdmin.js';

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'toy_store_secret';
const isProd = process.env.NODE_ENV === 'production';

// ---------------- CORS (dev/prod) ----------------
const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    process.env.FRONTEND_URL,  // e.g. https://xxxx.ngrok-free.app
    process.env.FRONTEND_URL2, // เผื่อมีอีกอัน
  ].filter(Boolean)
);

const ngrokRegex = /^https?:\/\/[a-z0-9-]+\.ngrok(-free)?\.app$/i;

// ...
app.use(
  cors({
    origin(origin, cb) {
      const ok =
        !origin ||
        origin === 'http://localhost:3000' ||
        /^https?:\/\/[a-z0-9-]+\.ngrok(-free)?\.app$/i.test(origin) ||
        origin === process.env.FRONTEND_URL ||
        origin === process.env.FRONTEND_URL2;
      cb(null, ok);
    },
    credentials: true,
    // 👇 สำคัญ: อนุญาต Authorization header
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
  })
);

// ตอบพรีไฟลท์ทุกเส้นทาง
app.options(
  '*',
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
  })
);

// ---------------- Helmet ----------------
// dev ปิด CSP, prod กำหนด connectSrc ชัดเจน
app.use(
  helmet(
    isProd
      ? {
          contentSecurityPolicy: {
            useDefaults: true,
            directives: {
              connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:3001', 'ws://localhost:3000', 'ws://localhost:3001'],
              imgSrc: ["'self'", 'data:'],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
            },
          },
          crossOriginResourcePolicy: { policy: 'cross-origin' },
        }
      : { contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }
  )
);

app.use(express.json());

// ---------------- Static images ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.resolve(__dirname, '..', 'public', 'images')));

// ---------------- Health ----------------
app.get('/api/health', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: r[0]?.ok === 1 });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// ---------------- Products (คงแบบเดิม) ----------------
const SELECT_PRODUCTS = `
  SELECT
    p.product_id,
    p.category_slug,
    p.name,
    p.price,
    p.original_price,
    p.on_sale,
    COALESCE(NULLIF(p.image,''), p.image_url) AS image_url,
    COALESCE(inv.qty, p.stock, 0) AS stock
  FROM products p
  INNER JOIN (
    SELECT name, MIN(product_id) AS keep_id
    FROM products
    GROUP BY name
  ) one ON one.keep_id = p.product_id
  LEFT JOIN (
    SELECT product_id, SUM(quantity) AS qty
    FROM inventory
    GROUP BY product_id
  ) inv ON inv.product_id = p.product_id
`;

app.get('/api/products', async (_req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_PRODUCTS} ORDER BY p.product_id ASC`);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/products error:', e.code || e.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/new', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 12, 100));
    const [rows] = await pool.query(`${SELECT_PRODUCTS} ORDER BY p.product_id DESC LIMIT ?`, [limit]);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/products/new error:', e.code || e.message);
    res.status(500).json({ error: 'Failed to fetch new products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[row]] = await pool.query(`${SELECT_PRODUCTS} HAVING p.product_id = ?`, [id]);
  if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (e) {
    console.error('GET /api/products/:id error:', e.code || e.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// --------- Product Search (เดิม) ---------
app.get('/api/products/search', async (req, res) => {
  try {
    const { q = "", maxPrice, onSale, popular, newest, limit = 12 } = req.query;

    const params = [];
    let sql = `
      SELECT
        p.product_id,
        p.name,
        p.price,
        COALESCE(NULLIF(p.image,''), p.image_url) AS image,
        p.original_price,
        p.on_sale,
        p.category_slug,
        p.created_at,
        ROUND(
          IFNULL(
            (NULLIF(p.original_price,0) - p.price) / NULLIF(p.original_price,0) * 100
          , 0)
        ) AS discount_percent,
        IFNULL(SUM(CASE WHEN o.status = 'completed' THEN od.quantity ELSE 0 END), 0) AS sold_qty
      FROM products p
      LEFT JOIN order_details od ON od.product_id = p.product_id
      LEFT JOIN orders o ON o.order_id = od.order_id
      WHERE 1=1
    `;

    if (q) { sql += ` AND (p.name LIKE ? OR p.category_slug LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
    if (maxPrice) { sql += ` AND p.price <= ?`; params.push(Number(maxPrice)); }
    if (onSale)   { sql += ` AND p.on_sale = 1`; }

    sql += `
      GROUP BY p.product_id, p.name, p.price, image, p.image_url,
               p.original_price, p.on_sale, p.category_slug, p.created_at
    `;

    let orderBy = `p.created_at DESC`;
    if (popular) orderBy = `sold_qty DESC, discount_percent DESC, p.created_at DESC`;
    if (newest)  orderBy = `p.created_at DESC`;

    sql += ` ORDER BY ${orderBy} LIMIT ?`;
    params.push(Math.min(Number(limit) || 12, 100));

    const [rows] = await pool.query(sql, params);

    res.json(
      rows.map(r => ({
        product_id: r.product_id,
        name: r.name,
        price: r.price,
        image: r.image,
        original_price: r.original_price,
        on_sale: r.on_sale,
        category_slug: r.category_slug,
        created_at: r.created_at,
        discount: r.discount_percent,
        sold_qty: r.sold_qty,
      }))
    );
  } catch (e) {
    console.error('GET /api/products/search error:', e.code || e.message);
    res.status(500).json({ error: 'product_search_failed' });
  }
});

// --------- AI Recommendations (เดิม) ---------
app.get('/api/ai/recommendations', async (req, res) => {
  try {
    const { tag, maxPrice, onSale, popular, newest, limit = 12 } = req.query;
    const params = [];
    let sql = `
      SELECT
        p.product_id,
        p.name,
        p.price,
        COALESCE(NULLIF(p.image,''), p.image_url) AS image,
        p.original_price,
        p.on_sale,
        p.category_slug,
        p.created_at,
        ROUND(IFNULL((NULLIF(p.original_price,0) - p.price) / NULLIF(p.original_price,0) * 100,0)) AS discount_percent,
        IFNULL(SUM(CASE WHEN o.status='completed' THEN od.quantity ELSE 0 END),0) AS sold_qty
      FROM products p
      LEFT JOIN order_details od ON od.product_id = p.product_id
      LEFT JOIN orders o ON o.order_id = od.order_id
      WHERE 1=1
    `;
    if (tag)      { sql += ` AND p.category_slug = ?`; params.push(tag); }
    if (maxPrice) { sql += ` AND p.price <= ?`;       params.push(Number(maxPrice)); }
    if (onSale)   { sql += ` AND p.on_sale = 1`; }

    sql += `
      GROUP BY p.product_id, p.name, p.price, image, p.image_url,
               p.original_price, p.on_sale, p.category_slug, p.created_at
    `;

    let orderBy = `p.created_at DESC`;
    if (popular) orderBy = `sold_qty DESC, discount_percent DESC, p.created_at DESC`;
    if (newest)  orderBy = `p.created_at DESC`;

    sql += ` ORDER BY ${orderBy} LIMIT ?`;
    params.push(Math.min(Number(limit) || 12, 100));

    const [rows] = await pool.query(sql, params);

    res.json(
      rows.map(r => ({
        product_id: r.product_id,
        name: r.name,
        price: r.price,
        image: r.image,
        original_price: r.original_price,
        on_sale: r.on_sale,
        category_slug: r.category_slug,
        created_at: r.created_at,
        discount: r.discount_percent,
        sold_qty: r.sold_qty,
      }))
    );
  } catch (e) {
    console.error('GET /api/ai/recommendations error:', e.code || e.message);
    res.status(500).json({ error: 'recommendations_failed' });
  }
});

// ---------------- Auth guard ----------------
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user_id = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// ---------------- Mount routes ----------------
app.use('/api/cart', requireAuth, cartRoutes);
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api', authRoutes);

// ✅ Admin routes (ต้องผ่าน requireAuth + requireAdmin)
app.use('/api/admin/orders', requireAuth, requireAdmin, adminOrders);
app.use('/api/admin/products', requireAuth, requireAdmin, adminProducts);

// ---------------- DEV route (ทดสอบเท่านั้น) ----------------
// ใช้เช็ก user+role จากอีเมลได้เร็ว ๆ โดยไม่ต้องมี token
app.get('/api/dev/user/:email', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, email, role FROM users WHERE email = ? LIMIT 1',
      [req.params.email]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('DEV /api/dev/user/:email error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ ตรวจ token เพื่อเช็ก user role (ใช้สำหรับหน้า /admin)
app.get('/api/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    pool.query(
      'SELECT user_id, email, role FROM users WHERE user_id = ? LIMIT 1',
      [decoded.id],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }
        if (!results || results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
      }
    );
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

// ---------------- Error handler ----------------
app.use((err, _req, res, _next) => {
  console.error('UNCAUGHT ERROR:', err);
  res.status(500).json({ error: 'internal error' });
});

// ---------------- Start Server ----------------
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`API running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error('👉 แก้ชั่วคราว: ใช้พอร์ตอื่นเช่น 3002');
    console.error('   Windows (CMD):   set PORT=3002 && npm run dev');
    console.error('   PowerShell:      $env:PORT=3002; npm run dev');
    console.error('   Linux/macOS:     PORT=3002 npm run dev\n');
    process.exit(1);
  } else {
    console.error(err);
    process.exit(1);
  }
});
