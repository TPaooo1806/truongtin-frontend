'use client';
import { useState } from 'react';

const mockCustomers = [
  { id: 1, name: 'Công ty XD Hòa Bình', phone: '0911222333', spent: 45000000, ordersCount: 12, joined: '01/10/2025' },
  { id: 2, name: 'Nguyễn Văn Trường', phone: '0901234567', spent: 3200000, ordersCount: 4, joined: '15/01/2026' },
  { id: 3, name: 'Lê Hoàng Anh', phone: '0933444555', spent: 120000, ordersCount: 1, joined: '18/02/2026' },
];

export default function AdminCustomersPage() {
  const [customers] = useState(mockCustomers);

  // Lấy chữ cái đầu làm Avatar
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Tệp Khách Hàng</h5>
          <span className="text-muted small">Quản lý thông tin và lịch sử mua hàng</span>
        </div>
        <button className="btn btn-outline-success rounded-pill px-4 shadow-sm fw-bold">
          <i className="bi bi-file-earmark-excel me-2"></i> Xuất Excel
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 border-0 rounded-start-3">Khách Hàng</th>
              <th className="border-0">Liên Hệ</th>
              <th className="border-0">Tổng Chi Tiêu</th>
              <th className="border-0">Số Đơn</th>
              <th className="border-0">Ngày Tham Gia</th>
              <th className="text-end pe-3 border-0 rounded-end-3">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cus) => (
              <tr key={cus.id}>
                <td className="ps-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" 
                         style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                      {getInitial(cus.name)}
                    </div>
                    <div className="fw-bold text-dark">{cus.name}</div>
                  </div>
                </td>
                <td className="text-secondary fw-medium"><i className="bi bi-telephone-fill small me-2 text-muted"></i>{cus.phone}</td>
                <td>
                  <span className={`fw-bold ${cus.spent > 10000000 ? 'text-success' : 'text-dark'}`}>
                    {cus.spent.toLocaleString()}đ
                  </span>
                  {cus.spent > 10000000 && <i className="bi bi-star-fill text-warning ms-2" title="Khách VIP"></i>}
                </td>
                <td><span className="badge bg-light text-dark border px-2 py-1">{cus.ordersCount} Đơn</span></td>
                <td className="text-muted small">{cus.joined}</td>
                <td className="text-end pe-3">
                  <button className="btn btn-sm btn-light text-primary rounded-circle shadow-sm">
                    <i className="bi bi-pencil-square"></i>
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