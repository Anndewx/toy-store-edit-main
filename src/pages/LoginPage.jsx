import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    // 1) พยายามยิง API จริงก่อน (ปรับ URL/payload ให้ตรงกับ backend ของคุณ)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.token && data?.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem(
            "user",
            JSON.stringify({
              // เผื่อ backend ส่ง field ไม่ครบ เราประกอบให้
              name: data.user.name || data.user.username || username || email?.split("@")[0],
              username: data.user.username || username || "",
              email: data.user.email || email,
              role: data.user.role || "user",
              avatar: data.user.avatar || "",
            })
          );
          window.dispatchEvent(new Event("user-changed"));
          window.location.href = "/";
          return;
        }
      }
      throw new Error("fallback to demo");
    } catch {
      // 2) โหมดเดโม (ไม่ต้องมี backend)
      const demoUser = {
        name: username || email?.split("@")[0] || "Guest",
        username: username || "guest",
        email: email || "guest@example.com",
        role: "user",
      };
      localStorage.setItem("token", "demo-token");
      localStorage.setItem("user", JSON.stringify(demoUser));
      window.dispatchEvent(new Event("user-changed"));
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "40px auto", padding: "0 16px" }}>
      <h2 style={{ marginBottom: 10, textAlign: "center" }}>เข้าสู่ระบบ</h2>

      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <label>Username (ไม่บังคับ)</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
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
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <label>รหัสผ่าน</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
            required
          />
        </div>

        {error && (
          <div style={{ color: "#b91c1c", background: "#fee2e2", border: "1px solid #fecaca", padding: 8, borderRadius: 8, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button
          disabled={busy}
          style={{
            width: "100%", height: 44, border: 0, borderRadius: 12,
            background: "#111", color: "#fff", fontWeight: 800, cursor: "pointer",
          }}
        >
          {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p style={{ color: "#6b7280", fontSize: 12, marginTop: 10, textAlign: "center" }}>
          * หาก backend ยังไม่พร้อม ระบบจะเข้าสู่โหมดเดโมโดยอัตโนมัติ
        </p>

        <div style={{ marginTop: 8, textAlign: "center" }}>
          ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิก</a>
        </div>
      </form>
    </div>
  );
}
