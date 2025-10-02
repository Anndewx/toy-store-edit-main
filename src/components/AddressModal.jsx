import { useEffect, useState } from "react";
import { get, post, patch, del } from "../lib/api";

export default function AddressModal({ onClose, onUpdated }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    subdistrict: "",
    district: "",
    province: "",
    postcode: "",
    is_default: true,
  });

  useEffect(() => {
    get("/addresses").then(setList);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newAddr = await post("/addresses", form);
    setList([...list, newAddr]);
    onUpdated(newAddr);
    onClose();
  };

  const setDefault = async (id) => {
    await patch(`/addresses/${id}/default`, {});
    const updated = list.map((a) => ({ ...a, is_default: a.address_id === id }));
    setList(updated);
    onUpdated(updated.find(a => a.address_id === id));
  };

  const removeAddr = async (id) => {
    await del(`/addresses/${id}`);
    setList(list.filter(a => a.address_id !== id));
  };

  return (
    <div className="addr-modal">
      <div className="addr-box">
        <h3>ที่อยู่จัดส่ง</h3>
        <button className="close-btn" onClick={onClose}>✖</button>

        {list.length > 0 && (
          <div className="addr-list">
            {list.map((a) => (
              <div key={a.address_id} className={`addr-item ${a.is_default ? "default" : ""}`}>
                <div>
                  <b>{a.full_name}</b> {a.phone}<br />
                  {a.line1}, {a.subdistrict}, {a.district}, {a.province} {a.postcode}
                </div>
                <div className="addr-actions">
                  {!a.is_default && (
                    <button onClick={() => setDefault(a.address_id)}>ตั้งเป็นหลัก</button>
                  )}
                  <button onClick={() => removeAddr(a.address_id)}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="addr-form">
          <input name="full_name" placeholder="ชื่อ-นามสกุล" value={form.full_name} onChange={handleChange} required />
          <input name="phone" placeholder="เบอร์โทร" value={form.phone} onChange={handleChange} required />
          <input name="line1" placeholder="ที่อยู่ (เช่น บ้านเลขที่, อาคาร)" value={form.line1} onChange={handleChange} required />
          <input name="line2" placeholder="ถนน / ซอย (ไม่บังคับ)" value={form.line2} onChange={handleChange} />
          <input name="subdistrict" placeholder="ตำบล / แขวง" value={form.subdistrict} onChange={handleChange} required />
          <input name="district" placeholder="อำเภอ / เขต" value={form.district} onChange={handleChange} required />
          <input name="province" placeholder="จังหวัด" value={form.province} onChange={handleChange} required />
          <input name="postcode" placeholder="รหัสไปรษณีย์" value={form.postcode} onChange={handleChange} required />
          <button type="submit" className="btn-primary">เพิ่มที่อยู่</button>
        </form>
      </div>
    </div>
  );
}
