"use client";
import React, { useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface OrderItem {
  id: number;
  productName: string;
  variantId: number;
  quantity: number;
  price: number;
  variant?: {
    name?: string;
    product?: {
      name: string;
    };
  };
}

interface Order {
  id: number;
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentUrl?: string | null;
  trackingCode?: string | null;
  paymentMethod: string;
  createdAt: string;
  items?: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-warning' },
  PENDING_COD: { label: 'Chờ xác nhận', color: 'text-warning' },
  PENDING_PAYOS: { label: 'Chờ thanh toán', color: 'text-secondary' },
  PAID_AND_CONFIRMED: { label: 'Đã thanh toán & Chờ giao', color: 'text-primary' },
  PAID_BUT_OUT_OF_STOCK: { label: 'Đã thanh toán (Hết hàng)', color: 'text-danger' },
  CANCELLED: { label: 'Đã hủy', color: 'text-danger' },
  SHIPPING: { label: 'Đang giao hàng', color: 'text-info' },
  COMPLETED: { label: 'Đã giao thành công', color: 'text-success' },
};

export default function TrackOrderPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/api/orders/lookup?phone=${encodeURIComponent(phone.trim())}`);
      if (res.data.success) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      toast.error("Không tìm thấy đơn hàng hoặc có lỗi xảy ra");
      setOrders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "UNPAID":
        return <span className="badge bg-secondary text-white px-2 py-1 rounded-pill">Chưa thanh toán</span>;
      case "PAID":
        return <span className="badge bg-success text-white px-2 py-1 rounded-pill">Đã thanh toán</span>;
      case "CANCELLED":
      case "EXPIRED":
        return <span className="badge bg-danger text-white px-2 py-1 rounded-pill">Đã hủy/Hết hạn</span>;
      default:
        return <span className="badge bg-secondary text-white px-2 py-1 rounded-pill">{paymentStatus}</span>;
    }
  };

  return (
    <div className="container py-5 min-vh-100">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="text-center mb-5">
            <h1 className="fw-bold text-primary mb-3">Tra cứu danh sách đơn</h1>
            <p className="text-muted mb-2">Nhập số điện thoại của bạn để xem lịch sử tổng quát các đơn hàng đã đặt.</p>
            <Link href="/track-order" className="text-decoration-none fw-bold text-danger">
              <i className="bi bi-arrow-right-circle me-1"></i> Tra cứu chi tiết bằng Mã đơn hàng
            </Link>
          </div>

          <div className="card border-0 shadow-sm rounded-4 mb-5">
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSearch}>
                <div className="mb-4">
                  <label htmlFor="phone" className="form-label fw-semibold">Số điện thoại đặt hàng</label>
                  <input
                    type="tel"
                    className="form-control form-control-lg bg-light"
                    id="phone"
                    placeholder="VD: 0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 fw-bold rounded-pill"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span> Đang tìm kiếm...</>
                  ) : (
                    <><i className="bi bi-search me-2"></i> Tìm kiếm đơn hàng</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {searched && (
            <div className="order-results">
              <h4 className="fw-bold mb-4 border-bottom pb-2">Kết quả tra cứu ({orders.length} đơn)</h4>
              
              {orders.length === 0 ? (
                <div className="alert alert-warning text-center rounded-4 py-4 border-0 shadow-sm">
                  <i className="bi bi-emoji-frown fs-1 d-block mb-3 text-warning"></i>
                  <h5 className="fw-bold">Không tìm thấy đơn hàng!</h5>
                  <p className="mb-0">Có thể bạn nhập sai số điện thoại hoặc chưa từng đặt hàng bằng số này.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {orders.map((order) => (
                    <div key={order.id} className="card border border-light shadow-sm rounded-4 overflow-hidden">
                      <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                        <div className="fw-bold text-primary">Mã đơn: #{order.orderCode}</div>
                        <div className="text-muted small">{new Date(order.createdAt).toLocaleString("vi-VN")}</div>
                      </div>
                      <div className="card-body p-4">
                        <div className="row mb-3">
                          <div className="col-6">
                            <p className="text-muted small mb-1">Phương thức thanh toán</p>
                            <p className="fw-semibold mb-0">{order.paymentMethod === "PAYOS" ? "Thanh toán QR (PayOS)" : "Thanh toán khi nhận hàng (COD)"}</p>
                          </div>
                          <div className="col-6 text-end">
                            <p className="text-muted small mb-1">Trạng thái thanh toán</p>
                            <div className="mb-0">{getPaymentStatusBadge(order.paymentStatus)}</div>
                          </div>
                        </div>

                        {/* Vận chuyển */}
                        <div className="row mb-3 pb-3 border-bottom border-light">
                          <div className="col-6">
                            <p className="text-muted small mb-1">Trạng thái đơn hàng</p>
                            <p className={`fw-bold mb-0 ${STATUS_MAP[order.status]?.color || 'text-dark'}`}>
                              {STATUS_MAP[order.status]?.label || order.status}
                            </p>
                          </div>
                          <div className="col-6 text-end">
                            <p className="text-muted small mb-1">Mã vận đơn</p>
                            <div className="mb-0">
                              {order.trackingCode ? (
                                <span className="fw-bold bg-light px-2 py-1 rounded text-primary">{order.trackingCode}</span>
                              ) : (
                                <span className="text-secondary small fst-italic">Chưa có</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sản phẩm */}
                        <div className="bg-light rounded-3 p-3 mb-3">
                          <p className="fw-bold small text-muted mb-2">SẢN PHẨM ĐÃ ĐẶT</p>
                          {order.items?.map(item => (
                            <div key={item.id} className="d-flex justify-content-between mb-2 pb-2 border-bottom border-light">
                              <div className="small">
                                <span className="fw-semibold">{item.variant?.product?.name || item.productName}</span>
                                {item.variant?.name && <span className="text-muted ms-1">({item.variant.name})</span>}
                              </div>
                              <div className="small fw-bold text-nowrap ms-3">
                                x{item.quantity}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3 mt-3">
                          <span className="fw-semibold">Tổng tiền hàng:</span>
                          <span className="fw-bold text-danger fs-5">{order.total.toLocaleString()}đ</span>
                        </div>

                        {order.paymentStatus === "UNPAID" && order.paymentMethod === "PAYOS" && (
                          <div className="mt-4 pt-3 border-top text-center">
                            {order.paymentUrl ? (
                              <>
                                <p className="text-muted small mb-3">Đơn hàng của bạn đang chờ thanh toán. Vui lòng thanh toán để Trường Tín xử lý đơn.</p>
                                <a 
                                  href={order.paymentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-warning fw-bold text-dark rounded-pill px-4 py-2 w-100 shadow-sm animate-pulse"
                                  style={{ animation: 'pulse 2s infinite' }}
                                >
                                  <i className="bi bi-qr-code-scan me-2"></i> Thanh toán tiếp qua QR
                                </a>
                                <style jsx>{`
                                  @keyframes pulse {
                                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
                                    50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
                                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
                                  }
                                `}</style>
                              </>
                            ) : (
                              <div className="alert alert-secondary py-2 small mb-0 rounded-3">
                                <i className="bi bi-info-circle me-1"></i> Đơn hàng cũ chưa có link thanh toán. Vui lòng liên hệ Zalo hoặc Hotline để được hỗ trợ.
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-4 text-center border-top pt-3">
                          <p className="small text-muted mb-2">Vì lý do bảo mật, địa chỉ giao hàng chi tiết đã được ẩn.</p>
                          <Link href="/track-order" className="btn btn-outline-secondary btn-sm rounded-pill px-4">
                            Xem đầy đủ biên lai bằng Mã Đơn Hàng
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
