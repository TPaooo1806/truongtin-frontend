'use client';
import { useEffect, useState, useRef } from 'react';
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
  const [isReady, setIsReady] = useState(false);

  // STATE THÔNG BÁO
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // STATE MODAL (POP-UP)
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAdminAuth = () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user || user.role !== 'ADMIN') {
          toast.error("Vùng cấm! Vui lòng đăng nhập quyền Admin.");
          router.replace('/');
          return;
        }
        requestAnimationFrame(() => setIsReady(true));
      } catch (error) {
        console.error("Lỗi parse user data:", error);
        localStorage.removeItem('user');
        router.replace('/');
      }
    };
    checkAdminAuth();
  }, [router]);

  // ==============================================
  // 2. LOGIC POLLING: Lấy thông báo mỗi 15 giây (với leak protection)
  // ==============================================
  useEffect(() => {
    if (!isReady) return;

    let mounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/admin/notifications'); 
        if (mounted && res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isReady]);

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
    }
    setSelectedNotif(notif);
    setShowNotifications(false);
  };

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
      <div className="text-white shadow-lg m-3 rounded-4 d-flex flex-column" style={{ width: '280px', background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)', overflow: 'hidden' }}>
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
          <Link href="/admin/vouchers" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/vouchers') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-ticket-perforated-fill me-3 fs-5"></i> Khuyến mãi
          </Link>

          <div className="text-white-50 fw-bold mb-2 ms-2 mt-4" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>HỆ THỐNG</div>
          <Link href="/admin/reports" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/reports') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-bar-chart-fill me-3 fs-5"></i> Báo cáo
          </Link>
          <Link href="/admin/settings" className={`nav-link py-2 px-3 mb-1 rounded-3 text-white d-flex align-items-center transition-all ${isActive('/admin/settings') ? 'bg-white bg-opacity-25 shadow-sm fw-bold' : 'opacity-75 hover-opacity-100'}`}>
            <i className="bi bi-gear-fill me-3 fs-5"></i> Cài đặt
          </Link>
        </nav>

        {/* LOGOUT AREA */}
        <div className="p-3 border-top mt-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
           <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); router.replace('/'); }} className="btn btn-light w-100 rounded-3 fw-bold text-danger shadow-sm d-flex align-items-center justify-content-center gap-2">
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
            
            {/* NÚT CHUÔNG THÔNG BÁO VÀ DROPDOWN */}
            <div className="position-relative" ref={notificationRef}>
              <button 
                className="btn btn-light rounded-circle shadow-sm position-relative d-flex align-items-center justify-content-center" 
                style={{ width: '40px', height: '40px' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="bi bi-bell-fill text-secondary fs-5"></i>
                {notifications.some(n => !n.isRead) && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm border border-light" style={{ fontSize: '0.65rem' }}>
                    {notifications.filter(n => !n.isRead).length > 99 ? '99+' : notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="position-absolute bg-white shadow-lg rounded-4 border mt-2 py-0" style={{ right: 0, top: '100%', width: '360px', zIndex: 1050, overflow: 'hidden' }}>
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                    <h6 className="mb-0 fw-bold text-dark">Thông báo mới</h6>
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

            <div className="dropdown border-start ps-3 ms-2">
              <button className="btn btn-white fw-bold text-primary d-flex align-items-center gap-2" type="button">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>B</div>
                Sếp Bảo
              </button>
            </div>
          </div>
        </header>

        {/* NỘI DUNG CHÍNH */}
        <main className="flex-grow-1 position-relative">
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

    </div>
  );
}