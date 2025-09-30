// server/routes/cart.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ดึง user_id (มี token ก็ใช้, ไม่มีก็ใช้ 1)
function getUserId(req) {
  return req.user?.id || req.user_id || 1;
}

/* ---------------------------------------------
   GET /api/cart  → ตะกร้าทั้งหมดของผู้ใช้
----------------------------------------------*/
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

/* ---------------------------------------------
   POST /api/cart  { product_id, quantity=1 }
   → เพิ่มเข้าตะกร้า (ถ้ามีอยู่แล้วให้บวกจำนวน)
----------------------------------------------*/
router.post("/", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const { product_id, quantity = 1 } = req.body || {};
    if (!product_id) return res.status(400).json({ error: "product_id required" });

    // บวกจำนวนถ้ามีอยู่แล้ว
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

/* ---------------------------------------------
   PATCH /api/cart  { product_id, quantity }
   → เซ็ตจำนวนใหม่ (<=0 จะลบ)
   (อันนี้ “เดิมของคุณ” เก็บไว้เหมือนเดิม)
----------------------------------------------*/
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

/* ---------------------------------------------
   ✅ ใหม่ (เติมเฉพาะเพื่อแก้ – / + 404):
   PATCH /api/cart/:productId
   - รองรับ body: { delta?: number } หรือ { qty?: number } หรือ { quantity?: number }
   - ถ้ามี delta → เพิ่ม/ลดจากค่าปัจจุบัน (ไม่น้อยกว่า 1)
   - ถ้ามี qty/quantity → เซ็ตค่าใหม่ (ถ้า <=0 จะลบ)
----------------------------------------------*/
router.patch("/:productId", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const productId = Number(req.params.productId);
    if (!productId) return res.status(400).json({ error: "invalid productId" });

    let { delta, qty, quantity } = req.body || {};
    if (typeof qty === "number" && typeof quantity !== "number") {
      quantity = qty;
    }

    // ดึงจำนวนปัจจุบัน (ถ้ามี)
    const [[currentRow] = []] = await pool.query(
      `SELECT quantity FROM cart WHERE user_id=? AND product_id=?`,
      [user_id, productId]
    );
    const current = Number(currentRow?.quantity || 0);

    if (typeof delta === "number") {
      const next = Math.max(1, current + Number(delta || 0));
      if (current === 0) {
        // ยังไม่มีรายการ → ใส่เป็น 1 ชิ้น
        await pool.query(
          `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)`,
          [user_id, productId, next]
        );
      } else {
        await pool.query(
          `UPDATE cart SET quantity=? WHERE user_id=? AND product_id=?`,
          [next, user_id, productId]
        );
      }
      return res.json({ ok: true, quantity: next, mode: "delta" });
    }

    if (typeof quantity === "number") {
      if (quantity <= 0) {
        await pool.query(
          `DELETE FROM cart WHERE user_id=? AND product_id=?`,
          [user_id, productId]
        );
        return res.json({ ok: true, removed: true });
      }
      if (current === 0) {
        await pool.query(
          `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)`,
          [user_id, productId, quantity]
        );
      } else {
        await pool.query(
          `UPDATE cart SET quantity=? WHERE user_id=? AND product_id=?`,
          [quantity, user_id, productId]
        );
      }
      return res.json({ ok: true, quantity, mode: "set" });
    }

    return res.status(400).json({ error: "delta or quantity required" });
  } catch (e) {
    console.error("PATCH /cart/:productId error:", e);
    res.status(500).json({ error: "Failed to update cart by id" });
  }
});

/* ---------------------------------------------
   DELETE /api/cart/:productId  → ลบรายการเดียว
----------------------------------------------*/
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

/* ---------------------------------------------
   DELETE /api/cart  → เคลียร์ตะกร้าทั้งหมด
----------------------------------------------*/
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
