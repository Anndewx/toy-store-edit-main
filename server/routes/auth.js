import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "username / password required" });

    const [[dup]] = await pool.query("SELECT id FROM users WHERE username=?", [username]);
    if (dup) return res.status(409).json({ message: "username already taken" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
      [username, email || null, hash]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("REGISTER ERR:", e);
    res.status(500).json({ message: "register failed", detail: e.code || e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const [[u]] = await pool.query("SELECT * FROM users WHERE username=?", [username]);
    if (!u) return res.status(401).json({ message: "invalid username or password" });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ message: "invalid username or password" });

    const token = jwt.sign({ id: u.id, username: u.username }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
    res.json({ token, user: { id: u.id, username: u.username, email: u.email } });
  } catch (e) {
    console.error("LOGIN ERR:", e);
    res.status(500).json({ message: "login failed" });
  }
});

export default router;
