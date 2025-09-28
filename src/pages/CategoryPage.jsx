import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

/**
 * ดึงคำจาก string เพื่อใช้จับคู่ (ชื่อ, tag, category, ไฟล์รูป)
 */
function normalize(str = "") {
  return String(str).toLowerCase().replace(/[_\-]+/g, " ");
}

/**
 * คืนชื่อไฟล์จาก URL รูปภาพ
 */
function filenameFromUrl(url = "") {
  try {
    const u = new URL(url, window.location.origin);
    const name = u.pathname.split("/").pop() || "";
    return name.toLowerCase();
  } catch {
    // ถ้า url ไม่สมบูรณ์ ก็ลองตัดด้วย / ตรง ๆ
    const name = (url || "").split("?")[0].split("/").pop() || "";
    return name.toLowerCase();
  }
}

/**
 * เดาว่ารายการนี้อยู่หมวดไหน จาก category/tags/name/filename
 */
function classify(product) {
  const cat = normalize(product?.category || "");
  const tags = normalize(product?.tags || "");
  const name = normalize(product?.name || "");
  const file = filenameFromUrl(product?.image_url || "");

  const hay = [cat, tags, name, file].join(" ");

  // คีย์เวิร์ดสำหรับแต่ละหมวด
  const rules = {
    gundam: [
      "gundam", "gunpla", "mg ", "hg ", "rg ", "exia", "sazabi", "astray", "zaku"
    ],
    superhero: [
      "superhero", "batman", "spider", "iron", "captain", "thor", "avengers", "dc", "marvel", "joker", "deadpool"
    ],
    anime: [
      "anime", "nendoroid", "figure", "nezuko", "tanjiro", "demon slayer", "rem", "re:zero", "one piece", "naruto"
    ],
    game: [
      "game", "mario", "zelda", "kirby", "pokemon", "link", "playstation", "xbox", "nintendo", "switch"
    ],
  };

  for (const key of Object.keys(rules)) {
    if (rules[key].some((kw) => hay.includes(kw))) return key;
  }
  // ถ้า category ใน DB ตรงชื่ออยู่แล้ว
  if (["gundam", "superhero", "anime", "game"].includes(cat)) return cat;

  return "other";
}

export default function CategoryPage() {
  const { slug } = useParams(); // gundam | superhero | anime | game | new | hot
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // พยายามใช้ API ตามหมวดก่อน (ถ้า backend รองรับ)
        const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}`);
        let data = res.ok ? await res.json() : [];

        // ถ้า backend ยังไม่กรองให้ หรือผลว่าง → ดึงทั้งหมด
        if (!Array.isArray(data) || data.length === 0) {
          const allRes = await fetch("/api/products");
          data = allRes.ok ? await allRes.json() : [];
        }

        if (alive) setAll(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (alive) {
          setErr("ไม่สามารถโหลดสินค้าได้");
          setAll([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [slug]);

  // กรองตาม slug โดยใช้ตัวเดา category จากชื่อ/แท็ก/ไฟล์รูป
  const items = useMemo(() => {
    const s = (slug || "").toLowerCase();

    if (s === "new") {
      return [...all]
        .sort((a, b) => new Date(b.created_at || b.product_id) - new Date(a.created_at || a.product_id))
        .slice(0, 24);
    }

    if (s === "hot") {
      return all.filter((p) => Number(p.is_hot) === 1 || Number(p.sales_count) > 0);
    }

    if (["gundam", "superhero", "anime", "game"].includes(s)) {
      return all.filter((p) => {
        // แมชแบบเข้มจาก category/tags ก่อน
        const cat = (p.category || "").toLowerCase();
        const tags = (p.tags || "").toLowerCase();
        if (cat === s) return true;
        if (tags.split(",").map((t) => t.trim()).includes(s)) return true;

        // แล้วค่อย fallback เดาจากชื่อ/ไฟล์รูป
        return classify(p) === s;
      });
    }

    return all;
  }, [all, slug]);

  return (
    <div className="container-narrow" style={{ paddingTop: 24 }}>
      <h2 style={{ marginBottom: 12 }}>{(slug || "").toUpperCase()}</h2>
      {err && <div className="alert alert-warning">{err}</div>}

      <div className="grid-products">
        {(loading ? Array.from({ length: 8 }) : items).map((p, i) => (
          <ProductCard key={p?.product_id || i} product={p} />
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div style={{ marginTop: 16, color: "#6b7280" }}>ไม่พบสินค้าตามหมวดนี้</div>
      )}
    </div>
  );
}
