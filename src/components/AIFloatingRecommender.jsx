import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../context/CartContext";               // เดิม
import { fetchProducts, fetchRecommend } from "../lib/api";     // เดิม

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ===== Local behavior (เดิม) ==================================================
const Behavior = {
  get() { try { return JSON.parse(localStorage.getItem("ai_behavior") || "{}"); } catch { return {}; } },
  set(d) { localStorage.setItem("ai_behavior", JSON.stringify(d)); },
  viewed(p) { const b = this.get(); b.viewed = Array.from(new Set([...(b.viewed||[]), p.product_id])); this.set(b); },
  cart(p) { const b = this.get(); b.cart = [...(b.cart||[]), p.product_id]; this.set(b); }
};

// ===== Utilities ==============================================================
function classNames(...xs){ return xs.filter(Boolean).join(" "); }
function productImage(p){
  const img = p.image_url || p.image || "";
  if (!img) return "https://picsum.photos/seed/placeholder/160/160";
  if (/^https?:/i.test(img)) return img;
  const path = img.startsWith("/") ? img : `/${img}`;
  return `${API_BASE}${path}`;
}

// ===== Skeleton (โหลดรายการระหว่างรอ) =========================================
function SkeletonCard() {
  return (
    <div style={styles.cardSkeleton}>
      <div style={styles.skelThumb}/>
      <div style={{display:"grid", gap:6}}>
        <div style={styles.skelLine(120)}/>
        <div style={styles.skelLine(90)}/>
        <div style={styles.skelLine(70)}/>
      </div>
      <div style={{display:"grid", gap:8, alignContent:"center"}}>
        <div style={styles.skelPill}/>
        <div style={styles.skelBtn}/>
      </div>
    </div>
  );
}

