// server/middleware/requireAdmin.js  (ESM เวอร์ชัน)
import { pool } from '../db.js';

export default async function requireAdmin(req, res, next) {
  try {
    // ต้องมี requireAuth ที่ตั้ง req.user_id ไว้ก่อนหน้าแล้ว
    if (!req.user_id) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const [[u]] = await pool.query(
      'SELECT role FROM users WHERE user_id = ? LIMIT 1',
      [req.user_id]
    );

    if (!u || u.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    res.status(500).json({ error: 'internal' });
  }
}
