import { Route, Routes } from "react-router-dom";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import CategoryPage from "./pages/CategoryPage";
import Checkout from "./pages/Checkout";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ReceiptPage from "./pages/ReceiptPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import WalletPage from "./pages/WalletPage";
import AddressPage from "./pages/AddressPage";

// 🧠 เพิ่มคอมโพเนนต์ AI แนะนำสินค้า
import AIFloatingRecommender from "./components/AIFloatingRecommender";

// ✅ นำเข้าเพจนโยบายการจัดส่ง
import ShippingPolicy from "./pages/ShippingPolicy";

// ➕ (ใหม่) นำเข้าหน้าและ Route ของแอดมิน
import AdminRoute from "./AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";

export default function App() {
  return (
    <>
      {/* Navbar จะมีปุ่ม Profile + Cart */}
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        {/* ✅ ใช้ /category/:slug สำหรับ Shop */}
        <Route path="/category/:slug" element={<CategoryPage />} />
        {/* ✅ route รายละเอียดสินค้า */}
        <Route path="/product/:id" element={<ProductDetailPage />} />

        {/* Checkout */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/receipt" element={<ReceiptPage />} />
        <Route path="/checkout-test" element={<Checkout />} />

        {/* Wallet / Orders */}
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Misc */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dashboard" element={<AnalyticsDashboard />} />
        <Route path="/address" element={<AddressPage />} />

        {/* ✅ เส้นทางนโยบายการจัดส่ง */}
        <Route path="/policies/shipping" element={<ShippingPolicy />} />

        {/* ➕ เส้นทางแอดมิน (ใหม่) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOrdersPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
        </Route>
      </Routes>

      {/* Drawer สำหรับ Cart */}
      <CartDrawer />

      {/* Footer */}
      <Footer />

      {/* 🧠 Floating AI Recommender ปุ่มลอยแนะนำสินค้า */}
      <AIFloatingRecommender />
    </>
  );
}
