import { useState } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    // 1) พยายามยิง API จริงก่อน (ปรับ URL/payload ให้ตรง backend ของคุณ)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, email, password }),
      });

      if (res.ok) {
        const data = await res.json(); // คาดหวัง { token, user }
        if (data?.token && data?.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem(
            "user",
            JSON.stringify({
              name: data.user.name || name || username,
              username: data.user.username || username,
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
      // 2) โหมดเดโม (สมัคร-ล็อกอินทันที)
      const demoUser = {
        name: name || username || email?.split("@")[0] || "Member",
        username: username || "member",
        email: email || "member@example.com",
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
    <div style={{ maxWidth: 520, margin: "40px auto", padding: "0 16px" }}>
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
            required
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <label>ชื่อที่แสดง</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
            required
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
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px" }}
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
          {busy ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>

        <div style={{ marginTop: 8, textAlign: "center" }}>
          มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a>
        </div>
      </form>
    </div>
  );
}
