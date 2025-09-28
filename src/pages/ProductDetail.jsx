import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProductById } from "../lib/api";

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

export default function ProductDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await fetchProductById(id);
      setItem(data);
    })();
  }, [id]);

  if (!item) return <p>กำลังโหลด...</p>;

  return (
    <div className="container-narrow">
      <h2>{item.name}</h2>
      <img
        src={resolveImageSrc(item)}
        alt={item.name}
        loading="lazy"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/placeholder.jpg"; }}
      />
      <p>ราคา: ${Number(item.price).toFixed(2)}</p>
      <p>คงเหลือ: {item.stock}</p>
    </div>
  );
}
