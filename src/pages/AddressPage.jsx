// src/pages/AddressPage.jsx
import { useEffect, useMemo, useState } from "react";
import { get, post, patch, del } from "../lib/api";
import "./AddressPage.css";

const emptyForm = {
  full_name: "", phone: "",
  line1: "", line2: "",
  subdistrict: "", district: "", province: "", postcode: "",
  is_default: true,
};

export default function AddressPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    setLoading(true);
    try { setList(await get("/addresses")); }
    finally { setLoading(false); }
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const valid = useMemo(() => {
    return (
      form.full_name.trim() &&
      form.phone.trim() &&
      form.line1.trim() &&
      form.subdistrict.trim() &&
      form.district.trim() &&
      form.province.trim() &&
      /^\d{5}$/.test(form.postcode)
    );
  }, [form]);

  async function save(e){
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try{
      if (editingId){
        await patch(`/addresses/${editingId}`, form);
        if (form.is_default) await patch(`/addresses/${editingId}/default`, {});
      }else{
        await post(`/addresses`, form);
      }
      setForm(emptyForm); setEditingId(null);
      await refresh();
    } finally { setSaving(false); }
  }

  async function removeAddress(id){
    if (!confirm("ลบที่อยู่นี้ใช่หรือไม่?")) return;
    await del(`/addresses/${id}`); await refresh();
  }

  async function makeDefault(id){
    await patch(`/addresses/${id}/default`, {}); await refresh();
  }

  function editAddress(a){
    setEditingId(a.address_id);
    setForm({
      full_name: a.full_name, phone: a.phone,
      line1: a.line1, line2: a.line2 || "",
      subdistrict: a.subdistrict, district: a.district, province: a.province,
      postcode: a.postcode, is_default: !!a.is_default
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="addrp">
      <h1>ที่อยู่จัดส่ง</h1>

      <form className="addrp__form" onSubmit={save}>
        <div className="grid2">
          <div className="field"><label>ชื่อ-นามสกุล</label>
            <input name="full_name" value={form.full_name} onChange={onChange} required />
          </div>
          <div className="field"><label>เบอร์โทร</label>
            <input name="phone" value={form.phone} onChange={onChange} required />
          </div>
        </div>

        <div className="field"><label>ที่อยู่ (เช่น บ้านเลขที่, อาคาร)</label>
          <input name="line1" value={form.line1} onChange={onChange} required />
        </div>
        <div className="field"><label>ถนน / ซอย (ไม่บังคับ)</label>
          <input name="line2" value={form.line2} onChange={onChange} />
        </div>

        <div className="grid3">
          <div className="field"><label>ตำบล / แขวง</label>
            <input name="subdistrict" value={form.subdistrict} onChange={onChange} required />
          </div>
          <div className="field"><label>อำเภอ / เขต</label>
            <input name="district" value={form.district} onChange={onChange} required />
          </div>
          <div className="field"><label>จังหวัด</label>
            <input name="province" value={form.province} onChange={onChange} required />
          </div>
        </div>

        <div className="field"><label>รหัสไปรษณีย์</label>
          <input name="postcode" value={form.postcode} onChange={onChange} required />
        </div>

        <div className="actions">
          {editingId && (
            <button type="button" className="btn ghost" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
              ยกเลิกแก้ไข
            </button>
          )}
          <button className="btn primary" disabled={!valid || saving}>
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มที่อยู่"}
          </button>
        </div>
      </form>

      <h2>ที่อยู่ของฉัน</h2>
      {loading ? <div>กำลังโหลด…</div> : (
        list.length === 0 ? <div className="muted">ยังไม่มีที่อยู่</div> : (
          <div className="addrp__list">
            {list.map(a => (
              <div className={`card ${a.is_default ? "is-default" : ""}`} key={a.address_id}>
                <div className="card__main">
                  <div className="card__name">
                    <b>{a.full_name}</b> <span className="muted">{a.phone}</span>
                  </div>
                  <div className="card__addr">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.subdistrict}, {a.district}, {a.province} {a.postcode}
                  </div>
                </div>
                <div className="card__actions">
                  {!a.is_default && <button className="btn" onClick={() => makeDefault(a.address_id)}>ตั้งเป็นหลัก</button>}
                  <button className="btn" onClick={() => editAddress(a)}>แก้ไข</button>
                  <button className="btn danger" onClick={() => removeAddress(a.address_id)}>ลบ</button>
                </div>
                {a.is_default && <div className="chip">DEFAULT</div>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
