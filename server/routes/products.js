// routes/products.js
import express from "express";
// เลือกให้ตรงกับ db.js ของคุณ:
import { pool } from "../db.js";      // ถ้าใช้ Named export
// import pool from "../db.js";       // ถ้าใช้ Default export

const router = express.Router();

// helper: ตรวจ pool
function ensurePool(res) {
  if (!pool || typeof pool.query !== "function") {
    console.error("DB pool is not available. Check db.js export.");
    res.status(500).json({ message: "internal error" });
    return false;
  }
  return true;
}

// ✅ ฟิลด์ที่หน้าเว็บใช้ (อย่าเปลี่ยนชื่อ key เพื่อไม่ให้กระทบส่วนอื่น)
// - product_id, name, price, original_price, on_sale, category_slug
// - image_url (มาจาก products.image ถ้าไม่มีค่อยใช้ products.image_url)
// - stock (มาจาก inventory.quantity ถ้าไม่มีค่อยใช้ products.stock ถ้าไม่มีอีกเป็น 0)

const SELECT_COMMON = `
  SELECT
    p.product_id,
    p.name,
    p.price,
    p.original_price,
    p.on_sale,
    p.category_slug,
    COALESCE(NULLIF(p.image, ''), p.image_url) AS image_url,
    COALESCE(i.quantity, p.stock, 0) AS stock
  FROM products p
  LEFT JOIN inventory i ON i.product_id = p.product_id
`;

// GET /api/products   — สินค้าทั้งหมด
router.get("/", async (_req, res) => {
  if (!ensurePool(res)) return;
  try {
    const [rows] = await pool.query(`${SELECT_COMMON} ORDER BY p.product_id ASC`);
    res.json(rows);
  } catch (e) {
    console.error("GET /products error:", e);
    res.status(500).json({ message: "internal error" });
  }
});

// GET /api/products/new?limit=12  — สินค้ามาใหม่ (เรียงล่าสุด)
router.get("/new", async (req, res) => {
  if (!ensurePool(res)) return;
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 12, 100));
  try {
    const [rows] = await pool.query(
      `${SELECT_COMMON} ORDER BY p.product_id DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /products/new error:", e);
    res.status(500).json({ message: "internal error" });
  }
});

// GET /api/products/search?q=keyword
router.get("/search", async (req, res) => {
  if (!ensurePool(res)) return;
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 12, 100));

    // Base query
    let sql = `${SELECT_COMMON}`;
    const params = [];

    if (q) {
      sql += ` WHERE p.name LIKE ? OR p.category_slug LIKE ? `;
      params.push(`%${q}%`, `%${q}%`);
    }

    // Sort: สินค้าที่มาใหม่สุดก่อน
    sql += ` ORDER BY p.product_id DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error("GET /products/search error:", e);
    res.status(500).json({ message: "internal error" });
  }
});


export default router;
