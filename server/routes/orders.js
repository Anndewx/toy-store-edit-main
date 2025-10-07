// server/routes/orders.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

function getUserId(req) {
  return req.user?.id || req.user_id || 1;
}

/** GET ทั้งหมด (เดิม) */
router.get("/", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const [rows] = await pool.query(
      `SELECT order_id, user_id, total_price, payment_method, status, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY order_id DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /orders error:", e);
    res.status(500).json({ error: "Failed to list orders" });
  }
});

/** GET รายการเดียว (เดิม) */
router.get("/:id", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const orderId = Number(req.params.id);

    const [[order]] = await pool.query(
      `SELECT order_id, user_id, total_price, payment_method, status, created_at
       FROM orders
       WHERE order_id = ? AND user_id = ?`,
      [orderId, user_id]
    );
    if (!order) return res.status(404).json({ error: "Order not found" });

    const [items] = await pool.query(
      `SELECT d.order_id, d.product_id, d.quantity, d.price, p.name,
              COALESCE(NULLIF(p.image,''), p.image_url) AS image_url
       FROM order_details d
       JOIN products p ON p.product_id = d.product_id
       WHERE d.order_id = ?`,
      [orderId]
    );

    res.json({ order, items });
  } catch (e) {
    console.error("GET /orders/:id error:", e);
    res.status(500).json({ error: "Failed to get order" });
  }
});

/** POST สร้างออเดอร์ (เดิม) */
router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const user_id = getUserId(req);
    const { payment_method } = req.body;
    await conn.beginTransaction();

    const [cartItems] = await conn.query(
      `SELECT c.product_id, c.quantity, p.price, p.name,
              COALESCE(i.quantity, 0) AS stock
       FROM cart c
       JOIN products p ON p.product_id = c.product_id
       LEFT JOIN inventory i ON i.product_id = c.product_id
       WHERE c.user_id = ?`,
      [user_id]
    );

    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ error: "Cart is empty" });
    }

    for (const it of cartItems) {
      if (Number(it.stock) < Number(it.quantity)) {
        await conn.rollback();
        return res.status(409).json({
          error: `สินค้า ${it.name} มีไม่พอ (เหลือ ${it.stock} ชิ้น)`,
          code: "OUT_OF_STOCK",
        });
      }
    }

    const total = cartItems.reduce(
      (s, it) => s + Number(it.price) * Number(it.quantity),
      0
    );

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, total_price, payment_method, status)
       VALUES (?, ?, ?, 'placed')`,
      [user_id, total, payment_method || null]
    );
    const orderId = orderResult.insertId;

    for (const it of cartItems) {
      await conn.query(
        `INSERT INTO order_details (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, it.product_id, it.quantity, it.price]
      );
      await conn.query(
        `UPDATE inventory SET quantity = quantity - ?
         WHERE product_id = ?`,
        [it.quantity, it.product_id]
      );
    }

    await conn.query(`DELETE FROM cart WHERE user_id = ?`, [user_id]);
    await conn.commit();
    res.json({ ok: true, order_id: orderId, total });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error("POST /orders error:", e);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    conn.release();
  }
});

/** PATCH อัปเดตสถานะ (เดิม) */
router.patch("/:id/status", async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;
    const validStatuses = ["placed", "processing", "shipping", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await pool.query(`UPDATE orders SET status = ? WHERE order_id = ?`, [
      status,
      orderId,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error("PATCH /orders/:id/status error:", e);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/** 🆕 DELETE /api/orders/:id — ลบออเดอร์ */
router.delete("/:id", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const orderId = Number(req.params.id);
    // ✅ ลบเฉพาะของตัวเองเท่านั้น
    const [r] = await pool.query(
      `DELETE FROM orders WHERE order_id = ? AND user_id = ?`,
      [orderId, user_id]
    );
    res.json({ ok: r.affectedRows > 0 });
  } catch (e) {
    console.error("DELETE /orders/:id error:", e);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
