'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/axios'; // <-- ĐÃ THÊM: Import API để gọi Backend

interface Notification {
  id: string;
  type: 'WARNING' | 'INFO';
  title: string;
  message: string;
  time: string;
  link: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // ==============================================
  // ĐÃ THÊM: STATE CHO HỆ THỐNG THÔNG BÁO (NOTIFICATIONS)
  // ==============================================
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null); // Dùng để click ra ngoài thì đóng

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

  // ĐÃ THÊM: Hàm gọi API lấy thông báo khi Layout vừa load
  useEffect(() => {
    if (isReady) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/api/reports/dashboard?range=today'); // Range gì cũng được vì thông báo lấy Real-time
          if (res.data.success) {
            setNotifications(res.data.data.notifications || []);
          }
        } catch (error) {
          console.error("Lỗi lấy thông báo:", error);
        }
      };
      fetchNotifications();

      // (Tùy chọn nâng cao) Bạn có thể dùng setInterval ở đây để 30s gọi lại 1 lần nếu muốn realtime
    }
  }, [isReady]);

  // ĐÃ THÊM: Click ra ngoài thì đóng bảng thông báo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isReady) {
    return (
      <div className="vh-100 d-flex flex-column align-items-center justify-content-center" style={{ backgroundColor: '#eef2f5' }}>
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <div className="text-muted fw-bold">Đang tải hệ thống quản trị...</div>
      </div>
    );
  }

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
          width: '280px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
          overflow: 'hidden'
        }}
      >
        {/* LOGO AREA */}
        <div className="p-4 border-bottom text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h4 className="fw-bold mb-0 text-white shadow-sm tracking-wide">TRƯỜNG TÍN</h4>
          <span className="badge bg-white text-primary mt-2 shadow-sm" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>E-COMMERCE PRO</span>
        </div>
        
        {/* MENU AREA */}
        <nav className="nav flex-column p-3 flex-grow-1 custom-scrollbar" style={{ overflowY: 'auto' }}>
          
          <div className="text-white-50 fw-bold mb-2 ms-2 mt-2" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>TỔNG QUAN</div>
          <Link href="/admin" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-grid-1x2-fill me-3 fs-5"></i> Bảng điều khiển
          </Link>
          
          <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>QUẢN LÝ BÁN HÀNG</div>
          
          <Link href="/admin/orders" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/orders') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-cart-check-fill me-3 fs-5"></i> Đơn hàng 
            {/* Nếu có đơn Pending thì hiện cục badge này lên, mình nối tạm với data notification */}
            {notifications.some(n => n.type === 'INFO') && (
              <span className="badge bg-danger ms-auto rounded-pill">Mới</span>
            )}
          </Link>

          <Link href="/admin/products" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/products') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-box-seam-fill me-3 fs-5"></i> Sản phẩm
          </Link>

          <Link href="/admin/categories" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/categories') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-tags-fill me-3 fs-5"></i> Danh mục
          </Link>

          <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>KHÁCH HÀNG & ĐỐI TÁC</div>
          
          <Link href="/admin/customers" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/customers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-people-fill me-3 fs-5"></i> Khách hàng
          </Link>

          <Link href="/admin/vouchers" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/vouchers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-ticket-perforated-fill me-3 fs-5"></i> Khuyến mãi
          </Link>

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
            
            {/* ============================================== */}
            {/* ĐÃ SỬA: NÚT CHUÔNG THÔNG BÁO VÀ DROPDOWN        */}
            {/* ============================================== */}
            <div className="position-relative" ref={notificationRef}>
              <button 
                className="btn btn-light rounded-circle shadow-sm position-relative d-flex align-items-center justify-content-center" 
                style={{ width: '40px', height: '40px' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="bi bi-bell-fill text-secondary fs-5"></i>
                
                {/* Chỉ hiện chấm đỏ khi có thông báo */}
                {notifications.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </span>
                )}
              </button>

              {/* DROPDOWN MENU TỰ LÀM CHO THÔNG BÁO */}
              {showNotifications && (
                <div 
                  className="position-absolute bg-white shadow-lg rounded-4 border mt-2 py-0" 
                  style={{ right: 0, top: '100%', width: '350px', zIndex: 1050, overflow: 'hidden' }}
                >
                  {/* Tiêu đề */}
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                    <h6 className="mb-0 fw-bold text-dark">Thông báo mới</h6>
                    {notifications.length > 0 && (
                      <span className="badge bg-danger rounded-pill">{notifications.length}</span>
                    )}
                  </div>

                  {/* Danh sách thông báo */}
                  <div className="custom-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-5 text-center text-muted">
                        <i className="bi bi-bell-slash fs-1 d-block mb-2 opacity-50"></i>
                        <small>Bạn không có thông báo nào mới.</small>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <Link 
                          href={notif.link} 
                          key={notif.id} 
                          className="text-decoration-none text-dark d-block p-3 border-bottom position-relative"
                          onClick={() => setShowNotifications(false)} // Bấm vào thì đóng menu
                          style={{ transition: 'background 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div className="d-flex gap-3 align-items-start">
                            {/* Icon tùy theo Loại thông báo (WARNING = Hết hàng, INFO = Đơn mới) */}
                            <div 
                              className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0
                                ${notif.type === 'WARNING' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-primary bg-opacity-10 text-primary'}
                              `} 
                              style={{ width: '40px', height: '40px' }}
                            >
                              <i className={`bi fs-5 ${notif.type === 'WARNING' ? 'bi-exclamation-triangle-fill' : 'bi-cart-check-fill'}`}></i>
                            </div>
                            
                            {/* Nội dung thông báo */}
                            <div>
                              <h6 className="mb-1 fw-bold fs-6" style={{ color: '#333' }}>{notif.title}</h6>
                              <p className="mb-1 text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{notif.message}</p>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                <i className="bi bi-clock me-1"></i>
                                {new Date(notif.time).toLocaleString('vi-VN')}
                              </small>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-2 text-center border-top bg-light">
                      <button 
                        className="btn btn-link text-decoration-none small text-muted p-0" 
                        onClick={() => setShowNotifications(false)}
                      >
                        Đóng thông báo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="dropdown border-start ps-3 ms-2">
              <button className="btn btn-white fw-bold text-primary d-flex align-items-center gap-2" type="button">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
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