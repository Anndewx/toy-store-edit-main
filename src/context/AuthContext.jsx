import { createContext, useContext, useEffect, useState } from "react";
import { post } from "../lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // โหลด session จาก localStorage เมื่อ mount
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
  }, []);

  // ✅ ฟังอีเวนต์ 'user-changed' เพื่ออัปเดต header/icon ทันทีหลังล็อกอิน
  useEffect(() => {
    function onUserChanged() {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      setToken(t || null);
      setUser(u ? JSON.parse(u) : null);
    }
    window.addEventListener("user-changed", onUserChanged);
    return () => window.removeEventListener("user-changed", onUserChanged);
  }, []);

  function setSession(t, u) {
    if (t) localStorage.setItem("token", t);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  // ★ รับ usernameOrEmail → แปลงเป็น {username} หรือ {email}
  async function login({ usernameOrEmail, password }) {
    const body =
      usernameOrEmail?.includes("@")
        ? { email: usernameOrEmail, password }
        : { username: usernameOrEmail, password };
    // ✅ ปรับปลายทางให้ตรง backend
    const data = await post("/login", body);   // {ok, user, token}
    if (!data.ok) throw new Error(data.error || "Login failed");
    setSession(data.token, data.user);
    return data;
  }

  async function register({ name, email, password }) {
    // ✅ ปรับปลายทางให้ตรง backend
    const data = await post("/register", { name, email, password });
    if (!data.ok) throw new Error(data.error || "Register failed");
    setSession(data.token, data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("user-changed"));
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
