// server.js — fixed (keep original structure; add only AI recommendations)
// NOTE: based on your original file; only the AI endpoint is added.

import 'dotenv/config';                 // ← โหลด env ตั้งแต่ต้น
import authRoutes from "./routes/auth.js";
import bcrypt from 'bcrypt';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

import { pool } from './db.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'toy_store_secret';
const JWT_EXPIRES = '7d';
const USER_ID_DEFAULT = 1;

// CORS (dev)
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

// Helmet (ปรับตาม env)
const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet(
    isProd
      ? {
          contentSecurityPolicy: {
            useDefaults: true,
            directives: {
              connectSrc: ["'self'", 'http://localhost:3000', 'ws://localhost:3000', 'http://localhost:3001'],
              imgSrc: ["'self'", 'data:'],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
            },
          },
          crossOriginResourcePolicy: { policy: 'cross-origin' },
        }
      : {
          contentSecurityPolicy: false,
          crossOriginResourcePolicy: { policy: 'cross-origin' },
        }
  )
);

app.use(express.json());

// static images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.resolve(__dirname, '..', 'public', 'images')));

// --------- Health ---------
app.get('/api/health', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: r[0].ok === 1 });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// --------- Products ---------
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

app.get("/api/products/search", async (req, res) => {
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
        p.created_at
      FROM products p
      WHERE 1=1
    `;

    if (q) {
      sql += ` AND (p.name LIKE ? OR p.category_slug LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }
    if (maxPrice) { sql += ` AND p.price <= ?`; params.push(Number(maxPrice)); }
    if (onSale)   { sql += ` AND p.on_sale = 1`; }

    // จัดเรียง: popular(newest) → newest → default
    let orderBy = `p.created_at DESC`;
    if (popular) orderBy = `p.on_sale DESC, p.created_at DESC`;
    if (newest)  orderBy = `p.created_at DESC`;

    sql += ` ORDER BY ${orderBy} LIMIT ?`;
    params.push(Math.min(Number(limit) || 12, 100));

    const [rows] = await pool.query(sql, params);

    const mapped = rows.map(r => {
      // คำนวณ % ลดราคาอย่างปลอดภัย
      let discount = 0;
      const op = Number(r.original_price || 0);
      if (op > 0) {
        discount = Math.round(((op - Number(r.price || 0)) / op) * 100);
        if (!isFinite(discount)) discount = 0;
      }
      return {
        product_id: r.product_id,
        name: r.name,
        price: r.price,
        image: r.image,
        original_price: r.original_price,
        on_sale: r.on_sale,
        category_slug: r.category_slug,
        created_at: r.created_at,
        discount
      };
    });

    res.json(mapped);
  } catch (e) {
    console.error("GET /api/products/search error:", e);
    res.status(500).json({ error: "product_search_failed" });
  }
});

// --------- Product Search (AI-friendly) ---------
// GET /api/products/search?q=&maxPrice=&onSale=1&popular=1&newest=1&limit=12
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
        -- % ส่วนลด
        ROUND(
          IFNULL(
            (NULLIF(p.original_price,0) - p.price) / NULLIF(p.original_price,0) * 100
          , 0)
        ) AS discount_percent,
        -- ยอดขายรวม (เฉพาะออเดอร์เสร็จสิ้น)
        IFNULL(SUM(CASE WHEN o.status = 'completed' THEN od.quantity ELSE 0 END), 0) AS sold_qty
      FROM products p
      LEFT JOIN order_details od ON od.product_id = p.product_id
      LEFT JOIN orders o ON o.order_id = od.order_id
      WHERE 1=1
    `;

    // คำค้นหาจริงจากผู้ใช้: name/category_slug
    if (q) {
      sql += ` AND (p.name LIKE ? OR p.category_slug LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    if (maxPrice) { sql += ` AND p.price <= ?`; params.push(Number(maxPrice)); }
    if (onSale)   { sql += ` AND p.on_sale = 1`; }

    sql += `
      GROUP BY
        p.product_id, p.name, p.price, p.image, p.image_url,
        p.original_price, p.on_sale, p.category_slug, p.created_at
    `;

    let orderBy = `p.created_at DESC`; // default: ของใหม่ก่อน
    if (popular) orderBy = `sold_qty DESC, discount_percent DESC, p.created_at DESC`;
    if (newest)  orderBy = `p.created_at DESC`;

    sql += ` ORDER BY ${orderBy} LIMIT ?`;
    params.push(Math.min(Number(limit) || 12, 100));

    const [rows] = await pool.query(sql, params);

    const mapped = rows.map(r => ({
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
    }));

    res.json(mapped);
  } catch (e) {
    console.error('GET /api/products/search error:', e.code || e.message);
    res.status(500).json({ error: 'product_search_failed' });
  }
});

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

