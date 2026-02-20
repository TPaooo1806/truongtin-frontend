'use client';
import { useState } from 'react';

const mockVouchers = [
  { id: 1, code: 'SIEUSALE', discount: 'Giảm 10%', minOrder: 'Từ 1 Triệu', usage: 45, limit: 100, expiry: '28/02/2026', status: 'ACTIVE' },
  { id: 2, code: 'FREESHIP', discount: 'Tối đa 30K', minOrder: 'Từ 500K', usage: 120, limit: 500, expiry: '15/03/2026', status: 'ACTIVE' },
  { id: 3, code: 'KHAITRUONG', discount: 'Giảm 50K', minOrder: 'Từ 200K', usage: 50, limit: 50, expiry: '01/01/2026', status: 'EXPIRED' },
];

export default function AdminVouchersPage() {
  const [vouchers] = useState(mockVouchers);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Mã Khuyến Mãi</h5>
          <span className="text-muted small">Kích cầu mua sắm bằng các mã giảm giá</span>
        </div>
        <button className="btn btn-warning text-dark rounded-pill px-4 shadow-sm fw-bold">
          <i className="bi bi-ticket-perforated-fill me-2"></i> Tạo Mã Mới
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 border-0 rounded-start-3">Mã Code</th>
              <th className="border-0">Mức Giảm</th>
              <th className="border-0">Điều Kiện</th>
              <th className="border-0">Đã Dùng</th>
              <th className="border-0">Hạn Sử Dụng</th>
              <th className="border-0">Trạng Thái</th>
              <th className="text-end pe-3 border-0 rounded-end-3">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id}>
                <td className="ps-3">
                  <span className="badge bg-light text-danger border border-danger border-2 border-dashed px-3 py-2 fs-6 tracking-wide">
                    {v.code}
                  </span>
                </td>
                <td className="fw-bold text-success">{v.discount}</td>
                <td className="text-muted small">{v.minOrder}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div className="progress w-100" style={{ height: '8px' }}>
                      <div className={`progress-bar ${v.usage >= v.limit ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${(v.usage / v.limit) * 100}%` }}></div>
                    </div>
                    <span className="small fw-bold">{v.usage}/{v.limit}</span>
                  </div>
                </td>
                <td className="text-secondary small"><i className="bi bi-clock me-1"></i> {v.expiry}</td>
                <td>
                  {v.status === 'ACTIVE' ? 
                    <span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1">Đang chạy</span> : 
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary px-2 py-1">Hết hạn</span>
                  }
                </td>
                <td className="text-end pe-3">
                  <button className="btn btn-sm btn-light text-primary rounded-circle shadow-sm"><i className="bi bi-pencil-square"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}