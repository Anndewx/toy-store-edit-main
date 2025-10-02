// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, email, password }),
      });

      if (!res.ok) {
        const msg = (await res.text()) || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();

      // กรณี API คืน token + user → ล็อกอินอัตโนมัติ ตามระบบเดิม
      if (data?.token && data?.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            name:
              data.user.name ||
              data.user.username ||
              name ||
              username ||
              email?.split("@")[0],
            username: data.user.username || username || "",
            email: data.user.email || email,
            role: data.user.role || "user",
            avatar: data.user.avatar || "",
          })
        );
        // แจ้ง context อื่น ๆ (เช่น Navbar, CartContext, AddressBadge) ให้รีเฟรชสถานะผู้ใช้
        window.dispatchEvent(new Event("user-changed"));
        navigate("/", { replace: true });
        return;
      }

      // หากสมัครสำเร็จแต่ไม่คืน token → ให้ไปหน้า Login เพื่อเข้าสู่ระบบ
      navigate("/login", { replace: true });
    } catch (err) {
      setError(`สมัครสมาชิกไม่สำเร็จ: ${err?.message || ""}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "40px auto", padding: "0 16px" }}>
      <h2 style={{ marginBottom: 10, textAlign: "center" }}>สมัครสมาชิก</h2>

      <form
        onSubmit={handleRegister}
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <label>ชื่อที่แสดง</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <label>อีเมล</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            required
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <label>รหัสผ่าน</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            required
            minLength={6}
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
          />
        </div>

        {error && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              padding: 8,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}

        <button
          disabled={busy}
          style={{
            width: "100%",
            height: 44,
            border: 0,
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {busy ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>

        <div style={{ marginTop: 8, textAlign: "center" }}>
          มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a>
        </div>
      </form>
    </div>
  );
}
