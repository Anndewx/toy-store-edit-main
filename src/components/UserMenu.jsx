// src/components/UserMenu.jsx
import { useEffect, useRef, useState } from "react";
import "./UserMenu.css";
import { get } from "../lib/api"; // ✅ เพิ่ม: ใช้เรียก /api/addresses

function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function UserMenu() {
  const [user, setUser] = useState(getUser());
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // ✅ ที่อยู่หลัก (แสดงใต้ email)
  const [defaultAddr, setDefaultAddr] = useState(null);

  useEffect(() => {
    const update = () => setUser(getUser());
    window.addEventListener("user-changed", update);
    return () => window.removeEventListener("user-changed", update);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  // ✅ โหลดที่อยู่หลักมาแสดงใต้ email (ไม่กระทบส่วนอื่น)
  useEffect(() => {
    if (!user) return;
    get("/addresses")
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          const def = rows.find((a) => a.is_default) || rows[0];
          setDefaultAddr(def);
        } else {
          setDefaultAddr(null);
        }
      })
      .catch(() => setDefaultAddr(null));
  }, [user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("user-changed")); // แจ้งทั่วแอป
    window.location.href = "/login";
  };

  if (!user) {
    return <a className="nb__link" href="/login">Login</a>;
  }

  const short = user.name?.[0]?.toUpperCase?.() || "😺";
  const addrShort = defaultAddr
    ? `${defaultAddr.line1} ${defaultAddr.subdistrict} ${defaultAddr.postcode}`.trim()
    : null;

  return (
    <div className="um" ref={ref}>
      <button className="um__btn" onClick={() => setOpen((v) => !v)}>
        <span className="um__avatar">{short}</span>
      </button>
      {open && (
        <div className="um__menu">
          <div className="um__user">
            <div className="um__avatar big">{short}</div>
            <div>
              <div className="um__name">{user.name}</div>
              <div className="um__email">{user.email}</div>
              {/* ✅ แสดงที่อยู่หลักใต้ email (ตัดข้อความยาวอัตโนมัติด้วย CSS เดิม) */}
              {addrShort && <div className="um__addr">📍 {addrShort}</div>}
            </div>
          </div>
          <button className="um__logout" onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}
