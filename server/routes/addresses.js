// server/routes/addresses.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ✅ Helper: ดึง user_id จาก token หรือ mock id=1
function getUserId(req) {
  return req.user?.id || 1;
}

// 📌 GET /api/addresses → รายการที่อยู่ของผู้ใช้
router.get("/", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const [rows] = await pool.query(
      `SELECT * FROM user_addresses WHERE user_id=? ORDER BY is_default DESC, address_id DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /addresses error:", e);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// 📌 POST /api/addresses → เพิ่มที่อยู่ใหม่
router.post("/", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const {
      full_name, phone, line1, line2,
      subdistrict, district, province, postcode,
      is_default
    } = req.body;

    if (!full_name || !phone || !line1 || !subdistrict || !district || !province || !postcode) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
    }

    // ถ้าเลือก is_default → ยกเลิก default อื่น
    if (is_default) {
      await pool.query(`UPDATE user_addresses SET is_default=0 WHERE user_id=?`, [user_id]);
    }

    const [result] = await pool.query(
      `INSERT INTO user_addresses
       (user_id, full_name, phone, line1, line2, subdistrict, district, province, postcode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, full_name, phone, line1, line2, subdistrict, district, province, postcode, is_default ? 1 : 0]
    );

    const [newAddr] = await pool.query(`SELECT * FROM user_addresses WHERE address_id=?`, [result.insertId]);
    res.json(newAddr[0]);
  } catch (e) {
    console.error("POST /addresses error:", e);
    res.status(500).json({ error: "Failed to create address" });
  }
});

// 📌 PATCH /api/addresses/:id → แก้ไขที่อยู่
router.patch("/:id", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const id = Number(req.params.id);
    const fields = [
      "full_name", "phone", "line1", "line2",
      "subdistrict", "district", "province", "postcode"
    ];
    const updates = [];
    const values = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f}=?`);
        values.push(req.body[f]);
      }
    }

    if (!updates.length) return res.json({ ok: true });

    values.push(user_id, id);
    await pool.query(
      `UPDATE user_addresses SET ${updates.join(", ")} WHERE user_id=? AND address_id=?`,
      values
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("PATCH /addresses/:id error:", e);
    res.status(500).json({ error: "Failed to update address" });
  }
});

// 📌 PATCH /api/addresses/:id/default → ตั้งเป็น default
router.patch("/:id/default", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const id = Number(req.params.id);
    await pool.query(`UPDATE user_addresses SET is_default=0 WHERE user_id=?`, [user_id]);
    await pool.query(`UPDATE user_addresses SET is_default=1 WHERE user_id=? AND address_id=?`, [user_id, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("PATCH /addresses/:id/default error:", e);
    res.status(500).json({ error: "Failed to set default" });
  }
});

// 📌 DELETE /api/addresses/:id → ลบ
router.delete("/:id", async (req, res) => {
  try {
    const user_id = getUserId(req);
    const id = Number(req.params.id);
    await pool.query(`DELETE FROM user_addresses WHERE user_id=? AND address_id=?`, [user_id, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /addresses/:id error:", e);
    res.status(500).json({ error: "Failed to delete address" });
  }
});

export default router;
