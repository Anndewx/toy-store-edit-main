import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { THB, normalizeImage } from "../lib/utils";

export default function SearchPage(){
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [list, setList] = useState([]);
  const [loading,setLoading] = useState(true);
  const { add } = useCart();

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const res = await fetch(`http://localhost:3006/api/products?q=${encodeURIComponent(q)}`);
      setList(await res.json());
      setLoading(false);
    })();
  },[q]);

  return (
    <main className="hp-wrap">
      <div className="hp-container">
        <h2 className="hp-title">ผลการค้นหา: “{q}”</h2>
        <div className="grid">
          {(loading ? Array.from({length:8}) : list).map((p,i)=>(
            <article className={`card ${loading?"skeleton":""}`} key={p?.id||i}>
              <div className="img">
                {!loading && (
                  <Link to={`/product/${p.id}`}>
                    <img src={normalizeImage(p.image_url)} alt={p.name}/>
                  </Link>
                )}
              </div>
              {!loading && (
                <div className="body">
                  <h3 className="name"><Link to={`/product/${p.id}`}>{p.name}</Link></h3>
                  <p className="desc">{p.description}</p>
                  <div className="push"/>
                  <div className="price-row"><span className="price">{THB.format(p.price)}</span></div>
                  <button className="btn" onClick={()=>add(p,1)}>เพิ่มลงตะกร้า</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
