import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

/** แปลงค่ารูปให้เป็น path ที่ proxy ได้ และมี fallback */
function resolveImageSrc(product) {
  const raw0 = product?.image_url ?? product?.image ?? "";
  const raw = String(raw0).trim();

  if (!raw) return "/images/placeholder.jpg";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/images/")) return raw;
  if (raw.startsWith("images/")) return "/" + raw;
  if (/^[^/\\]+\.[a-z0-9]{2,5}$/i.test(raw)) return `/images/${raw}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export default function ProductCard({ product, loading }) {
  const { add, buyNow } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-card skeleton">
        <div className="p-thumb skeleton-thumb"></div>
        <div className="p-body">
          <div className="skeleton-title"></div>
          <div className="skeleton-price"></div>
          <div className="skeleton-btn"></div>
        </div>
      </div>
    );
  }
  if (!product) return null;

  const { product_id, name, price, original_price, on_sale } = product;

  const stockRaw = product?.stock ?? product?.quantity ?? product?.inventory_qty ?? 0;
  const stockNum = Number(stockRaw);
  const isOOS = !(stockNum > 0);

  const hasDiscount =
    on_sale === 1 || (original_price && Number(original_price) > Number(price));
  const discountPercent =
    hasDiscount && original_price
      ? Math.round(((Number(original_price) - Number(price)) / Number(original_price)) * 100)
      : 0;

  const stockStatus = stockNum > 10 ? "in-stock" : stockNum > 0 ? "low-stock" : "out-of-stock";
  const stockText =
    stockNum > 10 ? `มีสินค้า ${stockNum} ชิ้น` : stockNum > 0 ? `เหลือเพียง ${stockNum} ชิ้น!` : "สินค้าหมด";

  const imgSrc = resolveImageSrc(product);

  function requireLogin() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      window.location.href = "/login";
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!requireLogin() || isOOS) return;
    add(product_id, 1);
  }

  function handleBuyNow() {
    if (!requireLogin() || isOOS) return;
    buyNow(product_id, 1).then(() => navigate("/checkout"));
  }

  return (
    <div className="p-card">
      <Link to={`/product/${product_id}`} className="p-thumb" title={name}>
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/placeholder.jpg"; }}
        />
        {/* ป้ายลดราคา/เตือนสต็อก — อยู่ใน .p-thumb เสมอ เพื่อวางทับรูป */}
        <div className="p-badges">
          {hasDiscount && <span className="badge badge-sale">-{discountPercent}%</span>}
          {stockNum <= 5 && stockNum > 0 && <span className="badge badge-hot">เหลือน้อย</span>}
        </div>
      </Link>

      <div className="p-body">
        <h4 className="p-title">
          <Link to={`/product/${product_id}`}>{name}</Link>
        </h4>

        <div className={`p-stock ${stockStatus}`}>
          <span className="stock-icon">📦</span>
          <span className="stock-text">{stockText}</span>
        </div>

        {/* ราคา: ชิดซ้ายเท่ากันทุกใบ (คุมด้วย CSS) */}
        <div className="p-price">
          <span className="price">฿{Number(price).toFixed(2)}</span>
          {hasDiscount && original_price && (
            <span className="ori">฿{Number(original_price).toFixed(2)}</span>
          )}
        </div>

        {/* ปุ่มคู่ */}
        <div className="p-actions">
          <button
            type="button"
            className={`btn-primary ${isOOS ? "is-disabled" : ""}`}
            onClick={handleAddToCart}
            disabled={isOOS}
          >
            {isOOS ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
          </button>
          <button
            type="button"
            className={`btn-buy-now ${isOOS ? "is-disabled" : ""}`}
            onClick={handleBuyNow}
            disabled={isOOS}
            title={isOOS ? "สินค้าหมด" : "ซื้อเลย"}
          >
            ซื้อเลย
          </button>
        </div>
      </div>
    </div>
  );
}
