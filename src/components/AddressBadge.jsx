// src/components/AddressBadge.jsx
import { Link } from "react-router-dom";
import "./AddressBadge.css";

export default function AddressBadge() {
  return (
    <Link to="/address" className="addr-badge" title="จัดการที่อยู่จัดส่ง">
      📍 จัดการที่อยู่จัดส่ง
    </Link>
  );
}
