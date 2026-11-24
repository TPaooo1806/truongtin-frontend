'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatMoney = (amount: number) => amount.toLocaleString('vi-VN') + ' đ';

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
  lowStock?: Array<{
    name: string;
    category: string;
    stock: number;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('thisMonth'); // today, thisWeek, thisMonth, lastMonth, thisYear

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/reports/dashboard?range=${range}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error('Lỗi tải dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [range]);

  // Cấu hình Biểu đồ Cột Doanh thu (Chart.js tối ưu cho Mobile & Desktop)
  const chartData = {
    labels: data?.revenueChart?.labels || [],
    datasets: [
      {
        label: 'Doanh thu',
        data: data?.revenueChart?.data || [],
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const val = context.parsed.y || 0;
            return ` Doanh thu: ${val.toLocaleString('vi-VN')} đ`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 11 },
          callback: function (value: any) {
            const num = Number(value);
            if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace('.0', '') + ' tỷ';
            if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + ' tr';
            if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
            return num;
          },
        },
      },
    },
  };

  const topProductsList =
    data?.topProducts?.labels?.map((label, idx) => ({
      name: label,
      sold: data.topProducts.data[idx] || 0,
    })) || [];

  return (
    <div className="w-100 max-w-100 overflow-x-hidden p-2 p-md-3 position-relative">
      
      {/* THANH LOADING MƯỢT MÀ KHI ĐỔI BỘ LỌC */}
      {loading && (
        <div className="position-absolute top-0 start-0 w-100" style={{ zIndex: 999 }}>
          <div className="progress" style={{ height: '3px' }}>
            <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
          </div>
        </div>
      )}

      {/* 1. HEADER & BỘ LỌC THỜI GIAN: TỐI GIẢN, NẮM BẮT NHANH */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="min-w-0 d-flex align-items-center gap-2">
          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
            Bảng Điều Khiển
          </h5>
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1 small fw-semibold">
            Trực tiếp
          </span>
        </div>

        {/* DROPDOWN CHỌN THỜI GIAN: GỌN ĐẸP, TÁCH BIỆT MŨI TÊN, KHÔNG ĐÈ CHỮ */}
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
              cursor: 'pointer',
            }}
            value={range}
            onChange={(e) => setRange(e.target.value)}
            disabled={loading}
          >
            <option value="today">Hôm nay</option>
            <option value="thisWeek">7 ngày qua</option>
            <option value="thisMonth">30 ngày qua</option>
            <option value="lastMonth">Tháng trước</option>
            <option value="thisYear">Năm nay</option>
          </select>
          <div
            className="position-absolute end-0 top-50 translate-middle-y pe-2 pointer-events-none d-flex align-items-center"
            style={{ right: '8px', pointerEvents: 'none' }}
          >
            <i className="bi bi-chevron-down text-primary" style={{ fontSize: '11px' }}></i>
          </div>
        </div>
      </div>

      {/* 2. CỤM 4 THẺ KPI TỐI THƯỢNG (NHÌN 1-2S LÀ NẮM HẾT TÌNH HÌNH KINH DOANH) */}
      <div className={`row g-2 g-md-3 mb-3 transition-all ${loading ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* THẺ 1: DOANH THU ĐÃ DUYỆT */}
        <div className="col-6 col-md-3 min-w-0">
          <Link href="/admin/reports" className="text-decoration-none">
            <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100 card-hover-effect" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="card-body p-2.5 p-md-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <i className="bi bi-cash-stack" style={{ fontSize: '14px' }}></i>
                  </div>
                  <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
                    Doanh thu
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }}>
                    {data ? formatMoney(data.summary.approvedRevenue) : '0 đ'}
                  </h4>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* THẺ 2: ĐƠN CHỜ DUYỆT (CỰC KỲ QUAN TRỌNG: CẦN XỬ LÝ NGAY) */}
        <div className="col-6 col-md-3 min-w-0">
          <Link href="/admin/orders" className="text-decoration-none">
            <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100 card-hover-effect" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="card-body p-2.5 p-md-3">
                <div className="d-flex align-items-center justify-content-between gap-1">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <div
                      className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: '28px', height: '28px' }}
                    >
                      <i className="bi bi-hourglass-split" style={{ fontSize: '14px' }}></i>
                    </div>
                    <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
                      Đơn chờ
                    </span>
                  </div>
                  {data && data.summary.pendingOrdersCount > 0 && (
                    <span className="badge bg-danger rounded-pill px-1.5 py-0.5 text-nowrap" style={{ fontSize: '10px' }}>
                      Xử lý ngay
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <h4 className={`fw-bold mb-0 text-truncate ${data && data.summary.pendingOrdersCount > 0 ? 'text-danger' : 'text-dark'}`} style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }}>
                    {data ? data.summary.pendingOrdersCount : 0} <span className="fs-6 text-muted fw-normal">đơn</span>
                  </h4>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* THẺ 3: TỔNG ĐƠN HÀNG */}
        <div className="col-6 col-md-3 min-w-0">
          <Link href="/admin/orders" className="text-decoration-none">
            <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100 card-hover-effect" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="card-body p-2.5 p-md-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <i className="bi bi-cart-check" style={{ fontSize: '14px' }}></i>
                  </div>
                  <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
                    Tổng đơn
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }}>
                    {data ? data.summary.totalOrdersCount : 0} <span className="fs-6 text-muted fw-normal">đơn</span>
                  </h4>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* THẺ 4: TỔNG SẢN PHẨM */}
        <div className="col-6 col-md-3 min-w-0">
          <Link href="/admin/products" className="text-decoration-none">
            <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden w-100 card-hover-effect" style={{ borderLeft: '4px solid #0dcaf0' }}>
              <div className="card-body p-2.5 p-md-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <i className="bi bi-box-seam" style={{ fontSize: '14px' }}></i>
                  </div>
                  <span className="text-muted fw-bold text-uppercase text-truncate" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
                    Tổng SP
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)' }}>
                    {data ? data.summary.totalProductsCount : 0} <span className="fs-6 text-muted fw-normal">SP</span>
                  </h4>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. THANH TÁC VỤ NHANH (QUICK ACTIONS): THAO TÁC 1 CHẠM */}
      <div className="d-flex gap-2 overflow-x-auto pb-2 mb-3 text-nowrap no-scrollbar">
        <Link href="/admin/products" className="btn btn-sm btn-white border shadow-sm rounded-pill fw-semibold text-dark px-3 py-1.5 d-flex align-items-center gap-1.5 flex-shrink-0">
          <i className="bi bi-plus-circle text-primary"></i>
          <span>Thêm Sản Phẩm</span>
        </Link>
        <Link href="/admin/orders" className="btn btn-sm btn-white border shadow-sm rounded-pill fw-semibold text-dark px-3 py-1.5 d-flex align-items-center gap-1.5 flex-shrink-0">
          <i className="bi bi-receipt text-warning"></i>
          <span>Xem Đơn Hàng</span>
        </Link>
        <Link href="/admin/categories" className="btn btn-sm btn-white border shadow-sm rounded-pill fw-semibold text-dark px-3 py-1.5 d-flex align-items-center gap-1.5 flex-shrink-0">
          <i className="bi bi-tags text-success"></i>
          <span>Danh Mục</span>
        </Link>
        <Link href="/admin/reports" className="btn btn-sm btn-white border shadow-sm rounded-pill fw-semibold text-dark px-3 py-1.5 d-flex align-items-center gap-1.5 flex-shrink-0">
          <i className="bi bi-graph-up text-info"></i>
          <span>Báo Cáo Chi Tiết</span>
        </Link>
      </div>

      {/* 4. KHU VỰC BIỂU ĐỒ & TOP BÁN CHẠY */}
      <div className={`row g-2 g-md-3 mb-3 transition-all ${loading ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* BIỂU ĐỒ DOANH THU */}
        <div className="col-12 col-lg-8 min-w-0">
          <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white h-100 overflow-hidden w-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-bar-chart-fill text-primary"></i>
                Biến Động Doanh Thu
              </h6>
              <span className="text-muted small">VNĐ</span>
            </div>
            <div style={{ height: '280px', position: 'relative' }} className="w-100 min-w-0 overflow-hidden">
              {data && data.revenueChart.labels.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                  <i className="bi bi-bar-chart text-secondary opacity-50 mb-2" style={{ fontSize: '2.5rem' }}></i>
                  <span className="small">Chưa có phát sinh doanh thu trong kỳ</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP 5 SẢN PHẨM BÁN CHẠY (RÕ RÀNG, DỄ NHÌN) */}
        <div className="col-12 col-lg-4 min-w-0">
          <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white h-100 overflow-hidden w-100">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-star-fill text-warning"></i>
              Top 5 Bán Chạy
            </h6>

            {topProductsList.length > 0 ? (
              <div className="d-flex flex-column gap-2" style={{ overflowY: 'auto' }}>
                {topProductsList.map((prod, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center p-2 rounded-3 bg-light border min-w-0"
                  >
                    <div
                      className={`rounded-circle d-flex justify-content-center align-items-center fw-bold shadow-sm me-2.5 flex-shrink-0 ${
                        idx === 0
                          ? 'bg-warning text-white'
                          : idx === 1
                          ? 'bg-secondary bg-opacity-25 text-dark'
                          : idx === 2
                          ? 'bg-danger bg-opacity-25 text-danger'
                          : 'bg-white text-muted'
                      }`}
                      style={{ width: '30px', height: '30px', fontSize: '12px' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div
                        className="fw-semibold text-dark text-truncate"
                        style={{ fontSize: '13px' }}
                        title={prod.name}
                      >
                        {prod.name}
                      </div>
                      <div className="small text-danger fw-bold" style={{ fontSize: '11px' }}>
                        <i className="bi bi-bag-check me-1"></i>Đã bán: {prod.sold}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted py-4">
                <i className="bi bi-basket text-secondary opacity-50 mb-2" style={{ fontSize: '2.5rem' }}></i>
                <span className="small">Chưa có giao dịch bán hàng</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. CẢNH BÁO TỒN KHO CẦN LƯU Ý (NẾU CÓ DỮ LIỆU) */}
      {data?.lowStock && data.lowStock.length > 0 && (
        <div className="mt-2 min-w-0">
          <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white border-top border-danger border-4 overflow-hidden w-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-danger mb-0 d-flex align-items-center gap-2" style={{ fontSize: '13.5px' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                Sản phẩm sắp hết hàng (Tồn kho ≤ 5)
              </h6>
              <Link href="/admin/products" className="text-decoration-none small fw-semibold text-primary">
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="border rounded-3 overflow-hidden bg-white">
              {data.lowStock.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center justify-content-between p-2.5 border-bottom bg-white"
                >
                  <div className="flex-grow-1 min-w-0 me-2">
                    <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '13px' }}>
                      {item.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      {item.category}
                    </div>
                  </div>
                  <span
                    className={`badge flex-shrink-0 ${
                      item.stock <= 5 ? 'bg-danger' : 'bg-warning text-dark'
                    }`}
                    style={{ fontSize: '11px' }}
                  >
                    Còn {item.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
