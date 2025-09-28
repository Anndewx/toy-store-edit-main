import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";
import { useCart } from "../context/CartContext";
import UserMenu from "./UserMenu"; // 👈 เมนูโปรไฟล์ใหม่

export default function Navbar() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="nb">
      <div className="nb__inner">
        <Link to="/" className="nb__brand">🛒 ToyStore</Link>

        <nav className="nb__nav">
          <ul className="nb__menu">
            <li><NavLink to="/" end className="nb__link">Home</NavLink></li>

            {/* Shop dropdown */}
            <li
              className="nb__dropdown"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <span className="nb__link nb__toggle">Shop ▾</span>
              {open && (
                <div className="nb__drop">
                  <Link to="/category/gundam" className="nb__dropItem">Gundam</Link>
                  <Link to="/category/anime" className="nb__dropItem">Anime</Link>
                  <Link to="/category/superhero" className="nb__dropItem">Superhero</Link>
                  <Link to="/category/game" className="nb__dropItem">Game</Link>
                  <div className="nb__divider" />
                  <Link to="/category/new" className="nb__dropItem">New Arrivals</Link>
                  <Link to="/category/hot" className="nb__dropItem">Hot</Link>
                </div>
              )}
            </li>

            <li><NavLink to="/about" className="nb__link">About</NavLink></li>
            <li><NavLink to="/dashboard" className="nb__link">Dashboard</NavLink></li>
            <li><NavLink to="/wallet" className="nb__link">Wallet</NavLink></li>
          </ul>
        </nav>

        <div className="nb__right">
          {/* ปุ่ม Cart */}
          <button
            className="nb__cart"
            onClick={() => window.dispatchEvent(new CustomEvent("open-cart"))}
          >
            Cart
            {count > 0 && <span className="nb__badge">{count}</span>}
          </button>

          {/* เมนูโปรไฟล์ */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
