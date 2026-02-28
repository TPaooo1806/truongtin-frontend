"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import api from "@/lib/axios";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface UserData {
  name: string;
  role: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Header() {
  const router = useRouter();

  // 💡 BƯỚC 1: Khai báo Ref để giả lập click đóng menu mobile
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [cartCount, setCartCount] = useState(0);

  // State Auth
  const [user, setUser] = useState<UserData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // State Tìm kiếm & Danh mục Mobile
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // State cho Gợi ý tìm kiếm
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // LOGIC ĐẾM SỐ LƯỢNG GIỎ HÀNG REAL-TIME
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const total = cart.reduce(
          (sum: number, item: { quantity: number }) => sum + item.quantity,
          0
        );
        setCartCount(total);
      } catch (error) {
        console.error("Lỗi đọc giỏ hàng Header:", error);
      }
    };

    updateCartCount(); 
    window.addEventListener("cartUpdated", updateCartCount);
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Lỗi đọc dữ liệu user:", error);
      } finally {
        setIsMounted(true);
      }
    };
    initAuth();

    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/categories");
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // LOGIC GỢI Ý TÌM KIẾM (DEBOUNCE 300ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        try {
          const res = await api.get(
            `/api/search/suggest?q=${encodeURIComponent(searchTerm.trim())}`
          );
          if (Array.isArray(res.data) && res.data.length > 0) {
            setSuggestions(res.data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error("Lỗi gợi ý tìm kiếm:", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // LOGIC CLICK OUTSIDE ĐỂ ĐÓNG GỢI Ý
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = desktopSearchRef.current && !desktopSearchRef.current.contains(target);
      const isOutsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  // Hàm Submit Tìm kiếm form chính
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Hàm Chọn 1 Gợi Ý
  const handleSelectSuggestion = (keyword: string) => {
    setSearchTerm(keyword);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <>
      <header className="sticky-top shadow-sm bg-white">
        {/* 1. TOP BAR */}
        <div className="time_header bg-primary text-white py-2 d-none d-md-block">
          <div className="container text-center" style={{ fontSize: "13px" }}>
            <span>
              <b>CỬA HÀNG ĐIỆN NƯỚC TRƯỜNG TÍN</b> |&nbsp;Thời gian làm việc:
              Thứ 2 - Chủ Nhật, Từ 7h30 đến 17h30
            </span>
          </div>
        </div>

        {/* 2. MAIN NAVBAR */}
        <nav className="navbar navbar-light py-2 py-md-3 flex-column align-items-stretch">
          <div className="container d-flex align-items-center justify-content-between flex-nowrap gap-2 gap-md-3">
            
            {/* NÚT HAMBURGER MOBILE */}
            <button
              className="btn btn-light border d-lg-none px-2 py-1"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileMenu"
              aria-controls="mobileMenu"
            >
              <i className="bi bi-list fs-3 text-dark"></i>
            </button>

            {/* LOGO */}
            <Link className="navbar-brand fw-bold text-danger fs-3 mx-0 me-lg-4 text-decoration-none" href="/">
              TRƯỜNG TÍN
            </Link>

            {/* MENU PC */}
            <ul className="nav d-none d-lg-flex fw-bold text-uppercase me-auto align-items-center" style={{ fontSize: "0.85rem" }}>
              <li className="nav-item">
                <Link className="nav-link text-dark px-2" href="/">Trang chủ</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-dark px-2" href="/gioi-thieu">Giới thiệu</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-dark px-2" href="/lien-he">Liên hệ</Link>
              </li>
            </ul>

            {/* Hotline PC */}
            <div className="d-none d-lg-flex align-items-center ms-3 phone_header">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25.849 22.4917C24.7383 21.3951 23.3515 21.3951 22.2478 22.4917C21.4059 23.3266 20.564 24.1614 19.7362 25.0104C19.5098 25.2439 19.3187 25.2934 19.0428 25.1378C18.498 24.8406 17.9179 24.6001 17.3943 24.2746C14.9534 22.7393 12.9087 20.7654 11.0975 18.5438C10.199 17.4401 9.39948 16.2586 8.84055 14.9284C8.72735 14.6596 8.74858 14.4827 8.9679 14.2634C9.80984 13.4497 10.6305 12.6149 11.4583 11.78C12.6116 10.6197 12.6116 9.2613 11.4513 8.09391C10.7933 7.42885 10.1353 6.77795 9.47731 6.11289C8.7981 5.43368 8.12597 4.7474 7.43969 4.07527C6.3289 2.99278 4.94219 2.99278 3.83847 4.08234C2.98946 4.9172 2.17583 5.77328 1.31267 6.59399C0.513187 7.35103 0.109907 8.27786 0.0250061 9.36035C-0.10942 11.122 0.322159 12.7847 0.930616 14.4049C2.17583 17.7585 4.07195 20.7371 6.37135 23.4681C9.47731 27.1612 13.1847 30.0833 17.5217 32.1916C19.4744 33.1397 21.4979 33.8684 23.6982 33.9887C25.2123 34.0736 26.5282 33.6915 27.5824 32.51C28.3041 31.7034 29.1177 30.9676 29.8818 30.1965C31.0138 29.0503 31.0209 27.6636 29.896 26.5316C28.5517 25.1802 27.2004 23.836 25.849 22.4917Z" fill="white" />
              </svg>
              <div className="ct-header ms-2">
                <span className="d-block small">Hotline</span>
                <a href="tel:0903989096" className="fw-bold text-decoration-none">0903 989 096</a>
              </div>
            </div>

            {/* Ô TÌM KIẾM PC */}
            <form onSubmit={handleSearch} className="d-none d-lg-flex flex-grow-1 mx-3 mx-xl-4" style={{ maxWidth: "450px" }}>
              <div className="position-relative w-100" ref={desktopSearchRef}>
                <div className="input-group shadow-sm rounded-pill overflow-hidden border" style={{ border: "2px solid #eee" }}>
                  <input
                    className="form-control border-0 ps-4 shadow-none bg-white"
                    type="search"
                    placeholder="Tìm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    style={{ height: "40px", fontSize: "0.9rem" }}
                  />
                  <button className="btn btn-white border-0 pe-3" type="submit">
                    <i className="bi bi-search text-danger fw-bold"></i>
                  </button>
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="position-absolute w-100 bg-white shadow-sm rounded-4 list-unstyled mb-0 overflow-hidden" style={{ top: "calc(100% + 8px)", left: 0, zIndex: 1050, border: "1px solid #e0e0e0" }}>
                    {suggestions.map((item, idx) => (
                      <li key={idx} className="px-3 d-flex align-items-center text-dark bg-white border-bottom" style={{ minHeight: "48px", cursor: "pointer", fontSize: "15px", padding: "8px 0" }} onClick={() => handleSelectSuggestion(item)}>
                        <i className="bi bi-search text-muted me-3 opacity-75"></i>{item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>

            {/* KHU VỰC CHỨC NĂNG BÊN PHẢI */}
            <div className="d-flex align-items-center gap-3 gap-md-4">
              
              {/* 💡 BƯỚC 2: NÚT TRA CỨU ĐƠN HÀNG TRÊN DESKTOP */}
              <Link href="/track-order" className="btn btn-link text-dark text-decoration-none fw-bold small d-none d-lg-flex align-items-center gap-1 p-0 shadow-none border-0">
                <i className="bi bi-box-seam fs-4 text-primary"></i>
                <span className="d-none d-xl-inline text-uppercase" style={{ fontSize: "0.8rem" }}>Tra đơn</span>
              </Link>

              {/* TÀI KHOẢN */}
              {isMounted ? (
                user ? (
                  <div className="dropdown">
                    <button className="btn btn-link text-dark text-decoration-none fw-bold small d-flex align-items-center gap-2 p-0 shadow-none dropdown-toggle border-0" type="button" data-bs-toggle="dropdown">
                      <i className="bi bi-person-circle fs-4 text-danger"></i>
                      <span className="d-none d-sm-inline text-uppercase" style={{ fontSize: "0.8rem" }}>Chào, {user.name}</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-3 rounded-3">
                      {user.role === "ADMIN" && (
                        <li><Link className="dropdown-item py-2 small fw-bold text-primary" href="/admin/dashboard"><i className="bi bi-speedometer2 me-2"></i> QUẢN TRỊ VIÊN</Link></li>
                      )}
                      <li><Link className="dropdown-item py-2 small" href="/account"><i className="bi bi-person me-2"></i> Thông tin cá nhân</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item py-2 small text-danger fw-bold" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Đăng xuất</button></li>
                    </ul>
                  </div>
                ) : (
                  <button className="btn btn-link text-dark text-decoration-none fw-bold small d-flex align-items-center gap-1 p-0 shadow-none border-0" data-bs-toggle="modal" data-bs-target="#authModal">
                    <i className="bi bi-person fs-4"></i>
                    <span className="d-none d-xl-inline text-uppercase" style={{ fontSize: "0.8rem" }}>ĐĂNG NHẬP</span>
                  </button>
                )
              ) : (
                <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
              )}

              {/* GIỎ HÀNG */}
              <Link href="/cart" className="position-relative text-dark text-decoration-none cursor-pointer">
                <i className="bi bi-cart3 fs-4"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm" style={{ fontSize: "0.65rem", minWidth: "18px" }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Ô TÌM KIẾM MOBILE */}
          <div className="container d-block d-lg-none mt-3">
            <form onSubmit={handleSearch} className="w-100">
              <div className="position-relative w-100" ref={mobileSearchRef}>
                <div className="input-group shadow-sm rounded-pill overflow-hidden border" style={{ border: "1px solid #ddd" }}>
                  <input
                    className="form-control border-0 ps-3 shadow-none bg-light"
                    type="search"
                    placeholder="Tìm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    style={{ height: "40px", fontSize: "0.9rem" }}
                  />
                  <button className="btn btn-light border-0 px-3" type="submit">
                    <i className="bi bi-search text-danger fw-bold"></i>
                  </button>
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="position-absolute w-100 bg-white shadow-sm rounded-4 list-unstyled mb-0 overflow-hidden" style={{ top: "calc(100% + 8px)", left: 0, zIndex: 1050, border: "1px solid #e0e0e0" }}>
                    {suggestions.map((item, idx) => (
                      <li key={idx} className="px-3 d-flex align-items-center text-dark bg-white border-bottom" style={{ minHeight: "48px", cursor: "pointer", fontSize: "15px", padding: "8px 0" }} onClick={() => handleSelectSuggestion(item)}>
                        <i className="bi bi-search text-muted me-3 opacity-75"></i>{item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>
          </div>
        </nav>
      </header>

      {/* 3. MENU MOBILE OFF-CANVAS */}
      <div className="offcanvas offcanvas-start" tabIndex={-1} id="mobileMenu" aria-labelledby="mobileMenuLabel">
        <div className="offcanvas-header border-bottom bg-light py-3">
          <h5 className="offcanvas-title text-danger fw-bold fs-5" id="mobileMenuLabel">
            TRƯỜNG TÍN
          </h5>
          {/* 💡 GẮN REF CHO NÚT CLOSE */}
          <button ref={closeBtnRef} type="button" className="btn-close shadow-none" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>

        <div className="offcanvas-body p-0">
          <div className="list-group list-group-flush border-bottom mt-2">
            {/* 💡 SỬA data-bs-dismiss="offcanvas" THÀNH onClick={() => closeBtnRef.current?.click()} */}
            <Link href="/" className="list-group-item list-group-item-action fw-bold py-3 text-dark border-0" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-house-door text-primary me-2 fs-5 align-middle"></i> TRANG CHỦ
            </Link>
            <Link href="/san-pham" className="list-group-item list-group-item-action fw-bold py-3 text-dark border-0" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-grid text-success me-2 fs-5 align-middle"></i> TẤT CẢ SẢN PHẨM
            </Link>
            <a 
  href="tel:0903989096" 
  className="list-group-item list-group-item-action py-2 border-0 mt-2 mb-1"
  onClick={() => closeBtnRef.current?.click()}
>
  <div className="d-flex align-items-center bg-danger text-white p-2 rounded-3 shadow-sm">
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.849 22.4917C24.7383 21.3951 23.3515 21.3951 22.2478 22.4917C21.4059 23.3266 20.564 24.1614 19.7362 25.0104C19.5098 25.2439 19.3187 25.2934 19.0428 25.1378C18.498 24.8406 17.9179 24.6001 17.3943 24.2746C14.9534 22.7393 12.9087 20.7654 11.0975 18.5438C10.199 17.4401 9.39948 16.2586 8.84055 14.9284C8.72735 14.6596 8.74858 14.4827 8.9679 14.2634C9.80984 13.4497 10.6305 12.6149 11.4583 11.78C12.6116 10.6197 12.6116 9.2613 11.4513 8.09391C10.7933 7.42885 10.1353 6.77795 9.47731 6.11289C8.7981 5.43368 8.12597 4.7474 7.43969 4.07527C6.3289 2.99278 4.94219 2.99278 3.83847 4.08234C2.98946 4.9172 2.17583 5.77328 1.31267 6.59399C0.513187 7.35103 0.109907 8.27786 0.0250061 9.36035C-0.10942 11.122 0.322159 12.7847 0.930616 14.4049C2.17583 17.7585 4.07195 20.7371 6.37135 23.4681C9.47731 27.1612 13.1847 30.0833 17.5217 32.1916C19.4744 33.1397 21.4979 33.8684 23.6982 33.9887C25.2123 34.0736 26.5282 33.6915 27.5824 32.51C28.3041 31.7034 29.1177 30.9676 29.8818 30.1965C31.0138 29.0503 31.0209 27.6636 29.896 26.5316C28.5517 25.1802 27.2004 23.836 25.849 22.4917Z" fill="white" />
    </svg>
    <div className="ct-header ms-2">
      <span className="d-block small text-light" style={{ fontSize: "0.8rem" }}>Hotline gọi ngay</span>
      <span className="fw-bold fs-5 text-white">0903 989 096</span>
    </div>
  </div>
</a>
            
            {/* 💡 BƯỚC 3: NÚT TRA CỨU ĐƠN HÀNG MOBILE */}
            <Link href="/track-order" className="list-group-item list-group-item-action fw-bold py-3 text-danger border-0" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-box-seam text-danger me-2 fs-5 align-middle"></i> TRA CỨU ĐƠN HÀNG
            </Link>
          </div>

          <div className="px-3 py-2 bg-light text-muted small fw-bold text-uppercase mt-2">
            Danh mục vật tư
          </div>
          <div className="list-group list-group-flush">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="list-group-item list-group-item-action py-3 border-0 d-flex justify-content-between align-items-center"
                onClick={() => closeBtnRef.current?.click()}
              >
                {category.name}
                <i className="bi bi-chevron-right small text-muted"></i>
              </Link>
            ))}
          </div>

          {!user && (
            <div className="p-3 mt-2">
              <button
                className="btn btn-outline-danger w-100 fw-bold py-2 rounded-pill"
                data-bs-toggle="modal"
                data-bs-target="#authModal"
                onClick={() => closeBtnRef.current?.click()}
              >
                <i className="bi bi-person-circle me-2"></i> ĐĂNG NHẬP
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal />
    </>
  );
}