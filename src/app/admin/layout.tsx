'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

// ==============================================
// 1. CẬP NHẬT INTERFACE: Chứa thêm detail để hiện Modal
// ==============================================
interface Notification {
  id: string;
  type: 'ORDER' | 'CONTACT';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  details: {
    name?: string;
    phone?: string;
    content?: string;   // Nội dung lời nhắn
    orderCode?: string; // Mã đơn hàng
    total?: number;     // Tổng tiền
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // STATE THÔNG BÁO
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // STATE MODAL (POP-UP)
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  // STATE MOBILE MENU
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // STATE AUTH & LOGIN ROUTE CHECK
  const isLoginPage = pathname === '/admin/login' || pathname === '/login';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // STATE REFRESH THÔNG BÁO
  const [isRefreshingNotif, setIsRefreshingNotif] = useState(false);

  // ==============================================
  // 2. LOGIC THÔNG BÁO: Tải 1 lần duy nhất sau khi đã xác thực ADMIN thành công
  // ==============================================
  const fetchNotifications = useCallback(async (showToast = false) => {
    setIsRefreshingNotif(true);
    try {
      const res = await api.get('/api/admin/notifications'); 
      if (res.data.success) {
        const sorted = [...res.data.data].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        setNotifications(sorted);
        if (showToast) {
          toast.success("Đã làm mới thông báo!");
        }
      }
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
      if (showToast) {
        toast.error("Không thể lấy thông báo!");
      }
    } finally {
      setIsRefreshingNotif(false);
    }
  }, []);

  // KHÓA BẢO VỆ BẮT BUỘC ĐĂNG NHẬP (AUTH GUARD)
  useEffect(() => {
    if (isLoginPage) {
      setAuthChecking(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        // Âm thầm chuyển hướng về trang đăng nhập, không bật toast lỗi làm phiền
        const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');
        router.replace(isSubdomain ? '/login' : '/admin/login');
        return;
      }
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');
        router.replace(isSubdomain ? '/login' : '/admin/login');
        return;
      }
      setIsAuthenticated(true);
      fetchNotifications();
    } catch (e) {
      console.error(e);
      const isSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');
      router.replace(isSubdomain ? '/login' : '/admin/login');
    } finally {
      setAuthChecking(false);
    }
  }, [router, isLoginPage, fetchNotifications]);

  // Hàm xử lý nút "ĐÃ XỬ LÝ XONG" cho Liên hệ
  const handleResolveContact = async (rawId: string) => {
    const contactId = rawId.replace('contact_', '');
    try {
      await api.patch(`/api/contact/resolve/${contactId}`);
      toast.success("Đã xử lý xong liên hệ!");
      setSelectedNotif(null);
      setNotifications(prev => prev.filter(n => n.id !== rawId));
    } catch {
      toast.error("Lỗi khi xử lý liên hệ");
    }
  };

