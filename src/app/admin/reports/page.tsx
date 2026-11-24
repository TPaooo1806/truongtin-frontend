'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const formatMoney = (amount: number) => amount.toLocaleString('vi-VN') + 'đ';

interface DashboardData {
  summary: {
    totalRevenue: number;
    approvedRevenue: number;
    pendingRevenue: number;
    totalOrdersCount: number;
    approvedOrdersCount: number;
    pendingOrdersCount: number;
    totalProductsCount: number;
  };
  revenueChart: {
    labels: string[];
    data: number[];
  };
  topProducts: {
    labels: string[];
    data: number[];
  };
  lowStock: Array<{
    name: string;
    category: string;
    stock: number;
  }>;
}

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState('thisMonth');
  const [loading, setLoading] = useState(true);
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // GỌI API BACKEND LẤY DATA THẬT
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/reports/dashboard?range=${timeRange}`);
        if (res.data.success) {
          setDashboardData(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi tải báo cáo:", error);
        toast.error("Không thể tải dữ liệu thống kê!");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [timeRange]);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
  };

  // Cấu hình Biểu đồ Đường (Doanh thu)
  const revenueChartData = {
    labels: dashboardData?.revenueChart?.labels || [],
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: dashboardData?.revenueChart?.data || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const val = context.parsed.y || 0;
            return ` Doanh thu: ${val.toLocaleString('vi-VN')} đ`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 11 },
          callback: function(value: any) {
            const num = Number(value);
            if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace('.0','') + ' tỷ';
            if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0','') + ' tr';
            if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
            return num;
          }
        }
      }
    }
  };

  return (
    <div className="w-100 max-w-100 overflow-x-hidden p-2 p-md-3 position-relative">
      
      {/* THANH LOADING MƯỢT MÀ KHI CHUYỂN FILTER */}
      {loading && (
        <div className="position-absolute top-0 start-0 w-100" style={{ zIndex: 999 }}>
           <div className="progress" style={{ height: '3px' }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
           </div>
        </div>
      )}

      {/* HEADER & FILTER: CÂN ĐỐI 2 ĐẦU, SỬA LỖI ĐÈ CHỮ Ở NÚT CHỌN THỜI GIAN */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="min-w-0">
          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)' }}>Hiệu Quả Kinh Doanh</h5>
          <span className="text-muted small d-none d-md-block">Dữ liệu thực tế từ hệ thống Trường Tín</span>
        </div>
        
        {/* DROPDOWN CHỌN THỜI GIAN: TÁCH BẠCH CHỮ VÀ ICON MŨI TÊN, KHÔNG ĐÈ LÊN NHAU */}
        <div className="position-relative flex-shrink-0">
          <select 
            className="form-select bg-white border border-slate-200 rounded-pill fw-semibold text-primary shadow-sm"
            style={{ 
              fontSize: '13px',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              paddingLeft: '14px',
              paddingRight: '32px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderColor: '#e2e8f0',
              cursor: 'pointer'
            }}
            value={timeRange}
            onChange={handleRangeChange}
            disabled={loading}
          >
            <option value="today">Hôm nay</option>
            <option value="thisWeek">7 ngày qua</option>
            <option value="thisMonth">30 ngày qua</option>
            <option value="lastMonth">Tháng trước</option>
            <option value="thisYear">Năm nay</option>
          </select>
          <div className="position-absolute end-0 top-50 translate-middle-y pe-2 pointer-events-none d-flex align-items-center" style={{ right: '8px', pointerEvents: 'none' }}>
            <i className="bi bi-chevron-down text-primary" style={{ fontSize: '11px' }}></i>
          </div>
        </div>
      </div>

      {/* KHU VỰC DATA */}
      <div className={`row g-2 g-md-3 transition-all ${loading ? 'opacity-50' : 'opacity-100'}`}>
        
        {dashboardData && (
          <>
            {/* 4 THẺ TỔNG QUAN (XẾP DỌC 2 DÒNG, KHÔNG CẮT CHỮ TRÊN MOBILE) */}
            <div className="col-6 col-md-3 min-w-0">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="card-body p-2.5 p-md-3">
                  {/* Dòng 1: Icon w-7 h-7 + Nhãn rút gọn */}
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <i className="bi bi-cash-stack" style={{ fontSize: '14px' }}></i>
                    </div>
                    <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>Doanh thu</span>
                  </div>
                  {/* Dòng 2: Số liệu lớn, in đậm */}
                  <div className="mt-2">
                    <h4 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }} title={formatMoney(dashboardData.summary.approvedRevenue)}>
                      {formatMoney(dashboardData.summary.approvedRevenue)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3 min-w-0">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div className="card-body p-2.5 p-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <i className="bi bi-cart-check" style={{ fontSize: '14px' }}></i>
                    </div>
                    <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>Tổng đơn</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }}>
                      {dashboardData.summary.totalOrdersCount} <span className="fs-6 text-muted fw-normal">đơn</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3 min-w-0">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="card-body p-2.5 p-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <i className="bi bi-hourglass-split" style={{ fontSize: '14px' }}></i>
                    </div>
                    <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>Đơn chờ</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }}>
                      {dashboardData.summary.pendingOrdersCount} <span className="fs-6 text-muted fw-normal">đơn</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3 min-w-0">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100" style={{ borderLeft: '4px solid #0dcaf0' }}>
                <div className="card-body p-2.5 p-md-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                      <i className="bi bi-box-seam" style={{ fontSize: '14px' }}></i>
                    </div>
                    <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>Tổng SP</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }}>
                      {dashboardData.summary.totalProductsCount} <span className="fs-6 text-muted fw-normal">SP</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* KHU VỰC BIỂU ĐỒ */}
            <div className="col-12 col-lg-8 mt-3 mt-md-4 min-w-0">
              <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white h-100 overflow-hidden w-100">
                <h6 className="fw-bold text-dark mb-3 mb-md-4">Biểu Đồ Doanh Thu Thực Tế</h6>
                <div style={{ height: '280px', position: 'relative' }} className="w-100 min-w-0 overflow-hidden">
                  {dashboardData.revenueChart.labels.length > 0 ? (
                    <Line data={revenueChartData} options={revenueChartOptions} />
                  ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                       <i className="bi bi-graph-down text-secondary opacity-50 mb-2" style={{ fontSize: '3rem' }}></i>
                       <span>Chưa có giao dịch nào trong khoảng thời gian này</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4 mt-3 mt-md-4 min-w-0">
              <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white h-100 overflow-hidden w-100">
                <h6 className="fw-bold text-dark mb-3 mb-md-4"><i className="bi bi-star-fill me-2 text-warning"></i>Top 5 Bán Chạy</h6>
                <div className="d-flex flex-column gap-2 gap-md-3" style={{ overflowY: 'auto' }}>
                  {dashboardData.topProducts.labels.length > 0 ? (
                    dashboardData.topProducts.labels.map((label, idx) => (
                      <div key={idx} className="d-flex align-items-center p-2.5 p-md-3 rounded-3 bg-light border min-w-0">
                        <div className="bg-white rounded-circle d-flex justify-content-center align-items-center fw-bold shadow-sm me-2 me-md-3 text-primary flex-shrink-0" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                          {idx + 1}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="mb-1 fw-bold text-dark text-truncate" style={{ fontSize: '13px' }}>
                            {label}
                          </h6>
                          <div className="small text-danger fw-bold"><i className="bi bi-cart-check me-1"></i>Đã bán: {dashboardData.topProducts.data[idx]}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted py-5">
                       <i className="bi bi-basket text-secondary opacity-50 mb-2" style={{ fontSize: '3rem' }}></i>
                       <span>Chưa có dữ liệu</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CẢNH BÁO TỒN KHO */}
            <div className="col-12 mt-3 mt-md-4 min-w-0">
              <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white border-top border-danger border-4 overflow-hidden w-100">
                <h6 className="fw-bold text-danger mb-3 mb-md-4" style={{ fontSize: '14px' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Sản phẩm sắp hết hàng (Tồn kho ≤ 5)
                </h6>
                
                {/* 1. BẢNG DÀNH CHO DESKTOP (≥ 768px) */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th className="text-center">Tồn kho hiện tại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.lowStock.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-4 fw-bold text-success"><i className="bi bi-check-circle-fill me-2"></i>Tuyệt vời! Kho hàng đang đầy đủ.</td></tr>
                      ) : (
                        dashboardData.lowStock.map((item: { name: string; category: string; stock: number }, idx: number) => (
                          <tr key={idx}>
                            <td className="fw-bold text-dark">{item.name}</td>
                            <td>{item.category}</td>
                            <td className="text-center">
                              <span className={`badge ${item.stock <= 5 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                Chỉ còn {item.stock}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 2. COMPACT LIST DÀNH CHO MOBILE (< 768px): KHÔNG CUỘN NGANG */}
                <div className="d-block d-md-none border rounded-3 overflow-hidden bg-white">
                  {dashboardData.lowStock.length === 0 ? (
                    <div className="text-center py-4 text-success fw-bold small">
                      <i className="bi bi-check-circle-fill me-1"></i> Kho hàng đang đầy đủ
                    </div>
                  ) : (
                    dashboardData.lowStock.map((item: { name: string; category: string; stock: number }, idx: number) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between p-2.5 border-bottom bg-white">
                        <div className="flex-grow-1 min-w-0 me-2">
                          <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '13px' }}>
                            {item.name}
                          </div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            {item.category}
                          </div>
                        </div>
                        <span className={`badge flex-shrink-0 ${item.stock <= 5 ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '11px' }}>
                          Còn {item.stock}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
