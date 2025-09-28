// src/components/ProductList.jsx
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

export default function ProductList() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) {
          setError(`โหลดสินค้าล้มเหลว (${res.status})`);
          return;
        }
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setError('มีปัญหาในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    })();
  }, []);

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!items.length) return <p>ไม่พบสินค้า</p>;

  return (
    <div className="grid-products">
      {items.map((p, i) => (
        <ProductCard key={p?.product_id || i} product={p} />
      ))}
    </div>
  );
}