  // Hàm mark notification as read
  const handleMarkAsRead = async (notifId: string) => {
    try {
      await api.patch(`/api/admin/notifications/${notifId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  // Click ra ngoài đóng Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hàm xử lý khi click vào 1 thông báo
  const handleOpenNotification = (notif: Notification) => {

  if (!notif.isRead) {
    handleMarkAsRead(notif.id);
    notif = { ...notif, isRead: true };
  }

  setSelectedNotif(notif);
  setShowNotifications(false);
};



  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path !== '/admin' && pathname.includes(path)) return true;
    return false;
  };

  // 1. NẾU LÀ TRANG LOGIN: Chỉ render trang Đăng nhập, không render Sidebar/Header và không gọi API
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 2. NẾU ĐANG KIỂM TRA PHIÊN HOẶC CHƯA XÁC THỰC: Hiện loading toàn màn hình, tuyệt đối không để lộ giao diện
  if (authChecking || !isAuthenticated) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang kiểm tra quyền quản trị...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#eef2f5' }}>
      
      {/* SIDEBAR */}
      <div className="text-white shadow-lg m-3 rounded-4 d-none d-md-flex flex-column flex-shrink-0" style={{ width: '280px', minWidth: '280px', background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)', overflow: 'hidden' }}>
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
            {notifications.some(n => n.type === 'ORDER') && (
              <span className="badge bg-danger ms-auto rounded-pill shadow-sm">Có đơn</span>
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
          <Link href="/admin/reviews" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/reviews') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-chat-heart-fill me-3 fs-5"></i> Đánh giá
          </Link>
          <Link href="/admin/vouchers" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/vouchers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-ticket-perforated-fill me-3 fs-5"></i> Khuyến mãi
          </Link>

          <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>HỆ THỐNG</div>
          <Link href="/admin/reports" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/reports') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-bar-chart-fill me-3 fs-5"></i> Báo cáo
          </Link>
          <Link href="/admin/banners" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/banners') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-images me-3 fs-5"></i> Quản lý Banner
          </Link>
          <Link href="/admin/settings" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/settings') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-gear-fill me-3 fs-5"></i> Cài đặt
          </Link>
        </nav>

        {/* LOGOUT AREA */}
        <div className="p-3 border-top mt-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
           <button onClick={() => { 
             localStorage.removeItem('user'); 
             localStorage.removeItem('token'); 
             const isProd = window.location.hostname.includes('diennuoctruongtin.com');
             const domainAttr = isProd ? '; domain=.diennuoctruongtin.com' : '';
             document.cookie = `admin_token=; path=/${domainAttr}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
             document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
             router.replace('/login'); 
           }} className="btn btn-light w-100 rounded-3 fw-bold text-danger shadow-sm d-flex align-items-center justify-content-center gap-2">
             <i className="bi bi-box-arrow-right fs-5"></i> Đăng xuất
           </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow-1 d-flex flex-column px-2 px-md-0 pe-md-3 pt-2 pt-md-3 pb-2 pb-md-3 overflow-auto" style={{ height: '100vh', minWidth: 0 }}>
        
        {/* HEADER CỐ ĐỊNH DUY NHẤT (GỘP 1 HÀNG CHO CẢ MOBILE & DESKTOP) */}
        <header 
          className="bg-white shadow-sm d-flex justify-content-between align-items-center px-3 px-md-4 rounded-4 mb-2 mb-md-3 sticky-top" 
          style={{ 
            top: 0, 
            zIndex: 1030, 
            minHeight: '56px',
            border: '1px solid rgba(0,0,0,0.04)' 
          }}
        >
          {/* BÊN TRÁI: Nút Hamburger Mobile + Tiêu đề trang */}
          <div className="d-flex align-items-center gap-2 min-w-0 overflow-hidden">
            <button 
              className="btn btn-light d-md-none p-1 d-flex align-items-center justify-content-center rounded-3 border-0 flex-shrink-0" 
              type="button"
              style={{ width: '38px', height: '38px' }}
              onClick={() => setShowMobileMenu(true)}
              aria-label="Mở menu quản trị"
            >
              <i className="bi bi-list fs-4 text-dark"></i>
            </button>
            <h5 className="mb-0 text-dark fw-bold text-truncate" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)' }}>
              {pathname === '/admin' ? 'Bảng Điều Khiển' : 
               pathname.includes('products') ? 'Quản Lý Sản Phẩm' : 
               pathname.includes('orders') ? 'Xử Lý Đơn Hàng' :
               pathname.includes('reviews') ? 'Quản Lý Đánh Giá' :
               pathname.includes('categories') ? 'Danh Mục Vật Tư' :
               pathname.includes('banners') ? 'Quản Lý Banner' : 'Trang Quản Trị'}
            </h5>
          </div>

          {/* BÊN PHẢI: Chuông thông báo + Avatar Sếp Bảo */}
          <div className="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
            
