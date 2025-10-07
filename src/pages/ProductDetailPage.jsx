import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./ProductDetail.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

function resolveImageSrc(obj) {
  const raw0 = obj?.image_url ?? obj?.image ?? "";
  const raw = String(raw0).trim();
  if (!raw) return "/images/placeholder.jpg";
  if (/^https?:\/\//i.test(raw)) return raw;
  const onlyFile = /^[^/\\]+\.[a-z0-9]{2,5}$/i.test(raw);
  if (onlyFile) return `${API_BASE}/images/${raw}`;
  if (raw.startsWith("/images")) return `${API_BASE}${raw}`;
  if (raw.startsWith("images"))  return `${API_BASE}/${raw}`;
  if (raw.startsWith("/"))       return `${API_BASE}${raw}`;
  return `${API_BASE}/${raw}`;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { add } = useCart();
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/products/${id}`);
      const data = res.ok ? await res.json() : null;
      if (alive) setItem(data);
    })();
    return () => { alive = false; };
  }, [id]);

  if (!item) return <div className="container-narrow" style={{paddingTop:24}}>กำลังโหลด...</div>;

  const { name, price, original_price, stock, description } = item;
  const imgSrc = resolveImageSrc(item);

  return (
    <div className="container-narrow" style={{ paddingTop: 24 }}>
      <div className="pd">
        <div className="pd__left">
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/placeholder.jpg"; }}
          />
        </div>

        <div className="pd__right">
          <h1 className="pd__title">{name}</h1>

          <div className="pd__meta">คงเหลือในสต็อก: {stock}</div>

          <div className="pd__price">
            <span className="price">฿{Number(price).toFixed(2)}</span>
            {Number(original_price) > Number(price) && (
              <span className="ori">฿{Number(original_price).toFixed(2)}</span>
            )}
          </div>

          <div className="pd__qty">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <input value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)||1))}/>
            <button onClick={() => setQty(q => Math.min(stock || 99, q + 1))}>＋</button>
          </div>

          <button className="pd__add" onClick={() => add(item.product_id, qty)}>
            เพิ่มลงตะกร้า
          </button>

          {description && <p className="pd__desc">{description}</p>}
        </div>
      </div>
    </div>
  );
}
