'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';

interface UserData {
  name: string;
  role: string;
}

export default function Header() {
  // Trạng thái ban đầu: chưa mounted, chưa có user
  const [user, setUser] = useState<UserData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Kỹ thuật sử dụng setTimeout 0ms hoặc async 
    // để đẩy việc setState ra khỏi chu kỳ render đồng bộ hiện tại
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Lỗi đọc dữ liệu:", error);
      } finally {
        // Luôn set isMounted cuối cùng để báo hiệu Client đã sẵn sàng
        setIsMounted(true);
      }
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <>
      <nav className="navbar navbar-light bg-white shadow-sm sticky-top py-2 py-md-3">
        <div className="container d-flex align-items-center justify-content-between flex-nowrap">
          
          {/* 1. LOGO */}
          <Link className="navbar-brand fw-bold text-danger fs-3 me-4 text-decoration-none" href="/">
            TRƯỜNG TÍN
          </Link>

          {/* 2. MENU DÀNH CHO PC */}
          <ul className="nav d-none d-lg-flex fw-bold text-uppercase me-auto" style={{ fontSize: '0.85rem' }}>
            <li className="nav-item">
              <Link className="nav-link text-dark px-2" href="/">Trang chủ</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark px-2" href="/san-pham">Sản phẩm</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-dark px-2" href="/lien-he">Liên hệ</Link>
            </li>
          </ul>

          {/* 3. Ô TÌM KIẾM */}
          <div className="d-flex mx-2 mx-lg-4 flex-grow-1" style={{ maxWidth: '600px' }}>
            <div className="input-group shadow-sm rounded-pill overflow-hidden border" style={{ border: '2px solid #eee' }}>
              <input 
                className="form-control border-0 ps-4 shadow-none bg-white" 
                type="search" 
                placeholder="Tìm vật tư..." 
                style={{ height: '40px', fontSize: '0.9rem' }}
              />
              <button className="btn btn-white border-0 pe-3" type="button">
                <i className="bi bi-search text-danger fw-bold"></i>
              </button>
            </div>
          </div>

          {/* 4. KHU VỰC USER & GIỎ HÀNG */}
          <div className="d-flex align-items-center gap-3 gap-md-4">
            
            {/* Sử dụng isMounted để chặn việc render sai lệch giữa Server và Client */}
            {isMounted ? (
              user ? (
                /* GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP */
                <div className="dropdown">
                  <button 
                    className="btn btn-link text-dark text-decoration-none fw-bold small d-flex align-items-center gap-2 p-0 shadow-none dropdown-toggle border-0" 
                    type="button" 
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-person-circle fs-5 text-danger"></i>
                    <span className="d-none d-sm-inline text-uppercase">Chào, {user.name}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                    {user.role === 'ADMIN' && (
                      <li>
                        <Link className="dropdown-item py-2 small fw-bold text-primary" href="/admin/dashboard">
                          <i className="bi bi-speedometer2 me-2"></i> QUẢN TRỊ VIÊN
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link className="dropdown-item py-2 small" href="/account">
                        <i className="bi bi-person me-2"></i> Thông tin cá nhân
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item py-2 small text-danger fw-bold" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                /* GIAO DIỆN KHI CHƯA ĐĂNG NHẬP */
                <button 
                  className="btn btn-link text-dark text-decoration-none fw-bold small d-flex align-items-center gap-1 p-0 shadow-none border-0"
                  data-bs-toggle="modal" 
                  data-bs-target="#authModal"
                >
                  <i className="bi bi-person fs-5"></i>
                  <span className="d-none d-xl-inline text-uppercase">ĐĂNG NHẬP</span>
                </button>
              )
            ) : (
              /* TRẠNG THÁI LOADING (CHỐNG LỖI CASCADING) */
              <div className="spinner-border spinner-border-sm text-light" role="status"></div>
            )}

            {/* GIỎ HÀNG */}
            <div className="position-relative cursor-pointer">
              <i className="bi bi-cart3 fs-4 text-dark"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                0
              </span>
            </div>
          </div>

        </div>
      </nav>
      <AuthModal />
    </>
  );
}