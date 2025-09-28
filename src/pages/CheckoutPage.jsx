import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../lib/api"; // ใช้เฉพาะ call จริง
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank"); // bank | cod | other

  // payload ของฟอร์มตามวิธีชำระเงิน
  const [bank, setBank] = useState({ bankName: "", last4: "", paidAt: "" });
  const [cod, setCod] = useState({ receiver: "", phone: "", address: "" });
  const [other, setOther] = useState({ ref: "", paidAt: "" }); // PromptPay/QR

  const openPayModal = () => {
    if (!items.length || processing) return;
    setShowPayModal(true);
  };

  function makeReceiptPayload() {
    if (paymentMethod === "bank") return bank;
    if (paymentMethod === "cod") return cod;
    return other;
  }

  async function confirmPayment() {
    if (!items.length || processing) return;

    setProcessing(true);
    const payload = makeReceiptPayload();
    const now = new Date().toISOString();

    // ฟังก์ชันบันทึกใบเสร็จลง localStorage เพื่อให้หน้า Receipt ใช้งานทันที
    const saveLastOrder = (data, isDemo = false) => {
      const receipt = {
        order_id: data.order_id,
        items: data.items,
        total: data.total,
        method: paymentMethod,
        payload,
        at: now,
        demo: isDemo,
      };
      localStorage.setItem("lastOrder", JSON.stringify(receipt));
    };

    try {
      // call API จริง (ถ้าพร้อมใช้งาน)
      const resp = await createOrder({ payment_method: paymentMethod });
      if (resp?.ok && resp?.order_id) {
        // สมมุติ API ตอบกลับ total + items (ตาม server ปัจจุบัน)
        saveLastOrder(
          {
            order_id: resp.order_id,
            total: Number(resp.total || total || 0),
            items:
              resp.items?.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
              })) ||
              items.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
              })),
          },
          false
        );
        clear();
        setShowPayModal(false);
        navigate(`/wallet?order=${encodeURIComponent(resp.order_id)}`);
        return;
      }
      throw new Error("createOrder failed");
    } catch (e) {
      // Fallback เดโม่ — ไม่แตะ DB
      const demoId = `DEMO-${Date.now()}`;
      saveLastOrder(
        {
          order_id: demoId,
          total: Number(total || 0),
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
        },
        true
      );
      clear();
      setShowPayModal(false);
      navigate(`/wallet?order=${encodeURIComponent(demoId)}`);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="container py-4">
      <h2>ชำระเงิน</h2>

      {/* สรุปคำสั่งซื้อ */}
      <div className="card mb-3">
        <div className="card-body">
          <h5>สรุปคำสั่งซื้อ</h5>
          <ul className="list-group list-group-flush">
            {items.map((item) => (
              <li
                key={item.product_id}
                className="list-group-item d-flex justify-content-between"
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>฿{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 d-flex justify-content-between">
            <strong>ราคารวม:</strong>
            <strong className="text-primary">฿{(total || 0).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/cart")}
          disabled={processing}
        >
          ย้อนกลับ
        </button>
        <button
          className="btn btn-success flex-fill"
          onClick={openPayModal}
          disabled={processing || !items.length}
        >
          {processing ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
        </button>
      </div>

      {/* Modal เลือกวิธีชำระเงิน + ฟอร์มย่อย */}
      {showPayModal && (
        <div className="pay-backdrop" onClick={() => !processing && setShowPayModal(false)}>
          <div className="pay-box" onClick={(e) => e.stopPropagation()}>
            <h4>เลือกวิธีชำระเงิน</h4>

            <div className="pay-options">
              <div
                className={`pay-card ${paymentMethod === "bank" ? "active" : ""}`}
                onClick={() => setPaymentMethod("bank")}
              >
                🏦 โอนธนาคาร
              </div>
              <div
                className={`pay-card ${paymentMethod === "cod" ? "active" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                📦 เก็บเงินปลายทาง
              </div>
              <div
                className={`pay-card ${paymentMethod === "other" ? "active" : ""}`}
                onClick={() => setPaymentMethod("other")}
              >
                💳 PromptPay / QR
              </div>
            </div>

            {/* ฟอร์มย่อยตามวิธี */}
            {paymentMethod === "bank" && (
              <div className="pay-form">
                <div className="mb-2">
                  <label className="form-label">ธนาคาร</label>
                  <input
                    className="form-control"
                    placeholder="เช่น กสิกรไทย"
                    value={bank.bankName}
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">เลขบัญชี (4 ตัวท้าย)</label>
                  <input
                    className="form-control"
                    maxLength={4}
                    value={bank.last4}
                    onChange={(e) =>
                      setBank({ ...bank, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">เวลาที่โอน</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={bank.paidAt}
                    onChange={(e) => setBank({ ...bank, paidAt: e.target.value })}
                  />
                </div>
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="pay-form">
                <div className="mb-2">
                  <label className="form-label">ผู้รับ</label>
                  <input
                    className="form-control"
                    value={cod.receiver}
                    onChange={(e) => setCod({ ...cod, receiver: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">โทร</label>
                  <input
                    className="form-control"
                    value={cod.phone}
                    onChange={(e) => setCod({ ...cod, phone: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">ที่อยู่จัดส่ง</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={cod.address}
                    onChange={(e) => setCod({ ...cod, address: e.target.value })}
                  />
                </div>
              </div>
            )}

            {paymentMethod === "other" && (
              <div className="pay-form">
                <div className="mb-2">
                  <label className="form-label">รหัสอ้างอิง / Ref</label>
                  <input
                    className="form-control"
                    placeholder="เช่น QR-2024-xxxxx"
                    value={other.ref}
                    onChange={(e) => setOther({ ...other, ref: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">เวลาที่ชำระ</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={other.paidAt}
                    onChange={(e) => setOther({ ...other, paidAt: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-danger me-2" onClick={() => !processing && setShowPayModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" onClick={confirmPayment} disabled={processing}>
                {processing ? "กำลังยืนยัน..." : "ยืนยันการชำระเงิน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
