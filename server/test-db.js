// test-db.js (ESM)
import mysql from 'mysql2/promise';

try {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'toy_store'  // ← ใส่ชื่อฐานข้อมูลจริงของคุณ
  });
  const [rows] = await conn.query('SELECT 1 AS ok');
  console.log('DB OK:', rows);
  await conn.end();
} catch (e) {
  console.error('DB connect/query error ->', e);
}
