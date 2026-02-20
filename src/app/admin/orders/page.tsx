'use client';
import { useState } from 'react';
import Link from 'next/link';

// Dữ liệu mẫu (Sau này Bảo thay bằng api.get('/api/orders'))
const mockOrders = [
  { id: 'DH-0012', customer: 'Nguyễn Văn Trường', phone: '0901234567', date: '20/02/2026', total: 1250000, status: 'PENDING' },
  { id: 'DH-0011', customer: 'Trần Thị Mai', phone: '0987654321', date: '19/02/2026', total: 450000, status: 'SHIPPING' },
  { id: 'DH-0010', customer: 'Công ty XD Hòa Bình', phone: '0911222333', date: '18/02/2026', total: 5400000, status: 'COMPLETED' },
  { id: 'DH-0009', customer: 'Lê Hoàng Anh', phone: '0933444555', date: '18/02/2026', total: 120000, status: 'CANCELLED' },
];

export default function AdminOrdersPage() {
  const [orders] = useState(mockOrders);

  // Hàm tạo màu cho Badge trạng thái
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-hourglass-split me-1"></i> Chờ duyệt</span>;
      case 'SHIPPING': return <span className="badge bg-info text-white px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-truck me-1"></i> Đang giao</span>;
      case 'COMPLETED': return <span className="badge bg-success text-white px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-check-circle-fill me-1"></i> Đã giao</span>;
      case 'CANCELLED': return <span className="badge bg-danger text-white px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-x-circle-fill me-1"></i> Đã hủy</span>;
      default: return <span className="badge bg-secondary">Khác</span>;
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Quản lý Đơn Hàng</h5>
          <span className="text-muted small">Cập nhật trạng thái giao hàng cho khách</span>
        </div>
        <div className="d-flex gap-2">
          <input type="text" className="form-control rounded-pill shadow-none border-light bg-light px-4" placeholder="Tìm mã đơn (VD: DH-001)..." style={{ width: '250px' }} />
          <button className="btn btn-primary rounded-pill px-4 shadow-sm fw-bold">Lọc</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 border-0 rounded-start-3">Mã Đơn</th>
              <th className="border-0">Khách Hàng</th>
              <th className="border-0">Ngày Đặt</th>
              <th className="border-0">Tổng Tiền</th>
              <th className="border-0">Trạng Thái</th>
              <th className="text-end pe-3 border-0 rounded-end-3">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="ps-3 fw-bold text-primary">{order.id}</td>
                <td>
                  <div className="fw-bold text-dark">{order.customer}</div>
                  <div className="text-muted small">{order.phone}</div>
                </td>
                <td className="text-secondary">{order.date}</td>
                <td className="fw-bold text-danger">{order.total.toLocaleString()}đ</td>
                <td>{getStatusBadge(order.status)}</td>
                <td className="text-end pe-3">
                  <button className="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-2" title="Xem chi tiết">
                    <i className="bi bi-eye-fill"></i>
                  </button>
                  <button className="btn btn-sm btn-light text-success rounded-circle shadow-sm" title="Xác nhận đơn">
                    <i className="bi bi-check-lg"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}