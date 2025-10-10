import { useEffect, useRef, useState } from "react";
import "./UserMenu.css";
import { get } from "../lib/api"; // ใช้ดึงที่อยู่เหมือนเดิม

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
  const [defaultAddr, setDefaultAddr] = useState(null);
  const ref = useRef(null);

  // sync user
  useEffect(() => {
    const update = () => setUser(getUser());
    window.addEventListener("user-changed", update);
    return () => window.removeEventListener("user-changed", update);
  }, []);

  // click outside to close
  useEffect(() => {
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  // load default address
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
    window.dispatchEvent(new Event("user-changed"));
    window.location.href = "/login";
  };

  if (!user) {
    return <a className="nb__link" href="/login">Login</a>;
  }

  const short = user.name?.[0]?.toUpperCase?.() || "🙂";
  const addrShort = defaultAddr
    ? `${defaultAddr.line1} ${defaultAddr.subdistrict} ${defaultAddr.postcode}`.trim()
    : null;

  return (
    <div className="um" ref={ref}>
      <button
        className="um__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="เมนูผู้ใช้"
      >
        <span className="um__avatar" aria-hidden>{short}</span>
        <span className="sr-only">เปิดเมนูผู้ใช้</span>
      </button>

      {open && (
        <div className="um__menu" role="menu" aria-label="เมนูผู้ใช้">
          <div className="um__user">
            <div className="um__avatar big" aria-hidden>{short}</div>
            <div className="um__meta">
              <div className="um__name" title={user.name}>{user.name}</div>
              <div className="um__email" title={user.email}>{user.email}</div>
              {addrShort && <div className="um__addr" title={addrShort}>📍 {addrShort}</div>}
            </div>
          </div>

          {/* แถบสถานะเล็ก ๆ เพิ่มความโปร (ไม่ใช่เมนูคลิก) */}
          <div className="um__status">
            <span className="dot" /> Signed in
          </div>

          <button className="um__logout" onClick={logout} role="menuitem">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
