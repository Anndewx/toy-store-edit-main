// server/routes/cart.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ดึง user_id (มี token ก็ใช้, ไม่มีก็ใช้ 1)
function getUserId(req) {
  return req.user?.id || req.user_id || 1;
}

// GET /api/cart  → ตะกร้าทั้งหมดของผู้ใช้
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.product_id,
              c.quantity,
              p.name,
              p.price,
              p.original_price,
              COALESCE(NULLIF(p.image,''), p.image_url) AS image_url
       FROM cart c
       JOIN products p ON p.product_id = c.product_id
       WHERE c.user_id = ?`,
      [getUserId(req)]
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /cart error:", e);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// POST /api/cart  { product_id, quantity=1 }  → เพิ่มเข้าตะกร้า (อัปเดตถ้ามีอยู่แล้ว)
router.post("/", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const { product_id, quantity = 1 } = req.body || {};
    if (!product_id) return res.status(400).json({ error: "product_id required" });

    // ถ้ามีรายการอยู่แล้ว → บวกจำนวน
    const [upd] = await pool.query(
      `UPDATE cart
          SET quantity = quantity + ?
        WHERE user_id = ? AND product_id = ?`,
      [quantity, user_id, product_id]
    );
    if (upd.affectedRows === 0) {
      await pool.query(
        `INSERT INTO cart (user_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [user_id, product_id, quantity]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("POST /cart error:", e);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// PATCH /api/cart  { product_id, quantity }  → เซ็ตจำนวนใหม่ (ลบถ้า <= 0)
router.patch("/", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const { product_id, quantity } = req.body || {};
    if (!product_id || typeof quantity !== "number") {
      return res.status(400).json({ error: "product_id and quantity are required" });
    }
    if (quantity <= 0) {
      await pool.query(
        `DELETE FROM cart WHERE user_id = ? AND product_id = ?`,
        [user_id, product_id]
      );
      return res.json({ ok: true, removed: true });
    }
    const [upd] = await pool.query(
      `UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?`,
      [quantity, user_id, product_id]
    );
    if (upd.affectedRows === 0) {
      await pool.query(
        `INSERT INTO cart (user_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [user_id, product_id, quantity]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("PATCH /cart error:", e);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// DELETE /api/cart/:productId  → ลบรายการเดียวออกจากตะกร้า
router.delete("/:productId", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const productId = Number(req.params.productId);
    const [r] = await pool.query(
      `DELETE FROM cart WHERE user_id = ? AND product_id = ?`,
      [user_id, productId]
    );
    res.json({ ok: true, removed: r.affectedRows });
  } catch (e) {
    console.error("DELETE /cart/:productId error:", e);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

// DELETE /api/cart  → เคลียร์ตะกร้าทั้งหมด
router.delete("/", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const [r] = await pool.query(
      `DELETE FROM cart WHERE user_id = ?`,
      [user_id]
    );
    res.json({ ok: true, cleared: r.affectedRows });
  } catch (e) {
    console.error("DELETE /cart error:", e);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

export default router;
