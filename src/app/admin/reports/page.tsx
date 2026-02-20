'use client';

export default function AdminReportsPage() {
  return (
    <div className="row g-4">
      {/* Cột thống kê nhanh */}
      <div className="col-12 d-flex justify-content-between align-items-center mb-2">
        <div>
          <h5 className="fw-bold text-dark mb-1">Báo Cáo Doanh Thu</h5>
          <span className="text-muted small">Cập nhật lúc: 19:30 - Hôm nay</span>
        </div>
        <select className="form-select w-auto rounded-pill border-0 shadow-sm fw-bold text-primary px-4">
          <option>Tháng này</option>
          <option>Tháng trước</option>
          <option>Năm nay</option>
        </select>
      </div>

      <div className="col-md-4">
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white" style={{ borderLeft: '5px solid #3b82f6 !important' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="text-muted fw-bold mb-0">Doanh thu thuần</h6>
            <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-2"><i className="bi bi-wallet2 fs-5"></i></div>
          </div>
          <h3 className="fw-bold text-dark mb-2">124.500.000đ</h3>
          <span className="text-success small fw-bold"><i className="bi bi-arrow-up-right"></i> +15% so với tháng trước</span>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white" style={{ borderLeft: '5px solid #10b981 !important' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="text-muted fw-bold mb-0">Đơn hàng hoàn tất</h6>
            <div className="bg-success bg-opacity-10 text-success rounded-3 p-2"><i className="bi bi-box-seam fs-5"></i></div>
          </div>
          <h3 className="fw-bold text-dark mb-2">342 Đơn</h3>
          <span className="text-success small fw-bold"><i className="bi bi-arrow-up-right"></i> +5% so với tháng trước</span>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white" style={{ borderLeft: '5px solid #f59e0b !important' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="text-muted fw-bold mb-0">Khách hàng mới</h6>
            <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-2"><i className="bi bi-people fs-5"></i></div>
          </div>
          <h3 className="fw-bold text-dark mb-2">89 Khách</h3>
          <span className="text-danger small fw-bold"><i className="bi bi-arrow-down-right"></i> -2% so với tháng trước</span>
        </div>
      </div>

      <div className="col-12 mt-4">
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
           <h6 className="fw-bold text-dark mb-4">Top Hàng Hóa Bán Chạy (Sắp ra mắt biểu đồ)</h6>
           <div className="bg-light rounded-4 d-flex align-items-center justify-content-center" style={{ height: '300px', border: '2px dashed #ccc' }}>
              <div className="text-muted fw-bold"><i className="bi bi-bar-chart-line fs-1 d-block text-center mb-2"></i>Khu vực tích hợp Biểu đồ Chart.js</div>
           </div>
        </div>
      </div>
    </div>
  );
}