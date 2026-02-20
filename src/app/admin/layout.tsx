'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAdminAuth = () => {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || user.role !== 'ADMIN') {
        toast.error("Vùng cấm! Vui lòng đăng nhập quyền Admin.");
        router.replace('/');
        return;
      }
      
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    };

    checkAdminAuth();
  }, [router]);

  if (!isReady) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#eef2f5' }}>
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <div className="text-muted fw-bold">Đang tải hệ thống quản trị...</div>
      </div>
    );
  }

  // Hàm phụ trợ để check menu active
  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path !== '/admin' && pathname.includes(path)) return true;
    return false;
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#eef2f5' }}>
      
      {/* SIDEBAR */}
      <div 
        className="text-white shadow-lg m-3 rounded-4 d-flex flex-column" 
        style={{ 
          width: '280px', // Nới rộng thêm một chút để chứa chữ thoải mái hơn
          background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
          overflow: 'hidden'
        }}
      >
        {/* LOGO AREA */}
        <div className="p-4 border-bottom text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h4 className="fw-bold mb-0 text-white shadow-sm tracking-wide">TRƯỜNG TÍN</h4>
          <span className="badge bg-white text-primary mt-2 shadow-sm" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>E-COMMERCE PRO</span>
        </div>
        
        {/* MENU AREA (Có thanh cuộn ẩn nếu menu quá dài) */}
        <nav className="nav flex-column p-3 flex-grow-1 custom-scrollbar" style={{ overflowY: 'auto' }}>
          
          {/* Section 1: CHUNG */}
          <div className="text-white-50 fw-bold mb-2 ms-2 mt-2" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>TỔNG QUAN</div>
          <Link href="/admin" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-grid-1x2-fill me-3 fs-5"></i> Bảng điều khiển
          </Link>
          
          {/* Section 2: KINH DOANH */}
          <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>QUẢN LÝ BÁN HÀNG</div>
          
          <Link href="/admin/orders" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/orders') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-cart-check-fill me-3 fs-5"></i> Đơn hàng <span className="badge bg-danger ms-auto rounded-pill">Mới</span>
          </Link>

          <Link href="/admin/products" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/products') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-box-seam-fill me-3 fs-5"></i> Sản phẩm
          </Link>

          <Link href="/admin/categories" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/categories') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-tags-fill me-3 fs-5"></i> Danh mục
          </Link>

          {/* Section 3: KHÁCH HÀNG & MARKETING */}
          <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>KHÁCH HÀNG & ĐỐI TÁC</div>
          
          <Link href="/admin/customers" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/customers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-people-fill me-3 fs-5"></i> Khách hàng
          </Link>

          <Link href="/admin/vouchers" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/vouchers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-ticket-perforated-fill me-3 fs-5"></i> Khuyến mãi
          </Link>

          {/* Section 4: HỆ THỐNG */}
          <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>HỆ THỐNG</div>
          
          <Link href="/admin/reports" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/reports') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-bar-chart-fill me-3 fs-5"></i> Báo cáo doanh thu
          </Link>

          <Link href="/admin/settings" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/settings') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-gear-fill me-3 fs-5"></i> Cài đặt
          </Link>

        </nav>

        {/* LOGOUT AREA */}
        <div className="p-3 border-top mt-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
           <button 
             onClick={() => { localStorage.clear(); window.location.href = '/'; }}
             className="btn btn-light w-100 rounded-3 fw-bold text-danger shadow-sm d-flex align-items-center justify-content-center gap-2"
           >
              <i className="bi bi-box-arrow-right fs-5"></i> Đăng xuất
           </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow-1 d-flex flex-column pe-3 py-3 overflow-auto" style={{ height: '100vh' }}>
        
        {/* HEADER */}
        <header className="bg-white p-3 shadow-sm d-flex justify-content-between align-items-center px-4 rounded-4 mb-3" style={{ border: '1px solid rgba(0,0,0,0.02)' }}>
          <h5 className="mb-0 text-dark fw-bold">
            {pathname === '/admin' ? 'Bảng Điều Khiển' : 
             pathname.includes('products') ? 'Quản Lý Sản Phẩm' : 
             pathname.includes('orders') ? 'Xử Lý Đơn Hàng' :
             pathname.includes('categories') ? 'Danh Mục Vật Tư' : 'Trang Quản Trị'}
          </h5>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-light rounded-circle shadow-sm position-relative" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-bell-fill text-secondary"></i>
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
            </button>
            <div className="dropdown border-start ps-3 ms-2">
              <button className="btn btn-white dropdown-toggle fw-bold text-primary d-flex align-items-center gap-2" type="button">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  B
                </div>
                Sếp Bảo
              </button>
            </div>
          </div>
        </header>

        {/* NỘI DUNG CHÍNH */}
        <main className="flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
}