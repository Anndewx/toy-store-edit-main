// db.js  — fixed
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const DB_USER = process.env.DB_USER ?? 'root';
const DB_PASS = process.env.DB_PASS ?? '';
const DB_NAME = process.env.DB_NAME ?? 'toy_store';
const DB_PORT = Number(process.env.DB_PORT ?? 3307); // ← default เป็น 3307 เสมอ

export const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
});

// ping ตอนสตาร์ตเพื่อความชัวร์
(async () => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    console.log(`[DB] Connected ${DB_HOST}:${DB_PORT} (${r[0].ok === 1 ? 'OK' : 'NG'})`);
  } catch (e) {
    console.error('[DB] Connection failed:', e.code || e.message);
  }
})();
