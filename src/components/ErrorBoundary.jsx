// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("App crashed in a child component:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: 24 }}>
          <div className="alert alert-danger">
            เกิดข้อผิดพลาดในการแสดงผล หน้านี้ถูกกั้นไว้เพื่อไม่ให้ทั้งแอปล่ม
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
