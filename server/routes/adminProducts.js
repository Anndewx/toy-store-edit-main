// server/routes/adminProducts.js  (ESM)
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/admin/products?q=
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.name LIKE ? OR p.product_id LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.product_id, p.name, p.price, p.stock, p.image_url
       FROM products p
       ${whereSql}
       ORDER BY p.product_id DESC`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/admin/products error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

// PUT /api/admin/products/:id/stock  { type:'set'|'increase'|'decrease', value:number }
router.put('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, value } = req.body;

    const [[p]] = await pool.query(
      'SELECT stock FROM products WHERE product_id = ?',
      [id]
    );
    if (!p) return res.status(404).json({ error: 'Not found' });

    const v = Number(value);
    if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: 'Invalid value' });

    let newStock = p.stock;
    if (type === 'set') newStock = v;
    else if (type === 'increase') newStock = p.stock + v;
    else if (type === 'decrease') newStock = Math.max(0, p.stock - v);
    else return res.status(400).json({ error: 'Invalid type' });

    await pool.query('UPDATE products SET stock = ? WHERE product_id = ?', [newStock, id]);
    res.json({ ok: true, stock: newStock });
  } catch (e) {
    console.error('PUT /api/admin/products/:id/stock error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

export default router;
