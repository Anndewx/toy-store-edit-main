import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import cartRoutes from "./routes/cart.js";
import ordersRoutes from "./routes/orders.js";

dotenv.config();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "toy_store_secret";
const JWT_EXPIRES = "7d";
const USER_ID_DEFAULT = 1;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          connectSrc: ["'self'", "http://localhost:3000", "ws://localhost:3000", "http://localhost:3001"],
          imgSrc: ["'self'", "data:"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
}

app.use(express.json());

// static images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/images", express.static(path.resolve(__dirname, "..", "public", "images")));

// --------- Health ---------
app.get("/api/health", async (_req, res) => {
  try {
    const [r] = await pool.query("SELECT 1 AS ok");
    res.json({ ok: r[0].ok === 1 });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// --------- Products ---------
// ✅ แก้จุดนี้เพื่อรวมจำนวนสินค้า และป้องกันสินค้าแสดงซ้ำ
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
  /* เลือกสินค้า 1 ตัวต่อชื่อ (ตัวหลัก) */
  INNER JOIN (
    SELECT name, MIN(product_id) AS keep_id
    FROM products
    GROUP BY name
  ) one ON one.keep_id = p.product_id
  /* รวมสต็อกต่อ product_id */
  LEFT JOIN (
    SELECT product_id, SUM(quantity) AS qty
    FROM inventory
    GROUP BY product_id
  ) inv ON inv.product_id = p.product_id
`;

app.get("/api/products", async (_req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_PRODUCTS} ORDER BY p.product_id ASC`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/new", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 12, 100));
    const [rows] = await pool.query(
      `${SELECT_PRODUCTS} ORDER BY p.product_id DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch new products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [[row]] = await pool.query(`${SELECT_PRODUCTS} HAVING p.product_id = ?`, [id]);
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// --------- MOUNT ROUTES: ต้องมาก่อน error handler ---------
app.use("/api/cart", (req, _res, next) => { req.user_id ??= USER_ID_DEFAULT; next(); }, cartRoutes);
app.use("/api/orders", (req, _res, next) => { req.user_id ??= USER_ID_DEFAULT; next(); }, ordersRoutes);

console.log("[INIT] Routes mounted: /api/cart, /api/orders");

// --------- Error handler (วางท้ายสุด) ---------
app.use((err, _req, res, _next) => {
  console.error("UNCAUGHT ERROR:", err);
  res.status(500).json({ error: "internal error" });
});

// --------- Start ---------
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
});
