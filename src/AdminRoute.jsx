// src/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const BASE = (import.meta.env.VITE_API_BASE || "").trim(); // '' = ใช้ proxy
const API = BASE ? BASE : ""; // ถ้า BASE ว่าง จะได้ path แบบ relative เช่น '/api/me'
const DEV_ADMIN_EMAIL = "d@gmail.com"; // อีเมลแอดมินในตาราง users

const token =
  localStorage.getItem("token") ||
  sessionStorage.getItem("token") ||
  "";

function withTimeout(promise, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export default function AdminRoute({ children }) {
  const [allow, setAllow] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        console.log("[AdminRoute] BASE =", BASE || "(relative)");
        console.log("[AdminRoute] Checking /api/me ...");

        const r = await withTimeout(
          fetch(`${API}/api/me`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
            cache: "no-store",
          })
        );

        if (r.ok) {
          const me = await r.json();
          console.log("[AdminRoute] /api/me =", me);
          setAllow(me?.role === "admin");
          return;
        } else {
          console.warn("[AdminRoute] /api/me status =", r.status);
        }
      } catch (e) {
        console.warn("[AdminRoute] /api/me error:", e?.message || e);
      }

      // Fallback: dev route (ไม่ใช้ token)
      try {
        console.log("[AdminRoute] Fallback /api/dev/user ...");
        const r2 = await withTimeout(
          fetch(`${API}/api/dev/user/${encodeURIComponent(DEV_ADMIN_EMAIL)}`, {
            cache: "no-store",
          })
        );
        if (r2.ok) {
          const me2 = await r2.json();
          console.log("[AdminRoute] /api/dev/user =", me2);
          setAllow(me2?.role === "admin");
          return;
        } else {
          console.warn("[AdminRoute] /api/dev/user status =", r2.status);
        }
      } catch (e) {
        console.warn("[AdminRoute] /api/dev/user error:", e?.message || e);
      }

      setAllow(false);
    })();
  }, []);

  if (allow === null) return <div style={{ padding: 20 }}>กำลังตรวจสิทธิ์...</div>;
  if (!allow) return <Navigate to="/" replace />;
  return children;
}
