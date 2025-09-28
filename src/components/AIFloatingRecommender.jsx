import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../context/CartContext"; // ใช้งานตะกร้าจริง (add/refresh) 【turn2file2†source】
import { fetchProducts } from "../lib/api"; // ดึงสินค้าจริงจาก API (มีอยู่แล้ว) 【turn2file0†source】

// ถ้าจำเป็น คุณยังตั้ง VITE_API_BASE ได้ แต่ helper ใน lib/api จะยิงที่ /api ให้อัตโนมัติอยู่แล้ว
const API_BASE = import.meta.env.VITE_API_BASE || "";

const Behavior = {
  get() { try { return JSON.parse(localStorage.getItem("ai_behavior") || "{}"); } catch { return {}; } },
  set(d) { localStorage.setItem("ai_behavior", JSON.stringify(d)); },
  viewed(p) { const b = this.get(); b.viewed = Array.from(new Set([...(b.viewed||[]), p.product_id])); this.set(b); },
  cart(p) { const b = this.get(); b.cart = [...(b.cart||[]), p.product_id]; this.set(b); }
};

export default function AIFloatingRecommender(){
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);

  // 👉 ใช้ตะกร้าจริงจาก Context (มีเมธอด add() แล้วจะ refresh ให้อัตโนมัติ)
  const { add: addToRealCart } = useCart();           // 【turn2file2†source】

  // โหลดสินค้าจริง
  useEffect(()=>{
    let ignore = false;
    (async()=>{
      try {
        setLoading(true);
        const data = await fetchProducts();           // GET /api/products 【turn2file0†source】
        if (!ignore) setProducts(Array.isArray(data) ? data : (data?.data || []));
      } catch(e){
        console.error("AI widget: fetch products failed", e);
      } finally {
        setLoading(false);
      }
    })();
    return ()=>{ ignore = true; };
  },[]);

  // เลือกของแนะนำ (keyword + budget + behavior)
  const recommended = useMemo(()=>{
    const q = (query||"").toLowerCase();

    const budgetMatch = q.match(/(\d[\d,\.]*)/);
    const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(/[,\.]/g, "")) : null;

    const wantGundam   = /(gundam|กันดั้ม)/.test(q);
    const wantAnime    = /(anime|อนิเม|อนิเมะ)/.test(q);
    const wantHero     = /(superhero|ฮีโร่|ซุปเปอร์ฮีโร่)/.test(q);
    const wantGame     = /(game|เกม|gamer)/.test(q);
    const giftMode     = /(ของขวัญ|gift)/.test(q);
    const saleOnly     = /(ลดราคา|sale|on\s*sale)/.test(q);

    let pool = products.slice();

    if (wantGundam) pool = pool.filter(p => (p.category_slug||"").includes("gundam") || /gundam/i.test(p.name));
    if (wantAnime)  pool = pool.filter(p => (p.category_slug||"").includes("anime")  || /anime|nendo|rem|asuka|izuku/i.test(p.name));
    if (wantHero)   pool = pool.filter(p => (p.category_slug||"").includes("superhero") || /batman|stormtrooper|groot/i.test(p.name));
    if (wantGame)   pool = pool.filter(p => (p.category_slug||"").includes("game") || /mario|halo/i.test(p.name));

    if (budget !== null && !Number.isNaN(budget)) {
      pool = pool.filter(p => Number(p.price) <= budget);
    }

    if (saleOnly) pool = pool.filter(p => p.on_sale === 1 || p.on_sale === true || p.on_sale === "1");

    if (giftMode) {
      pool = [...pool].sort((a,b)=> Math.abs(Number(a.price)-55) - Math.abs(Number(b.price)-55));
    }

    const b = Behavior.get();
    if (b.viewed?.length) {
      const viewed = products.filter(p=> b.viewed.includes(p.product_id));
      const nameHints = new Map();
      const catHints = new Map();
      viewed.forEach(v=>{
        (v.name||"").split(/\s+/).forEach(t=> nameHints.set(t.toLowerCase(), (nameHints.get(t.toLowerCase())||0)+1));
        catHints.set(v.category_slug, (catHints.get(v.category_slug)||0)+1);
      });
      const score = (p)=>{
        const n = (p.name||"").toLowerCase().split(/\s+/).reduce((s,t)=> s + (nameHints.get(t)||0), 0);
        const c = (catHints.get(p.category_slug)||0);
        return n*2 + c;
      };
      pool = [...pool].sort((a,b)=> score(b)-score(a));
    }

    if (!pool.length) {
      pool = products.slice();
    }
    pool = [...pool].sort((a,b)=> (b.on_sale?1:0) - (a.on_sale?1:0) || Number(a.price)-Number(b.price));

    return pool.slice(0, 6);
  }, [products, query]);

  // สร้าง URL รูป (รองรับทั้ง URL เต็ม และ path ที่ backend เสิร์ฟ /images)
  function productImage(p){
    const img = p.image_url || p.image || "";
    if (!img) return "https://picsum.photos/seed/placeholder/100/100";
    if (/^https?:/i.test(img)) return img;
    const path = img.startsWith("/") ? img : `/${img}`;
    return `${API_BASE}${path}`;
  }

  // ➕ เพิ่มเข้าตะกร้าจริง & เปิด Drawer
  async function addToCart(product){
    try {
      await addToRealCart(product.product_id, 1);      // เรียกเมธอด add ของ CartContext (จะ refresh เอง) 【turn2file2†source】
      Behavior.cart(product);
      window.dispatchEvent(new Event("open-cart"));    // ให้ CartDrawer เปิดขึ้นมา (มี listener อยู่แล้ว) 【turn2file3†source】
    } catch(e){
      console.error("addToCart failed", e);
      alert("เพิ่มลงตะกร้าไม่สำเร็จ");
    }
  }

  // ปิดเมื่อคลิกนอกกรอบ
  useEffect(()=>{
    function onDocClick(e){
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return ()=> document.removeEventListener("mousedown", onDocClick);
  },[open]);

  return (
    <>
      <button
        aria-label="แนะนำสินค้า"
        onClick={()=> setOpen(v=>!v)}
        style={{
          position:"fixed", right:20, bottom:20, width:56, height:56, borderRadius:999,
          border:"none", cursor:"pointer", zIndex:9999,
          background:"linear-gradient(145deg,#1f7cff,#6aa6ff)", color:"#fff",
          boxShadow:"0 12px 24px rgba(31,124,255,.45)", fontSize:22, fontWeight:800
        }}>🧠</button>

      {open && (
        <section ref={panelRef} aria-live="polite" aria-expanded={open}
          style={{
            position:"fixed", right:20, bottom:90, width:"min(380px,92vw)", maxHeight:"80vh",
            display:"flex", flexDirection:"column", overflow:"hidden", zIndex:9999,
            background:"linear-gradient(180deg,#121827,#0c1322 60%)",
            border:"1px solid rgba(255,255,255,.06)", borderRadius:16,
            boxShadow:"0 15px 35px rgba(0,0,0,.35)", color:"#e8eefc", backdropFilter:"blur(6px)"
          }}>
          <header style={{display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,.06)"}}>
            <div style={{width:28, height:28, borderRadius:8, fontWeight:900, display:"grid", placeItems:"center",
              background:"linear-gradient(145deg,#1f7cff,#9cc4ff)"}}>AI</div>
            <div style={{fontSize:15, fontWeight:700}}>ผู้ช่วยแนะนำสินค้า</div>
            <button onClick={()=>setOpen(false)} title="ปิด" style={{marginLeft:"auto", background:"transparent", color:"#9db1d9", border:"none", fontSize:20, cursor:"pointer"}}>✕</button>
          </header>

          <div style={{padding:12, overflow:"auto"}}>
            <div style={{color:"#9db1d9", fontSize:12, margin:"6px 0 12px"}}>พิมพ์สิ่งที่อยากได้ เช่น “กันดั้ม งบ 60” หรือกดปุ่มลัด</div>

            <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:10}}>
              {[{t:"กันดั้ม ≤ 60",q:"gundam 60"},{t:"อนิเมยอดนิยม",q:"anime gift"},{t:"ซุปเปอร์ฮีโร่ลดราคา",q:"superhero sale"},{t:"เกม ราคา ≤ 40",q:"game 40"}].map((c,i)=> (
                <button key={i} onClick={()=>setQuery(c.q)} style={{padding:"8px 10px", borderRadius:999, border:"1px solid rgba(255,255,255,.08)", background:"#0c1627", color:"#dbe7ff", fontSize:12, cursor:"pointer"}}>{c.t}</button>
              ))}
            </div>

            {loading && <div style={{padding:8, color:"#9db1d9"}}>กำลังดึงข้อมูลสินค้า…</div>}
            {!loading && (
              <div style={{display:"grid", gap:10}}>
                {recommended.map(p => (
                  <div key={p.product_id} style={{display:"grid", gridTemplateColumns:"64px 1fr auto", gap:10, alignItems:"center", padding:10, borderRadius:14, background:"#0f1625", border:"1px solid rgba(255,255,255,.06)"}}>
                    <img alt={p.name} src={productImage(p)} style={{width:64, height:64, objectFit:"cover", borderRadius:10}} />
                    <div>
                      <div style={{fontSize:14, fontWeight:700}}>{p.name}</div>
                      <div style={{fontSize:12, color:"#9db1d9"}}>{p.category_slug || "other"}{p.on_sale? " · SALE" : ""}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:800, fontSize:14}}>฿{Number(p.price).toFixed(2)}</div>
                      <button onClick={()=>addToCart(p)} style={{background:"#22c55e", color:"#04110a", border:"none", borderRadius:10, padding:"8px 10px", fontWeight:800, cursor:"pointer"}}>เพิ่มลงตะกร้า</button>
                    </div>
                  </div>
                ))}
                {!recommended.length && <div style={{color:"#9db1d9"}}>ไม่พบสินค้าที่ตรง—ลองลดเงื่อนไขหรือเพิ่มงบดูนะ</div>}
              </div>
            )}
          </div>

          <footer style={{display:"flex", gap:8, padding:12, borderTop:"1px solid rgba(255,255,255,.06)"}}>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="อยากได้สินค้าแบบไหน... (เช่น gundam 60 ของขวัญ)" style={{flex:1, borderRadius:12, background:"#0b1424", border:"1px solid rgba(255,255,255,.08)", color:"#e8eefc", padding:"10px 12px"}} />
            <button onClick={()=>setQuery(q=>q.trim())} style={{background:"#1f7cff", color:"white", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:700, cursor:"pointer"}}>แนะนำ</button>
          </footer>
        </section>
      )}
    </>
  );
}
