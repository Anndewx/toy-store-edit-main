import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { cart, remove } = useCart();

  return (
    <div className="container-narrow">
      <h2>ตะกร้าสินค้า</h2>
      {cart.length === 0 ? (
        <p>ยังไม่มีสินค้าในตะกร้า</p>
      ) : (
        cart.map((c) => (
          <div key={c.product_id}>
            {c.name} x {c.qty}
            <button onClick={() => remove(c.product_id)}>ลบ</button>
          </div>
        ))
      )}
    </div>
  );
}
