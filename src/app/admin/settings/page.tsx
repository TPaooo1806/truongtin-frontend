'use client';

export default function AdminSettingsPage() {
  return (
    <div className="row g-4">
      <div className="col-12">
        <h5 className="fw-bold text-dark mb-1">Cài Đặt Hệ Thống</h5>
        <span className="text-muted small">Cấu hình thông tin cửa hàng và phí vận chuyển</span>
      </div>

      <div className="col-md-8">
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
          <h6 className="fw-bold text-dark border-bottom pb-3 mb-4"><i className="bi bi-shop me-2 text-primary"></i>Thông Tin Cửa Hàng</h6>
          
          <div className="row g-3">
            <div className="col-md-6">
              <label className="small fw-bold text-muted mb-2">Tên cửa hàng</label>
              <input type="text" className="form-control rounded-3 p-2 shadow-none border-light bg-light" defaultValue="Cửa hàng Điện Nước Trường Tín" />
            </div>
            <div className="col-md-6">
              <label className="small fw-bold text-muted mb-2">Số điện thoại Hotline</label>
              <input type="text" className="form-control rounded-3 p-2 shadow-none border-light bg-light" defaultValue="0987 654 321" />
            </div>
            <div className="col-12">
              <label className="small fw-bold text-muted mb-2">Địa chỉ cửa hàng</label>
              <input type="text" className="form-control rounded-3 p-2 shadow-none border-light bg-light" defaultValue="123 Đường ABC, Phường XYZ, TP.HCM" />
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <h6 className="fw-bold text-dark border-bottom pb-3 mb-4"><i className="bi bi-truck me-2 text-primary"></i>Cấu Hình Vận Chuyển</h6>
          
          <div className="row g-3">
            <div className="col-md-6">
              <label className="small fw-bold text-muted mb-2">Phí giao hàng mặc định (VNĐ)</label>
              <input type="number" className="form-control rounded-3 p-2 shadow-none border-light bg-light text-danger fw-bold" defaultValue="30000" />
            </div>
            <div className="col-md-6">
              <label className="small fw-bold text-muted mb-2">Miễn phí giao hàng từ (VNĐ)</label>
              <input type="number" className="form-control rounded-3 p-2 shadow-none border-light bg-light text-success fw-bold" defaultValue="1000000" />
            </div>
          </div>
        </div>
      </div>

      {/* Cột bên phải: Lưu cài đặt */}
      <div className="col-md-4">
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white sticky-top" style={{ top: '100px' }}>
          <h6 className="fw-bold text-dark mb-4">Lưu Thay Đổi</h6>
          <p className="text-muted small">Kiểm tra kỹ thông tin trước khi cập nhật lên hệ thống.</p>
          <button className="btn btn-primary rounded-pill w-100 fw-bold py-2 shadow-sm mb-2">
            <i className="bi bi-floppy-fill me-2"></i> Lưu Cấu Hình
          </button>
          <button className="btn btn-light text-danger rounded-pill w-100 fw-bold py-2 shadow-sm">
             Hủy Bỏ
          </button>
        </div>
      </div>
    </div>
  );
}