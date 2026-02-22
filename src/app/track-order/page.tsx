"use client";
import React, { useState } from 'react';
import { AxiosError } from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/axios';

interface TrackOrderItem {
  id: number;
  quantity: number;
  price: number;
  variant?: {
    name: string;
    product?: {
      name: string;
    };
  };
}

interface TrackOrderData {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  createdAt: string;
  status: string;
  trackingCode?: string | null;
  total: number;
  items: TrackOrderItem[];
}

// Helper dịch trạng thái từ DB ra Tiếng Việt
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-warning' },
  PENDING_COD: { label: 'Chờ xác nhận (COD)', color: 'text-warning' },
  PENDING_PAYOS: { label: 'Chờ thanh toán (PayOS)', color: 'text-secondary' },
  PAID_AND_CONFIRMED: { label: 'Đã thanh toán & Chờ giao', color: 'text-primary' },
  PAID_BUT_OUT_OF_STOCK: { label: 'Đã thanh toán (Hết hàng)', color: 'text-danger' },
  CANCELLED: { label: 'Đã hủy', color: 'text-danger' },
  SHIPPING: { label: 'Đang giao hàng', color: 'text-info' }, // Bạn có thể thêm Enum SHIPPING sau này
  COMPLETED: { label: 'Đã giao thành công', color: 'text-success' },
};

export default function TrackOrderPage() {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderData, setOrderData] = useState<TrackOrderData | null>(null);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim() || !phone.trim()) {
      return toast.error("Vui lòng nhập đầy đủ Mã đơn và Số điện thoại!");
    }

    setIsProcessing(true);
    setOrderData(null);

    try {
      // SỬA TẠI ĐÂY: Dùng api.post và chỉ ghi đường dẫn tương đối
      const res = await api.post('/api/orders/track', {
        orderCode: orderCode.trim(),
        phone: phone.trim()
      });

      if (res.data.success) {
        setOrderData(res.data.data);
        toast.success("Tra cứu thành công!");
      }
    } catch (error: unknown) {
      // Xử lý lỗi không dùng 'any' để tránh lỗi ESLint
      let errorMessage = "Lỗi hệ thống.";
      
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || "Không tìm thấy đơn hàng.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <Toaster position="top-center" />
      <div className="container">
        
        {/* NẾU CHƯA CÓ DATA -> HIỆN FORM TRA CỨU */}
        {!orderData ? (
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold text-uppercase">Tra cứu đơn hàng</h3>
                  <p className="text-muted small">Nhập mã đơn hàng và số điện thoại để kiểm tra trạng thái vận chuyển</p>
                </div>

                <form onSubmit={handleTrackOrder}>
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Mã đơn hàng</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg" 
                      placeholder="VD: 1708615330123" 
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold small">Số điện thoại đặt hàng</label>
                    <input 
                      type="tel" 
                      className="form-control form-control-lg" 
                      placeholder="VD: 0901234567" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="btn btn-danger btn-lg w-100 fw-bold rounded-3 d-flex justify-content-center align-items-center"
                  >
                    {isProcessing ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-search me-2"></i>}
                    {isProcessing ? 'ĐANG TÌM...' : 'TRA CỨU NGAY'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          
          /* NẾU ĐÃ CÓ DATA -> HIỆN KẾT QUẢ ĐƠN HÀNG */
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 rounded-4 p-4">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                  <h4 className="fw-bold mb-0">Chi tiết đơn hàng #{orderData.orderCode}</h4>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setOrderData(null)}>
                    <i className="bi bi-arrow-left me-1"></i> Tra cứu đơn khác
                  </button>
                </div>

                <div className="row mb-4 g-4">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-muted small text-uppercase">Thông tin người nhận</h6>
                    <p className="mb-1"><strong>Họ tên:</strong> {orderData.customerName}</p>
                    <p className="mb-1"><strong>SĐT:</strong> {orderData.phone}</p>
                    <p className="mb-1"><strong>Địa chỉ:</strong> {orderData.address}</p>
                    <p className="mb-0"><strong>Ngày đặt:</strong> {new Date(orderData.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="col-md-6 bg-light rounded-3 p-3">
                    <h6 className="fw-bold text-muted small text-uppercase">Trạng thái vận chuyển</h6>
                    
                    {/* Hiển thị Trạng Thái */}
                    <h5 className={`fw-bold mb-3 ${STATUS_MAP[orderData.status]?.color || 'text-dark'}`}>
                      {STATUS_MAP[orderData.status]?.label || orderData.status}
                    </h5>

                    {/* Hiển thị Mã Vận Đơn (Nếu Admin đã cập nhật) */}
                    <div className="p-3 border border-warning bg-white rounded-3">
                      <p className="mb-1 fw-bold small text-muted">MÃ VẬN ĐƠN (TRACKING CODE):</p>
                      {orderData.trackingCode ? (
                        <h5 className="fw-bold text-dark mb-0">{orderData.trackingCode}</h5>
                      ) : (
                        <span className="text-secondary fst-italic">Cửa hàng đang xử lý đóng gói...</span>
                      )}
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-muted small text-uppercase mb-3">Sản phẩm đã đặt</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-borderless align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Sản phẩm</th>
                        <th className="text-center">Số lượng</th>
                        <th className="text-end">Đơn giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.items.map((item: TrackOrderItem) => (
                        <tr key={item.id} className="border-bottom">
                          <td>
                            <p className="mb-0 fw-bold">{item.variant?.product?.name || 'Sản phẩm'}</p>
                            <small className="text-muted">Phân loại: {item.variant?.name}</small>
                          </td>
                          <td className="text-center">x{item.quantity}</td>
                          <td className="text-end fw-bold text-danger">{(item.price * item.quantity).toLocaleString()}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end border-top pt-3">
                  <h4 className="fw-bold mb-0">
                    <span className="text-muted fs-5 me-2">Tổng cộng:</span>
                    <span className="text-danger">{orderData.total.toLocaleString()}đ</span>
                  </h4>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}