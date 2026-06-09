'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

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
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 2,
    }],
  };


  return (
    <div className="row g-4 position-relative">
      
      {/* THANH LOADING MƯỢT MÀ KHI CHUYỂN FILTER */}
      {loading && (
        <div className="position-absolute top-0 start-0 w-100" style={{ zIndex: 999 }}>
           <div className="progress" style={{ height: '3px' }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
           </div>
        </div>
      )}

      {/* HEADER & FILTER */}
      <div className="col-12 d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold text-dark mb-1">Tổng Quan Hiệu Quả Kinh Doanh</h5>
          <span className="text-muted small">Dữ liệu thực tế từ hệ thống Trường Tín</span>
        </div>
        <select 
          className="form-select w-auto rounded-pill border shadow-sm fw-bold text-primary px-4"
          value={timeRange}
          onChange={handleRangeChange}
          disabled={loading} // Tránh Admin bấm loạn xạ lúc đang load
        >
          <option value="today">Hôm nay</option>
          <option value="thisWeek">7 ngày qua</option>
          <option value="thisMonth">30 ngày qua</option>
          <option value="lastMonth">Tháng trước</option>
          <option value="thisYear">Năm nay</option>
        </select>
      </div>

      {/* KHU VỰC DATA (Sẽ hơi mờ nếu đang loading) */}
      <div className={`row g-4 transition-all ${loading ? 'opacity-50' : 'opacity-100'}`}>
        
        {dashboardData && (
          <>
            {/* 4 THẺ TỔNG QUAN (Thay thế 2 thẻ cũ theo yêu cầu) */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden" style={{ borderLeft: '5px solid #10b981' }}>
                <div className="card-body p-4 position-relative">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle me-3">
                      <i className="bi bi-cash-stack fs-4"></i>
                    </div>
                    <h6 className="text-muted fw-bold mb-0 text-uppercase">Doanh Thu (Đã Duyệt)</h6>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{formatMoney(dashboardData.summary.approvedRevenue)}</h3>
                  <div className="position-absolute" style={{ bottom: '-15px', right: '-15px', opacity: 0.05 }}>
                    <i className="bi bi-cash-stack" style={{ fontSize: '100px' }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden" style={{ borderLeft: '5px solid #3b82f6' }}>
                <div className="card-body p-4 position-relative">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle me-3">
                      <i className="bi bi-cart-check fs-4"></i>
                    </div>
                    <h6 className="text-muted fw-bold mb-0 text-uppercase">Tổng Đơn Hàng</h6>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{dashboardData.summary.totalOrdersCount} <span className="fs-6 text-muted fw-normal">đơn</span></h3>
                  <div className="position-absolute" style={{ bottom: '-15px', right: '-15px', opacity: 0.05 }}>
                    <i className="bi bi-cart-check" style={{ fontSize: '100px' }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden" style={{ borderLeft: '5px solid #f59e0b' }}>
                <div className="card-body p-4 position-relative">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle me-3">
                      <i className="bi bi-hourglass-split fs-4"></i>
                    </div>
                    <h6 className="text-muted fw-bold mb-0 text-uppercase">Đơn Chờ Xử Lý</h6>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{dashboardData.summary.pendingOrdersCount} <span className="fs-6 text-muted fw-normal">đơn</span></h3>
                  <div className="position-absolute" style={{ bottom: '-15px', right: '-15px', opacity: 0.05 }}>
                    <i className="bi bi-hourglass-split" style={{ fontSize: '100px' }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden" style={{ borderLeft: '5px solid #0dcaf0' }}>
                <div className="card-body p-4 position-relative">
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle me-3">
                      <i className="bi bi-box-seam fs-4"></i>
                    </div>
                    <h6 className="text-muted fw-bold mb-0 text-uppercase">Tổng Sản Phẩm</h6>
                  </div>
                  <h3 className="fw-bold text-dark mb-0">{dashboardData.summary.totalProductsCount} <span className="fs-6 text-muted fw-normal">SP</span></h3>
                  <div className="position-absolute" style={{ bottom: '-15px', right: '-15px', opacity: 0.05 }}>
                    <i className="bi bi-box-seam" style={{ fontSize: '100px' }}></i>
                  </div>
                </div>
              </div>
            </div>

            {/* KHU VỰC BIỂU ĐỒ */}
            <div className="col-lg-8 mt-4">
              <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
                <h6 className="fw-bold text-dark mb-4">Biểu Đồ Doanh Thu Thực Tế</h6>
                <div style={{ height: '300px' }}>
                  {dashboardData.revenueChart.labels.length > 0 ? (
                    <Line data={revenueChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  ) : (
                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                       <i className="bi bi-graph-down text-secondary opacity-50 mb-2" style={{ fontSize: '3rem' }}></i>
                       <span>Chưa có giao dịch nào trong khoảng thời gian này</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4 mt-4">
              <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
                <h6 className="fw-bold text-dark mb-4"><i className="bi bi-star-fill me-2 text-warning"></i>Top 5 Bán Chạy</h6>
                <div className="d-flex flex-column gap-3" style={{ overflowY: 'auto' }}>
                  {dashboardData.topProducts.labels.length > 0 ? (
                    dashboardData.topProducts.labels.map((label, idx) => (
                      <div key={idx} className="d-flex align-items-center p-3 rounded-3 bg-light border">
                        <div className="bg-white rounded-circle d-flex justify-content-center align-items-center fw-bold shadow-sm me-3 text-primary" style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                          {idx + 1}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-bold text-dark" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
            <div className="col-12 mt-4">
              <div className="card border-0 shadow-sm p-4 rounded-4 bg-white border-top border-danger border-4">
                {/* ĐÃ SỬA: Thay số 10 thành 5 cho chuẩn logic */}
                <h6 className="fw-bold text-danger mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>Sản phẩm sắp hết hàng (Tồn kho ≤ 5)</h6>
                <div className="table-responsive">
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
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}