// server/routes/adminOrders.js  (ESM)
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// ===== NEW: ใช้ FLOW ให้ตรงกับฝั่งหน้าใบเสร็จ =====
const FLOW = ['placed', 'processing', 'shipping', 'delivered'];

// ===== NEW: ตัวช่วย normalize ค่าสถานะ + กันค่าว่าง =====
function normalizeStatus(s) {
  const k = String(s ?? '').trim().toLowerCase();
  if (!k) return 'placed';
  if (k === 'received' || k === 'new' || k === 'created') return 'placed';
  if (k === 'packing' || k === 'packed') return 'processing';
  if (k === 'shipped') return 'shipping';
  if (k === 'complete' || k === 'completed') return 'delivered';
  return k;
}

const ALLOWED = new Set(['placed', 'processing', 'shipping', 'delivered', 'cancelled']);

// GET /api/admin/orders?status=&q=
router.get('/', async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = [];
    const params = [];

    if (status) { 
      // เทียบด้วยค่าที่ normalize แล้ว
      where.push('LOWER(TRIM(o.status)) IN (?, ?, ?)'); 
      // ให้รองรับ synonyms ที่แมปมาเท่ากัน เช่น placed = ['placed','received','new','created']
      const s = normalizeStatus(status);
      if (s === 'placed') params.push('placed','received','new');
      else if (s === 'processing') params.push('processing','packing','packed');
      else if (s === 'shipping') params.push('shipping','shipped');
      else if (s === 'delivered') params.push('delivered','complete','completed');
      else params.push(s, s, s);
    }
    if (q) {
      where.push('(o.order_id LIKE ? OR u.email LIKE ? OR u.name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT 
          o.order_id, 
          o.created_at, 
          o.total_price, 
          o.payment_method,
          -- กันค่าว่าง/NULL ให้เป็น placed
          IFNULL(NULLIF(TRIM(LOWER(o.status)), ''), 'placed') AS _status_raw,
          u.name  AS customer_name, 
          u.email AS customer_email
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       ${whereSql}
       ORDER BY o.created_at DESC`,
      params
    );

    // ส่งกลับด้วยสถานะที่ normalize แล้ว
    const data = rows.map(r => ({
      ...r,
      status: normalizeStatus(r._status_raw),
    }));
    res.json(data);
  } catch (e) {
    console.error('GET /api/admin/orders error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

// GET /api/admin/orders/:id  (รายละเอียด + history)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [[order]] = await pool.query(
      `SELECT 
          o.*, 
          u.name  AS customer_name, 
          u.email AS customer_email,
          IFNULL(NULLIF(TRIM(LOWER(o.status)), ''), 'placed') AS _status_raw
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       WHERE o.order_id = ?`,
      [id]
    );
    if (!order) return res.status(404).json({ error: 'Not found' });

    const [items] = await pool.query(
      `SELECT od.product_id, od.quantity, od.price, p.name
       FROM order_details od
       JOIN products p ON p.product_id = od.product_id
       WHERE od.order_id = ?`,
      [id]
    );

    const [history] = await pool.query(
      `SELECT h.*, u.email AS changed_by_email
       FROM order_status_history h
       JOIN users u ON u.user_id = h.changed_by
       WHERE h.order_id = ?
       ORDER BY h.created_at DESC`,
      [id]
    );

    // สถานะ normalize
    order.status = normalizeStatus(order._status_raw);
    delete order._status_raw;

    res.json({ order, items, history });
  } catch (e) {
    console.error('GET /api/admin/orders/:id error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

// PUT /api/admin/orders/:id/status
// body: { action:'next'|'prev'|'set', to?, note? }
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { action, to, note } = req.body;

  try {
    const [[o]] = await pool.query(
      'SELECT IFNULL(NULLIF(TRIM(LOWER(status)), \'\'), \'placed\') AS cur FROM orders WHERE order_id = ?',
      [id]
    );
    if (!o) return res.status(404).json({ error: 'Not found' });

    const cur = normalizeStatus(o.cur);
    let nextStatus = cur;

    if (action === 'next') {
      const i = FLOW.indexOf(cur);
      nextStatus = (i >= 0 && i < FLOW.length - 1) ? FLOW[i + 1] : cur;
    } else if (action === 'prev') {
      const i = FLOW.indexOf(cur);
      nextStatus = (i > 0) ? FLOW[i - 1] : cur;
    } else if (action === 'set' && to) {
      const t = normalizeStatus(to);
      if (!ALLOWED.has(t)) {
        return res.status(400).json({ error: `status ไม่รองรับ: ${to}` });
      }
      nextStatus = t;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (nextStatus === cur) {
      return res.json({ ok: true, status: cur });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('UPDATE orders SET status = ? WHERE order_id = ?', [nextStatus, id]);
      await conn.query(
        'INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note) VALUES (?,?,?,?,?)',
        [id, cur, nextStatus, req.user_id || null, note || null] // req.user_id มาจาก middleware auth
      );
      await conn.commit();
      res.json({ ok: true, status: nextStatus });
    } catch (e) {
      await conn.rollback();
      console.error('PUT /api/admin/orders/:id/status tx error:', e);
      res.status(500).json({ error: 'Update failed' });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('PUT /api/admin/orders/:id/status error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

export default router;
