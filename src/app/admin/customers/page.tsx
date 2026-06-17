'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  customerType: 'RETAIL' | 'CONTRACTOR';
  spent: number;
  ordersCount: number;
  joined: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải khách hàng:', error);
      toast.error('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleUpdateType = async (id: number, newType: string) => {
    try {
      const res = await api.put(`/api/customers/${id}/type`, { customerType: newType });
      if (res.data.success) {
        toast.success('Đã cập nhật loại khách hàng!');
        setCustomers(customers.map(c => c.id === id ? { ...c, customerType: newType as any } : c));
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật!');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (filterType === 'ALL') return true;
    return c.customerType === filterType;
  });

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h5 className="fw-bold text-dark mb-1">Tệp Khách Hàng</h5>
          <span className="text-muted small">Quản lý thông tin và lịch sử mua hàng</span>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <select 
            className="form-select form-select-sm border-secondary shadow-sm" 
            style={{ minWidth: '150px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Tất cả khách hàng</option>
            <option value="RETAIL">Khách Lẻ</option>
            <option value="CONTRACTOR">Khách Thầu</option>
          </select>
          <button className="btn btn-outline-success btn-sm rounded-3 px-3 shadow-sm fw-bold text-nowrap">
            <i className="bi bi-file-earmark-excel me-1"></i> Xuất Excel
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 border-0 rounded-start-3">Khách Hàng</th>
              <th className="border-0">Liên Hệ</th>
              <th className="border-0">Phân Loại</th>
              <th className="border-0">Tổng Chi Tiêu</th>
              <th className="border-0">Số Đơn</th>
              <th className="border-0">Ngày Tham Gia</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Đang tải dữ liệu...</td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Không có khách hàng nào</td>
              </tr>
            ) : (
              filteredCustomers.map((cus) => (
                <tr key={cus.id}>
                  <td className="ps-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" 
                           style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', flexShrink: 0 }}>
                        {getInitial(cus.name)}
                      </div>
                      <div className="fw-bold text-dark">{cus.name}</div>
                    </div>
                  </td>
                  <td className="text-secondary fw-medium">
                    <div className="d-flex flex-column">
                      <span><i className="bi bi-telephone-fill small me-2 text-muted"></i>{cus.phone}</span>
                      {cus.email && <span className="small text-muted"><i className="bi bi-envelope-fill small me-2 text-muted"></i>{cus.email}</span>}
                    </div>
                  </td>
                  <td>
                    <select 
                      className={`form-select form-select-sm ${cus.customerType === 'CONTRACTOR' ? 'border-warning text-warning fw-bold' : 'border-primary text-primary'}`}
                      value={cus.customerType}
                      onChange={(e) => handleUpdateType(cus.id, e.target.value)}
                      style={{ width: '130px', backgroundColor: 'transparent' }}
                    >
                      <option value="RETAIL" className="text-dark">Khách Lẻ</option>
                      <option value="CONTRACTOR" className="text-dark">Khách Thầu</option>
                    </select>
                  </td>
                  <td>
                    <span className={`fw-bold ${cus.spent > 10000000 ? 'text-success' : 'text-dark'}`}>
                      {cus.spent.toLocaleString()}đ
                    </span>
                    {cus.spent > 10000000 && <i className="bi bi-star-fill text-warning ms-2" title="Khách VIP"></i>}
                  </td>
                  <td><span className="badge bg-light text-dark border px-2 py-1">{cus.ordersCount} Đơn</span></td>
                  <td className="text-muted small">{formatDate(cus.joined)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}