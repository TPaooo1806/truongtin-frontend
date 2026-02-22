"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';

export default function OrderSuccessPage() {
  useEffect(() => {
    // Dọn dẹp giỏ hàng ngay khi khách vào trang này thành công
    if (typeof window !== "undefined") {
      localStorage.removeItem('cart');
    }
  }, []);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow-sm border-0 rounded-4 p-5 text-center" style={{ maxWidth: '500px' }}>
        <div className="mb-4">
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
        </div>
        <h2 className="fw-bold mb-3">Thanh Toán Thành Công!</h2>
        <p className="text-muted mb-4">
          Cảm ơn bạn đã tin tưởng mua sắm. Đơn hàng của bạn đang chờ xác nhận và sẽ được gửi đi trong thời gian sớm nhất.
        </p>
        <Link href="/" className="btn btn-danger btn-lg fw-bold w-100 rounded-3">
          TIẾP TỤC MUA SẮM
        </Link>
      </div>
    </div>
  );
}