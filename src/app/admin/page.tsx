export default function AdminDashboard() {
  return (
    <div className="row g-4">
      <div className="col-md-12">
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <h3 className="fw-bold text-dark">Chào mừng Sếp Bảo quay lại! 👋</h3>
          <p className="text-muted">Hệ thống quản lý vật tư điện nước Trường Tín đã sẵn sàng.</p>
        </div>
      </div>
      
      {/* Mấy cái thẻ thống kê nhanh cho xịn */}
      <div className="col-md-4">
        <div className="card border-0 shadow-sm p-3 rounded-4 bg-primary text-white">
          <div className="small">Tổng đơn hàng hôm nay</div>
          <div className="h3 fw-bold mb-0">12</div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card border-0 shadow-sm p-3 rounded-4 bg-success text-white">
          <div className="small">Doanh thu dự kiến</div>
          <div className="h3 fw-bold mb-0">5.400.000đ</div>
        </div>
      </div>
    </div>
  );
}