// ===== Main Component =========================================================
export default function AIFloatingRecommender(){
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tags, setTags] = useState([]);
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  const { add: addToRealCart } = useCart();                     // เดิม

  // Debounce 380ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 380);
    return () => clearTimeout(t);
  }, [query]);

  // Load initial / server recommend
  useEffect(()=>{
    if (!open) return;
    let ignore = false;
    (async()=>{
      try {
        setLoading(true);
        let data;
        if (debounced) {
          data = await fetchRecommend({ q: buildQuery(query, tags), limit: 12 });
        } else {
          // โหลดเริ่มต้น: สินค้ายอดนิยม/ล่าสุดจากระบบเดิม
          data = await fetchProducts();
        }
        if (!ignore) setProducts(Array.isArray(data) ? data : (data?.data || []));
      } catch(e){
        console.error("AI widget: fetch failed", e);
      } finally {
        setLoading(false);
      }
    })();
    return ()=>{ ignore = true; };
  },[debounced, tags, open]);

  // Focus ช่องค้นหาเมื่อเปิด
  useEffect(()=>{ if (open) setTimeout(()=> searchRef.current?.focus(), 10); }, [open]);

  // Close on outside click + ESC
  useEffect(()=>{
    function onDocClick(e){ if (open && panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); }
    function onKey(e){ if (!open) return; if (e.key === "Escape") setOpen(false); if (e.key === "Enter") setQuery(q=>q.trim()); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return ()=>{ document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  },[open]);

  // Personalised ranking (ของเดิม)
  const recommended = useMemo(()=>{
    const q = (buildQuery(query, tags)||"").toLowerCase();
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
    if (budget !== null && !Number.isNaN(budget)) pool = pool.filter(p => Number(p.price) <= budget);
    if (saleOnly) pool = pool.filter(p => p.on_sale === 1 || p.on_sale === true || p.on_sale === "1");
    if (giftMode) pool = [...pool].sort((a,b)=> Math.abs(Number(a.price)-55) - Math.abs(Number(b.price)-55));

    // score จากประวัติ
    const b = Behavior.get();
    if (b.viewed?.length) {
      const viewed = products.filter(p=> b.viewed.includes(p.product_id));
      const nameHints = new Map(), catHints = new Map();
      viewed.forEach(v=>{
        (v.name||"").split(/\s+/).forEach(t=> nameHints.set(t.toLowerCase(), (nameHints.get(t.toLowerCase())||0)+1));
        catHints.set(v.category_slug, (catHints.get(v.category_slug)||0)+1);
      });
      const score = (p)=> (p.name||"").toLowerCase().split(/\s+/).reduce((s,t)=> s+(nameHints.get(t)||0),0)*2 + (catHints.get(p.category_slug)||0);
      pool = [...pool].sort((a,b)=> score(b)-score(a));
    }

    if (!pool.length) pool = products.slice();
    pool = [...pool].sort((a,b)=> (b.on_sale?1:0) - (a.on_sale?1:0) || Number(a.price)-Number(b.price));

    return pool.slice(0, 8);
  }, [products, query, tags]);

  async function addToCart(product){
    try {
      await addToRealCart(product.product_id, 1);
      Behavior.cart(product);
      window.dispatchEvent(new Event("open-cart"));
    } catch(e){
      console.error("addToCart failed", e);
      alert("เพิ่มลงตะกร้าไม่สำเร็จ");
    }
  }

  // ====== UI ==================================================================
  return (
    <>
      {/* FLOAT BUTTON */}
      <style>{styles.css}</style>
      {open && <div aria-hidden className="ai-overlay" onClick={()=>setOpen(false)} />}

      <button
        aria-label="ผู้ช่วยแนะนำสินค้า"
        className="ai-fab"
        onClick={()=> setOpen(v=>!v)}
        title="ผู้ช่วยแนะนำสินค้า (AI)"
      >
        <span className="ai-fab-icon">🧠</span>
      </button>

      {open && (
        <section
          ref={panelRef}
          aria-live="polite"
          aria-expanded={open}
          role="dialog"
          aria-label="ผู้ช่วยแนะนำสินค้า"
          className="ai-panel"
        >
          {/* Header */}
          <header className="ai-header">
            <div className="ai-logo">AI</div>
            <div className="ai-title">
              <div className="ai-title-main">ผู้ช่วยแนะนำสินค้า</div>
              <div className="ai-title-sub">พิมพ์สิ่งที่อยากได้ เช่น “GUNDAM” หรือใช้ปุ่มลัด</div>
            </div>
            <button className="ai-x" onClick={()=>setOpen(false)} title="ปิด">✕</button>
          </header>

          {/* Search */}
          <div className="ai-searchbar">
            <div className="ai-search-icon">🔎</div>
            <input
              ref={searchRef}
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="อยากได้สินค้าแบบไหน... (เช่น gundam 60 ของขวัญ)"
              className="ai-input"
            />
            {query && <button className="ai-clear" onClick={()=>setQuery("")} aria-label="ล้างคำค้น">⌫</button>}
            <button className="ai-primary" onClick={()=>setQuery(q=>q.trim())}>แนะนำ</button>
          </div>

          {/* Quick chips */}
          <div className="ai-chips">
            {[
              {t:"กันดั้ม ≤ 60",q:"gundam 60"},
              {t:"อนิเมยอดนิยม",q:"anime gift"},
              {t:"ซุปเปอร์ฮีโร่ลดราคา",q:"superhero sale"},
              {t:"เกม ราคา ≤ 40",q:"game 40"},
            ].map((c,i)=> (
              <button key={i} className="ai-chip" onClick={()=>setQuery(c.q)}>{c.t}</button>
            ))}
            {/* toggle tags */}
            {["sale","gift","anime","gundam","game"].map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  className={classNames("ai-chip", active && "ai-chip--active")}
                  onClick={()=> setTags(s => active ? s.filter(x=>x!==t) : [...s, t])}
                >
                  #{t}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="ai-content">
            {loading ? (
              <>
                {Array.from({length:6}).map((_,i)=> <SkeletonCard key={i}/>)}
              </>
            ) : (
              <>
                {recommended.map(p => (
                  <article key={p.product_id} className="ai-card" tabIndex={0}>
                    <div className="ai-thumb-wrap">
                      {p.on_sale ? <span className="ai-badge">SALE</span> : null}
                      <img alt={p.name} src={productImage(p)} className="ai-thumb" />
                    </div>

                    <div className="ai-info">
                      <h3 className="ai-name" title={p.name}>{p.name}</h3>
                      <div className="ai-meta">
                        <span className="ai-cat">{p.category_slug || "other"}</span>
                      </div>
                    </div>

                    <div className="ai-cta">
                      <div className="ai-price">฿{Number(p.price).toFixed(2)}</div>
                      <button className="ai-add" onClick={()=>addToCart(p)}>เพิ่มลงตะกร้า</button>
                    </div>
                  </article>
                ))}

                {!recommended.length && (
                  <div className="ai-empty">
                    <div className="ai-empty-emoji">🔎</div>
                    <div className="ai-empty-title">ยังไม่พบสินค้าที่ตรงใจ</div>
                    <div className="ai-empty-sub">ลองลดเงื่อนไขลงหรือเพิ่มงบประมาณดูนะ</div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}

// ===== Helpers =================================================================
function buildQuery(q, tags){
  const t = (tags||[]).join(" ");
  return [q, t].filter(Boolean).join(" ").trim();
}

// ===== Inline Styles / CSS =====================================================
const styles = {
  css: `
  :root{
    --ai-bg: rgba(12, 19, 34, .78);
    --ai-surface: rgba(16, 24, 40, .85);
    --ai-border: rgba(255,255,255,.08);
    --ai-text: #E8EEFC;
    --ai-sub: #9db1d9;
    --ai-primary: #1f7cff;
    --ai-primary-2: #6aa6ff;
    --ai-green: #22c55e;
  }
  .ai-overlay{
    position:fixed; inset:0; background:rgba(4,10,20,.35); backdrop-filter: blur(2px);
    animation: fadeIn .18s ease-out;
  }
  .ai-fab{
    position:fixed; right:20px; bottom:20px; width:58px; height:58px; border-radius:999px;
    border:none; cursor:pointer; z-index:9999; color:#fff;
    background: radial-gradient(120% 120% at 10% 10%, var(--ai-primary-2), var(--ai-primary));
    box-shadow: 0 14px 28px rgba(31,124,255,.38), 0 2px 8px rgba(0,0,0,.25);
    transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
  }
  .ai-fab:hover{ transform: translateY(-2px); filter: brightness(1.05); }
  .ai-fab:active{ transform: translateY(0); filter: brightness(.98); }
  .ai-fab-icon{ font-size:22px; font-weight:800; }

  .ai-panel{
    position:fixed; right:20px; bottom:92px; width:min(420px,92vw); max-height:82vh;
    display:flex; flex-direction:column; overflow:hidden; z-index:10000;
    background: linear-gradient(180deg, #101827 0%, #0b1424 64%);
    border:1px solid var(--ai-border); border-radius:18px;
    box-shadow: 0 20px 48px rgba(0,0,0,.45);
    color: var(--ai-text); backdrop-filter: blur(10px);
    animation: slideUp .18s ease-out;
  }

  .ai-header{
    display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid var(--ai-border);
  }
  .ai-logo{
    width:30px; height:30px; border-radius:10px; font-weight:900; display:grid; place-items:center;
    background: linear-gradient(145deg, var(--ai-primary), var(--ai-primary-2));
    color:#fff; letter-spacing:.5px;
  }
  .ai-title-main{ font-size:15px; font-weight:800; }
  .ai-title-sub{ font-size:12px; color:var(--ai-sub); }

  .ai-x{
    margin-left:auto; background:transparent; color:#b8c7e6; border:none; font-size:20px; cursor:pointer;
    padding:4px 6px; border-radius:8px; transition: background .12s ease;
  }
  .ai-x:hover{ background: rgba(255,255,255,.06); }

  .ai-searchbar{
    display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid var(--ai-border);
    background: rgba(8,14,26,.5);
  }
  .ai-search-icon{ opacity:.8; }
  .ai-input{
    flex:1; border-radius:12px; background:#0b1424; border:1px solid var(--ai-border);
    color:var(--ai-text); padding:10px 12px; outline:none;
  }
  .ai-input:focus{ border-color:#2a64ff; box-shadow: 0 0 0 2px rgba(42,100,255,.25); }
  .ai-clear{
    background:transparent; color:#9fb1d5; border:1px solid var(--ai-border);
    border-radius:10px; padding:6px 8px; cursor:pointer;
  }
  .ai-primary{
    background: var(--ai-primary); color:white; border:none; border-radius:12px;
    padding:10px 14px; font-weight:800; cursor:pointer; transition: filter .12s ease, transform .12s ease;
  }
  .ai-primary:hover{ filter:brightness(1.05); transform: translateY(-1px); }

  .ai-chips{ display:flex; gap:8px; flex-wrap:wrap; padding:10px 12px; border-bottom:1px solid var(--ai-border); }
  .ai-chip{
    padding:8px 10px; border-radius:999px; border:1px solid var(--ai-border);
    background:#0c1627; color:#dbe7ff; font-size:12px; cursor:pointer;
    transition: transform .08s ease, background .12s ease;
  }
  .ai-chip:hover{ transform: translateY(-1px); background:#0e1a31; }
  .ai-chip--active{ background:#13274e; border-color:#274aa8; }

  .ai-content{ padding:12px; overflow:auto; max-height: calc(82vh - 176px); display:grid; gap:10px; }
  .ai-content::-webkit-scrollbar{ width:10px; }
  .ai-content::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.09); border-radius:8px; }

  .ai-card{
    display:grid; grid-template-columns: 72px 1fr auto; gap:12px; align-items:center;
    padding:12px; border-radius:14px; background:#0f1625; border:1px solid var(--ai-border);
    transition: transform .08s ease, border-color .12s ease, background .12s ease;
  }
  .ai-card:focus{ outline:none; border-color:#2a64ff; }
  .ai-card:hover{ transform: translateY(-1px); background:#101a2f; }

  .ai-thumb-wrap{ position:relative; }
  .ai-thumb{
    width:72px; height:72px; object-fit:cover; border-radius:12px; display:block;
    box-shadow: 0 4px 10px rgba(0,0,0,.25);
  }
  .ai-badge{
    position:absolute; top:6px; left:6px; font-size:10px; font-weight:900;
    background:#1ee3a2; color:#052119; border-radius:999px; padding:2px 6px; box-shadow:0 1px 6px rgba(0,0,0,.25);
  }

  .ai-info{ min-width:0; }
  .ai-name{ font-size:14px; font-weight:800; margin:0 0 6px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ai-meta{ font-size:12px; color:var(--ai-sub); display:flex; gap:8px; flex-wrap:wrap; }
  .ai-cat{ padding:2px 8px; border:1px solid var(--ai-border); border-radius:999px; background:#0c1627; }

  .ai-cta{ text-align:right; display:grid; gap:8px; align-content:center; }
  .ai-price{ font-weight:900; font-size:15px; }
  .ai-add{
    background:var(--ai-green); color:#04110a; border:none; border-radius:10px; padding:8px 10px; font-weight:900; cursor:pointer;
    transition: transform .08s ease, filter .12s ease;
  }
  .ai-add:hover{ transform: translateY(-1px); filter:brightness(1.03); }
  .ai-add:active{ transform: translateY(0); }

  .ai-empty{ text-align:center; color:var(--ai-sub); padding:24px 8px; }
  .ai-empty-emoji{ font-size:28px; }
  .ai-empty-title{ font-weight:800; margin-top:6px; color:var(--ai-text); }
  .ai-empty-sub{ font-size:12px; margin-top:2px; }

  /* Skeleton */
  .ai-shimmer{ background: linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.12), rgba(255,255,255,.06));
               background-size: 200% 100%; animation: shimmer 1.2s infinite; }

  @keyframes slideUp { from{ transform: translateY(8px); opacity:0 } to { transform: translateY(0); opacity:1 } }
  @keyframes fadeIn  { from{ opacity:0 } to { opacity:1 } }
  @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
  `,

  cardSkeleton: {
    display:"grid", gridTemplateColumns:"72px 1fr auto", gap:12, alignItems:"center",
    padding:12, borderRadius:14, background:"#0f1625", border:"1px solid rgba(255,255,255,.06)"
  },
  skelThumb: { width:72, height:72, borderRadius:12, background:"rgba(255,255,255,.06)" , boxShadow:"0 4px 10px rgba(0,0,0,.25)" , overflow:"hidden" , position:"relative" , },
  skelLine: (w)=> ({ width:w, height:10, borderRadius:6, background:"rgba(255,255,255,.06)" }),
  skelPill: { width:70, height:18, borderRadius:999, background:"rgba(255,255,255,.06)" },
  skelBtn:  { width:110, height:34, borderRadius:10, background:"rgba(255,255,255,.06)" },
};
