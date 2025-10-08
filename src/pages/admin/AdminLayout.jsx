import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>
      <nav style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <NavLink to="orders">📦 คำสั่งซื้อ</NavLink>
        <NavLink to="products">📦 สต๊อกสินค้า</NavLink>
      </nav>
      <div style={{ borderTop: "1px solid #ddd", paddingTop: 12 }}>
        <Outlet />
      </div>
    </div>
  );
}
