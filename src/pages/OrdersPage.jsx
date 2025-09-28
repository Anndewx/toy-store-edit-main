import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { THB } from "../lib/utils";

export default function OrdersPage(){
  const [list, setList] = useState([]);

  useEffect(()=>{
    (async()=>{
      const res = await fetch("http://localhost:3006/api/orders");
      setList(await res.json());
    })();
  },[]);

  return (
    <main className="hp-wrap">
      <div className="hp-container">
        <h2 className="hp-title">กระเป๋า (ประวัติคำสั่งซื้อ)</h2>
        <div className="card" style={{padding:16}}>
          {!list.length && <p className="muted">ยังไม่มีคำสั่งซื้อ</p>}
          {list.map(o=>(
            <div className="row" key={o.id}>
              <div className="grow">
                <div><b>#{o.id}</b> — {o.customer_name || "ลูกค้า"}</div>
                <div className="muted">{new Date(o.created_at).toLocaleString("th-TH")}</div>
              </div>
              <div style={{marginRight:10}}>{THB.format(o.total)}</div>
              <Link className="btn--ghost" to={`/orders/${o.id}`}>ดูใบเสร็จ</Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