// --------- AI Recommendations ---------
// เพิ่มเฉพาะ endpoint นี้: /api/ai/recommendations
// รองรับ ?popular=1&newest=1&tag=gundam&maxPrice=500&onSale=1&limit=6
app.get('/api/ai/recommendations', async (req, res) => {
  try {
    const {
      tag,           // category_slug เช่น gundam/anime/game/superhero
      maxPrice,      // ราคาเพดาน
      onSale,        // "1" เฉพาะลดราคา
      popular,       // "1" เรียงยอดนิยม(จากยอดขายจริง)
      newest,        // "1" เรียงมาใหม่
      limit = 12,
    } = req.query;

    const params = [];
    // ใช้ยอดขายจริง (เฉพาะออเดอร์ completed)
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

    if (tag)      { sql += ` AND p.category_slug = ?`; params.push(tag); }
    if (maxPrice) { sql += ` AND p.price <= ?`;       params.push(Number(maxPrice)); }
    if (onSale)   { sql += ` AND p.on_sale = 1`; }

    sql += `
      GROUP BY
        p.product_id, p.name, p.price, p.image, p.image_url,
        p.original_price, p.on_sale, p.category_slug, p.created_at
    `;

    // ลำดับความนิยม > ส่วนลด > มาใหม่
    let orderBy = `p.created_at DESC`;
    if (popular) orderBy = `sold_qty DESC, discount_percent DESC, p.created_at DESC`;
    if (newest)  orderBy = `p.created_at DESC`;

    sql += ` ORDER BY ${orderBy} LIMIT ?`;
    params.push(Math.min(Number(limit) || 12, 100));

    const [rows] = await pool.query(sql, params);

    // map ให้ frontend ใช้งานง่าย (image, discount)
    const mapped = rows.map(r => ({
      product_id: r.product_id,
      name: r.name,
      price: r.price,
      image: r.image,                 // รองรับทั้ง image และ image_url ของเดิม
      original_price: r.original_price,
      on_sale: r.on_sale,
      category_slug: r.category_slug,
      created_at: r.created_at,
      discount: r.discount_percent,
      sold_qty: r.sold_qty,
    }));

    res.json(mapped);
  } catch (e) {
    console.error('GET /api/ai/recommendations error:', e.code || e.message);
    res.status(500).json({ error: 'recommendations_failed' });
  }
});

// --------- เพิ่มเฉพาะส่วนตรวจ JWT ----------
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

// --------- Mount Routes ---------
// เดิม: ปล่อย USER_ID_DEFAULT ให้ทุกคนเข้าได้
// app.use('/api/cart', (req, _res, next) => { req.user_id ??= USER_ID_DEFAULT; next(); }, cartRoutes);
// app.use('/api/orders', (req, _res, next) => { req.user_id ??= USER_ID_DEFAULT; next(); }, ordersRoutes);

// ใหม่: ต้องมี token เท่านั้น (คงตามไฟล์เดิม)
app.use('/api/cart', requireAuth, cartRoutes);
app.use('/api/orders', requireAuth, ordersRoutes);

// Mount Auth routes
app.use("/api", authRoutes);

// --------- Error Handler ---------
app.use((err, _req, res, _next) => {
  console.error('UNCAUGHT ERROR:', err);
  res.status(500).json({ error: 'internal error' });
});

// --------- Start ---------
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on http://localhost:${PORT}`);
});
