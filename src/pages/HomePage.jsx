import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../lib/api";

export default function HomePage() {
  const [allItems, setAllItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);

        // สินค้าทั้งหมด
        const all = await fetchProducts();

        // สินค้ามาใหม่จาก backend (ล่าสุด 12 ชิ้น)
        const resp = await fetch("/api/products/new?limit=12");
        const newest = await resp.json();

        if (!alive) return;
        setAllItems(Array.isArray(all) ? all : []);
        setNewItems(Array.isArray(newest) ? newest : []);
      } catch (e) {
        console.error("Home fetch error:", e);
        if (alive) setErr("โหลดสินค้าล้มเหลว (500) — กรุณาตรวจสอบเซิร์ฟเวอร์");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const featured = useMemo(() => {
    const arr = [...allItems];
    arr.sort((a,b) => (b?.on_sale?1:0) - (a?.on_sale?1:0) || Number(a?.price ?? 0) - Number(b?.price ?? 0));
    return arr;
  }, [allItems]);

  const skeletons = Array.from({ length: 8 });

  return (
    <div className="container-narrow" style={{ paddingTop: 24 }}>
      <h2 className="mb-3 text-dark">สินค้าแนะนำ</h2>
      {err && <div className="alert alert-warning mb-3">{err}</div>}
      <div className="grid-products">
        {(loading ? skeletons : featured).map((p,i) => (
          <ProductCard key={`${p?.product_id ?? "s"}-${i}`} product={p} loading={loading} />
        ))}
      </div>

      <section style={{ marginTop: 40 }}>
        <h2 className="mb-3 text-dark">สินค้ามาใหม่</h2>
        <div className="grid-products">
          {(loading ? skeletons : newItems).map((p,i) => (
            <ProductCard key={`${p?.product_id ?? "n"}-${i}`} product={p} loading={loading} />
          ))}
        </div>
      </section>
    </div>
  );
}
