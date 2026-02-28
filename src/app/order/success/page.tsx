"use client";
import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Tách phần nội dung chính ra một Component riêng để dùng Suspense
function OrderSuccessContent() {
  const searchParams = useSearchParams();
  // Lấy mã orderCode từ URL (Ví dụ: /order/success?orderCode=123456789)
  const orderCode = searchParams.get('orderCode');

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
        <p className="text-muted mb-2">
          Cảm ơn bạn đã tin tưởng mua sắm. Đơn hàng của bạn đang chờ xác nhận và sẽ được gửi đi trong thời gian sớm nhất.
        </p>

        {/* 💡 HIỂN THỊ MÃ ĐƠN HÀNG */}
        {orderCode && (
          <div className="alert alert-success my-4 border border-success rounded-3" style={{ borderStyle: 'dashed !important' }}>
            <p className="mb-1 text-dark">Mã đơn hàng của bạn là:</p>
            <h2 className="fw-bold text-danger mb-0">#{orderCode}</h2>
          </div>
        )}

        {/* 💡 CÂU LƯU Ý KHÁCH HÀNG */}
        <p className="text-danger small fw-bold mb-4 px-2">
          <i className="bi bi-exclamation-triangle-fill me-1"></i>
          Vui lòng lưu lại hoặc chụp màn hình mã đơn hàng này để tra cứu trạng thái giao hàng nhé!
        </p>
        
        {/* KHỐI NÚT ĐIỀU HƯỚNG */}
        <div className="d-flex flex-column gap-3">
          <Link href="/track-order" className="btn btn-danger btn-lg fw-bold w-100 rounded-3">
            TRA CỨU ĐƠN HÀNG
          </Link>
          <Link href="/" className="btn btn-outline-secondary btn-lg fw-bold w-100 rounded-3">
            TIẾP TỤC MUA SẮM
          </Link>
        </div>
      </div>
    </div>
  );
}

// Hàm Export mặc định bọc Suspense (Yêu cầu bắt buộc của Next.js App Router)
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}