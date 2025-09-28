import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

/** แปลงค่ารูปให้เป็น path ที่ proxy ได้ และมี fallback */
function resolveImageSrc(product) {
  const raw0 = product?.image_url ?? product?.image ?? "";
  const raw = String(raw0).trim();

  // รูปว่าง -> ใช้ placeholder (อย่าลืมมีไฟล์นี้ใน backend: public/images/placeholder.jpg)
  if (!raw) return "/images/placeholder.jpg";

  // ถ้าเป็น URL เต็ม (http/https) ก็ให้ใช้ได้เลย
  if (/^https?:\/\//i.test(raw)) return raw;

  // ถ้าให้มาเป็น "/images/xxx.jpg" (หรือ "images/xxx.jpg") -> บังคับให้เป็น path relative เพื่อให้ proxy ทำงาน
  if (raw.startsWith("/images/")) return raw;
  if (raw.startsWith("images/")) return "/" + raw;

  // ถ้าเป็นแค่ชื่อไฟล์ "gundam.jpg" -> ต่อ prefix /images/
  if (/^[^/\\]+\.[a-z0-9]{2,5}$/i.test(raw)) return `/images/${raw}`;

  // กรณีอื่น ๆ ให้บังคับเป็น relative เช่น "/<raw>"
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export default function ProductCard({ product, loading }) {
  const { add } = useCart();

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

  const {
    product_id,
    name,
    price,
    original_price,
    stock = 0,
    on_sale,
  } = product;

  const hasDiscount =
    on_sale === 1 || (original_price && Number(original_price) > Number(price));
  const discountPercent =
    hasDiscount && original_price
      ? Math.round(((original_price - price) / original_price) * 100)
      : 0;

  const stockStatus = stock > 10 ? "in-stock" : stock > 0 ? "low-stock" : "out-of-stock";
  const stockText =
    stock > 10 ? `มีสินค้า ${stock} ชิ้น` : stock > 0 ? `เหลือเพียง ${stock} ชิ้น!` : "สินค้าหมด";

  const imgSrc = resolveImageSrc(product);

  return (
    <div className="p-card">
      <Link to={`/product/${product_id}`} className="p-thumb" title={name}>
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/placeholder.jpg";
          }}
        />
        <div className="p-badges">
          {hasDiscount && <span className="badge badge-sale">-{discountPercent}%</span>}
          {stock <= 5 && stock > 0 && <span className="badge badge-hot">เหลือน้อย</span>}
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

        <div className="p-price">
          <span className="price">฿{Number(price).toFixed(2)}</span>
          {hasDiscount && original_price && (
            <span className="ori">฿{Number(original_price).toFixed(2)}</span>
          )}
        </div>

        <button className="btn-primary" onClick={() => add(product_id, 1)} disabled={stock === 0}>
          {stock === 0 ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
        </button>
      </div>
    </div>
  );
}
