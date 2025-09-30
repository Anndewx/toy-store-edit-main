// server/routes/auth.js
import 'dotenv/config';
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

// ✅ ใช้ secret เดียวกับ server.js / .env
const SECRET = process.env.JWT_SECRET || "toy_store_secret";

// ---------- REGISTER ----------
router.post("/register", async (req, res) => {
  try {
    const { username, name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name / email / password required" });
    }

    // ตรวจซ้ำอีเมล
    const [[dup]] = await pool.query("SELECT user_id FROM users WHERE email=?", [email]);
    if (dup) return res.status(409).json({ message: "email already taken" });

    const hash = await bcrypt.hash(password, 10);

    // บันทึก user ลง DB
    await pool.query(
      "INSERT INTO users (name, email, password, role, created_at) VALUES (?,?,?,?,NOW())",
      [name, email, hash, "customer"]
    );

    // ดึง user กลับมา
    const [[u]] = await pool.query(
      "SELECT user_id, name, email, role FROM users WHERE email=?",
      [email]
    );

    // ✅ sign token ด้วย SECRET เดียวกัน
    const token = jwt.sign(
      { id: u.user_id, email: u.email, role: u.role },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: u.user_id,
        name: u.name,
        email: u.email,
        role: u.role,
      },
    });
  } catch (e) {
    console.error("REGISTER ERR:", e);
    res.status(500).json({ message: "register failed", detail: e.code || e.message });
  }
});

// ---------- LOGIN ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email / password required" });
    }

    const [[u]] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
    if (!u) return res.status(401).json({ message: "invalid email or password" });

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(401).json({ message: "invalid email or password" });

    // ✅ ใช้ SECRET เดียวกันกับ register
    const token = jwt.sign(
      { id: u.user_id, email: u.email, role: u.role },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: u.user_id,
        name: u.name,
        email: u.email,
        role: u.role,
      },
    });
  } catch (e) {
    console.error("LOGIN ERR:", e);
    res.status(500).json({ message: "login failed", detail: e.code || e.message });
  }
});

export default router;