            {/* NÚT CHUÔNG THÔNG BÁO VÀ DROPDOWN */}
            <div className="position-relative" ref={notificationRef}>
              <button 
                className="btn btn-light rounded-circle shadow-sm position-relative d-flex align-items-center justify-content-center" 
                style={{ width: '38px', height: '38px' }}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Thông báo"
              >
                <i className="bi bi-bell-fill text-secondary fs-5"></i>
                {notifications.some(n => !n.isRead) && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm border border-light" style={{ fontSize: '0.65rem' }}>
                    {(() => {
                      const unreadCount = notifications.filter(n => !n.isRead).length;
                      return unreadCount > 9 ? '9+' : unreadCount;
                    })()}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="position-absolute bg-white shadow-lg rounded-4 border mt-2 py-0" style={{ right: 0, top: '100%', width: 'min(360px, calc(100vw - 32px))', zIndex: 1050, overflow: 'hidden' }}>
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                    <h6 className="mb-0 fw-bold text-dark">Thông báo mới</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-1 px-2 rounded-pill d-flex align-items-center gap-1"
                      style={{ fontSize: '0.75rem' }}
                      disabled={isRefreshingNotif}
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchNotifications(true);
                      }}
                      title="Làm mới thông báo"
                    >
                      <i className={`bi bi-arrow-clockwise ${isRefreshingNotif ? 'spin-icon' : ''}`}></i>
                      {isRefreshingNotif ? 'Đang tải...' : 'Làm mới'}
                    </button>
                  </div>

                  <div className="custom-scrollbar" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-5 text-center text-muted">
                        <i className="bi bi-bell-slash fs-1 d-block mb-2 opacity-50"></i>
                        <small>Bạn không có thông báo nào mới.</small>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className="d-flex gap-3 align-items-start p-3 border-bottom position-relative cursor-pointer"
                          style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => handleOpenNotification(notif)}
                        >
                          <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0
                              ${notif.type === 'ORDER' ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary'}
                            `} 
                            style={{ width: '40px', height: '40px' }}
                          >
                            <i className={`bi fs-5 ${notif.type === 'ORDER' ? 'bi-cart-check-fill' : 'bi-envelope-paper-fill'}`}></i>
                          </div>
                          
                          <div>
                            <h6 className="mb-1 fw-bold fs-6" style={{ color: '#333' }}>{notif.title}</h6>
                            <p className="mb-1 text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{notif.message}</p>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-clock me-1"></i>
                              {new Date(notif.time).toLocaleString('vi-VN')}
                            </small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AVATAR: Ẩn chữ Sếp Bảo trên Mobile */}
            <div className="dropdown border-start ps-2 ps-md-3 ms-1 ms-md-2">
              <button className="btn btn-white fw-bold text-primary d-flex align-items-center gap-2 p-0 p-md-1" type="button">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '32px', height: '32px' }}>B</div>
                <span className="d-none d-md-inline text-nowrap">Sếp Bảo</span>
              </button>
            </div>
          </div>
        </header>

        {/* NỘI DUNG CHÍNH */}
        <main className="flex-grow-1 position-relative" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* ==============HIỂN THỊ CHI TIẾT THÔNG BÁO================ */}
      {selectedNotif && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              
              {/* Header Modal đổi màu theo loại */}
              <div className={`modal-header border-0 ${selectedNotif.type === 'ORDER' ? 'bg-success' : 'bg-primary'} text-white`}>
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className={`bi ${selectedNotif.type === 'ORDER' ? 'bi-cart-check-fill' : 'bi-envelope-paper-fill'}`}></i>
                  {selectedNotif.type === 'ORDER' ? 'Thông tin đơn hàng mới' : 'Lời nhắn liên hệ mới'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedNotif(null)}></button>
              </div>
              
              <div className="modal-body p-4 bg-light">
                <div className="bg-white p-3 rounded-3 shadow-sm border">
                  <div className="mb-3 border-bottom pb-2">
                    <small className="text-muted fw-bold text-uppercase d-block mb-1">Khách hàng</small>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle fs-4 text-secondary"></i>
                      <span className="fw-bold fs-5">{selectedNotif.details.name || 'Khách vãng lai'}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3 border-bottom pb-2">
                    <small className="text-muted fw-bold text-uppercase d-block mb-1">Số điện thoại</small>
                    {selectedNotif.details.phone ? (
                      <a href={`tel:${selectedNotif.details.phone}`} className="fw-bold text-danger text-decoration-none fs-5 d-flex align-items-center gap-2">
                        <i className="bi bi-telephone-fill"></i> {selectedNotif.details.phone}
                      </a>
                    ) : (
                      <span className="text-muted small">Không có thông tin</span>
                    )}
                  </div>

                  {selectedNotif.type === 'CONTACT' && (
                    <div className="mb-2">
                      <small className="text-muted fw-bold text-uppercase d-block mb-1">Nội dung tin nhắn</small>
                      <div className="p-3 bg-light rounded-3 border" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedNotif.details.content}
                      </div>
                    </div>
                  )}

                  {selectedNotif.type === 'ORDER' && (
                    <div className="mb-2">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted fw-bold text-uppercase">Mã đơn:</span>
                        <span className="fw-bold text-primary">#{selectedNotif.details.orderCode}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted fw-bold text-uppercase">Tổng tiền:</span>
                        <span className="fw-bold text-danger">{selectedNotif.details.total?.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer border-0 bg-light d-flex justify-content-between">
                <button type="button" className="btn btn-secondary fw-bold rounded-3 px-4" onClick={() => setSelectedNotif(null)}>
                  ĐÓNG LẠI
                </button>
                
                {/* 💡 NÚT XỬ LÝ DÀNH RIÊNG CHO LIÊN HỆ */}
                {selectedNotif.type === 'CONTACT' && (
                  <button 
                    type="button" 
                    className="btn btn-primary fw-bold rounded-3 px-4 d-flex align-items-center gap-2 shadow-sm" 
                    onClick={() => handleResolveContact(selectedNotif.id)}
                  >
                    <i className="bi bi-check2-circle fs-5"></i> ĐÃ XỬ LÝ XONG
                  </button>
                )}

                {/* 💡 NÚT ĐIỀU HƯỚNG DÀNH RIÊNG CHO ĐƠN HÀNG */}
                {selectedNotif.type === 'ORDER' && (
                  <button 
                    type="button" 
                    className="btn btn-success fw-bold rounded-3 px-4 d-flex align-items-center gap-2 shadow-sm" 
                    onClick={() => {
                      setSelectedNotif(null);
                      router.push('/admin/orders'); // Dẫn thẳng ra trang quản lý đơn
                    }}
                  >
                    <i className="bi bi-box-seam fs-5"></i> ĐI TỚI XỬ LÝ ĐƠN
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop cho Mobile Menu */}
      {showMobileMenu && (
        <div 
          className="offcanvas-backdrop fade show" 
          onClick={() => setShowMobileMenu(false)}
          style={{ zIndex: 1040 }}
        ></div>
      )}

      {/* Giao diện Menu trượt cho Mobile */}
      <div 
        className={`offcanvas offcanvas-start bg-dark text-white ${showMobileMenu ? 'show' : ''}`} 
        tabIndex={-1} 
        id="mobileSidebar" 
        style={{ visibility: showMobileMenu ? 'visible' : 'hidden', zIndex: 1045 }}
      >
        <div className="offcanvas-header border-bottom border-secondary">
          <h5 className="offcanvas-title fw-bold">TRƯỜNG TÍN</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowMobileMenu(false)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body p-0 d-flex flex-column">
          <nav className="nav flex-column p-3 flex-grow-1 custom-scrollbar" style={{ overflowY: 'auto' }}>
            <div className="text-white-50 fw-bold mb-2 ms-2 mt-2" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>TỔNG QUAN</div>
            <Link href="/admin" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-grid-1x2-fill me-3 fs-5"></i> Bảng điều khiển
            </Link>
            
            <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>QUẢN LÝ BÁN HÀNG</div>
            <Link href="/admin/orders" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/orders') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-cart-check-fill me-3 fs-5"></i> Đơn hàng 
              {notifications.some(n => n.type === 'ORDER') && (
                <span className="badge bg-danger ms-auto rounded-pill shadow-sm">Có đơn</span>
              )}
            </Link>
            <Link href="/admin/products" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/products') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-box-seam-fill me-3 fs-5"></i> Sản phẩm
            </Link>
            <Link href="/admin/categories" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/categories') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-tags-fill me-3 fs-5"></i> Danh mục
            </Link>

            <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>KHÁCH HÀNG & ĐỐI TÁC</div>
            <Link href="/admin/customers" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/customers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-people-fill me-3 fs-5"></i> Khách hàng
            </Link>
            <Link href="/admin/reviews" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/reviews') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-chat-heart-fill me-3 fs-5"></i> Đánh giá
            </Link>
            <Link href="/admin/vouchers" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/vouchers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-ticket-perforated-fill me-3 fs-5"></i> Khuyến mãi
            </Link>

            <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>HỆ THỐNG</div>
            <Link href="/admin/reports" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/reports') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-bar-chart-fill me-3 fs-5"></i> Báo cáo
            </Link>
            <Link href="/admin/banners" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/banners') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-images me-3 fs-5"></i> Quản lý Banner
            </Link>
            <Link href="/admin/settings" onClick={() => setShowMobileMenu(false)} className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/settings') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
              <i className="bi bi-gear-fill me-3 fs-5"></i> Cài đặt
            </Link>
          </nav>

          <div className="p-3 border-top mt-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
             <button onClick={() => { 
               setShowMobileMenu(false);
               localStorage.removeItem('user'); 
               localStorage.removeItem('token'); 
               const isProd = window.location.hostname.includes('diennuoctruongtin.com');
               const domainAttr = isProd ? '; domain=.diennuoctruongtin.com' : '';
               document.cookie = `admin_token=; path=/${domainAttr}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
               document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
               router.replace('/login'); 
             }} className="btn btn-light w-100 rounded-3 fw-bold text-danger shadow-sm d-flex align-items-center justify-content-center gap-2">
               <i className="bi bi-box-arrow-right fs-5"></i> Đăng xuất
             </button>
          </div>
        </div>
      </div>

    </div>
  );
}