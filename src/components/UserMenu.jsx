import { useEffect, useRef, useState } from "react";
import "./UserMenu.css";

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

  // ฟัง event เมื่อ user login/logout
  useEffect(() => {
    const update = () => setUser(getUser());
    window.addEventListener("user-changed", update);
    return () => window.removeEventListener("user-changed", update);
  }, []);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

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
            </div>
          </div>
          <button className="um__logout" onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}
