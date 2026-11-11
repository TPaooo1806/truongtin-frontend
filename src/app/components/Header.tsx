"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/axios";
import type { Category } from "../type";

const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false });

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface UserData {
  name: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // Khai báo Ref để giả lập click đóng menu mobile
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [cartCount, setCartCount] = useState(0);

  // State Auth
  const [user, setUser] = useState<UserData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // State Tìm kiếm & Danh mục
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // State cho Scroll co gọn Header
  const [isScrolled, setIsScrolled] = useState(false);

  // State cho Dropdown Danh mục tích hợp thanh tìm kiếm
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // State cho Gợi ý tìm kiếm
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // LẮNG NGHE SỰ KIỆN CUỘN TRANG CÓ KHOẢNG ĐỆM HYSTERESIS ĐỂ TRÁNH JITTER / BOUNCING LOOP
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          // Khoảng đệm (Hysteresis): Kích hoạt Slim khi cuộn qua 80px, chỉ hủy khi cuộn về dưới 20px
          if (currentY > 80) {
            setIsScrolled(true);
          } else if (currentY < 20) {
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        const token = localStorage.getItem("token");

        if (storedUser && token) {
          // Kiểm tra thời hạn Token chủ động an toàn cho UTF-8 & Base64Url
          try {
            const base64Url = token.split('.')[1];
            if (!base64Url) throw new Error("Invalid token format");
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              document.cookie = "admin_token=; path=/; max-age=0";
              setUser(null);
              return;
            }
          } catch {
            // Token không phải định dạng JWT hợp lệ -> coi như hết hạn
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            document.cookie = "admin_token=; path=/; max-age=0";
            setUser(null);
            return;
          }
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Lỗi đọc dữ liệu user:", error);
        setUser(null);
      } finally {
        setIsMounted(true);
      }
    };
    initAuth();
    
    window.addEventListener('authUpdated', initAuth);

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

    return () => {
      window.removeEventListener('authUpdated', initAuth);
    };
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

  // LOGIC CLICK OUTSIDE ĐỂ ĐÓNG GỢI Ý TÌM KIẾM & DROPDOWN DANH MỤC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = desktopSearchRef.current && !desktopSearchRef.current.contains(target);
      const isOutsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setShowSuggestions(false);
      }

      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "admin_token=; path=/; max-age=0";
    setUser(null);
    window.dispatchEvent(new Event("authUpdated"));
    router.push("/");
    router.refresh();
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

  // Icon sinh động cho từng danh mục (Ưu tiên icon cấu hình từ Admin)
  const renderCategoryIcon = (cat: Category) => {
    if (cat.icon && cat.icon.trim()) return cat.icon;
    const n = cat.name.toLowerCase();
    if (n.includes("ống") || n.includes("nước")) return "bi-water text-primary";
    if (n.includes("phụ kiện")) return "bi-intersect text-warning";
    if (n.includes("đèn") || n.includes("chiếu sáng") || n.includes("bóng")) return "bi-lightbulb text-warning";
    if (n.includes("điện") || n.includes("dây") || n.includes("cáp")) return "bi-lightning-charge text-danger";
    if (n.includes("băng keo") || n.includes("keo dán")) return "bi-disc text-primary";
    if (n.includes("silicon")) return "bi-droplet-half text-info";
    if (n.includes("kim khí") || n.includes("kìm") || n.includes("cắt") || n.includes("lưới") || n.includes("kẽm")) return "bi-wrench-adjustable text-secondary";
    if (n.includes("vệ sinh") || n.includes("van")) return "bi-badge-wc text-primary";
    return "bi-box-seam text-primary";
  };

  // Sắp xếp danh mục: Chỉ lấy danh mục isActive, gom danh mục 0 sản phẩm xuống cuối
  const sortedCategories = [...categories.filter((c) => c.isActive !== false)].sort((a, b) => {
    const countA = a._count?.products ?? 0;
    const countB = b._count?.products ?? 0;
    if (countA > 0 && countB === 0) return -1;
    if (countA === 0 && countB > 0) return 1;
    const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {/* 1. TOP BAR (NẰM TRONG FLOW TỰ NHIÊN, TỰ CUỘN ĐI MƯỢT MÀ KHÔNG GÂY LAYOUT SHIFT) */}
      <div 
        className="time_header text-white d-none d-md-flex align-items-center justify-content-center" 
        style={{ 
          backgroundColor: '#0078D4',
          height: '36px',
          fontSize: '13px',
        }}
      >
        <div className="container text-center">
          <span>
            <b>CỬA HÀNG ĐIỆN NƯỚC TRƯỜNG TÍN</b> |&nbsp;Thời gian làm việc:
            Thứ 2 - Chủ Nhật, Từ 7h30 đến 17h30
          </span>
        </div>
      </div>

      {/* 2. MAIN HEADER (THUẦN CSS STICKY: TOP 0, KHÔNG BAO GIỜ GÂY JITTER / BOUNCING LOOP) */}
      <header className="sticky-top shadow-sm bg-white" style={{ top: 0, zIndex: 1030 }}>
        {/* MAIN NAVBAR (TẤT CẢ PHẦN TỬ THẲNG HÀNG 100% KHÔNG BAO GIỜ BỊ RỚT DÒNG) */}
        <nav 
          className={`navbar navbar-light flex-column align-items-stretch transition-all ${
            isScrolled ? 'py-1 py-md-1.5' : 'py-2 py-md-2.5'
          }`}
          style={{ transition: 'padding 0.25s ease' }}
        >
          <div className="container d-flex align-items-center justify-content-between flex-nowrap gap-2 gap-md-3">
            
            {/* NÚT HAMBURGER MOBILE */}
            <button
              className="btn btn-hamburger d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileMenu"
              aria-controls="mobileMenu"
            >
              <i className="bi bi-list fs-3 text-dark"></i>
            </button>

            {/* LOGO TRƯỜNG TÍN */}
            <Link className="navbar-brand header-logo mx-0 me-lg-2 d-flex align-items-center text-decoration-none flex-shrink-0" href="/">
              <Image 
                src="/Main_logo.png" 
                alt="Trường Tín Logo" 
                width={200} 
                height={52} 
                priority
                style={{ 
                  objectFit: 'contain', 
                  maxHeight: isScrolled ? '36px' : '50px', 
                  width: 'auto',
                  transition: 'max-height 0.25s ease'
                }}
              />
            </Link>

            {/* MENU PC (TRANG CHỦ, GIỚI THIỆU, LIÊN HỆ - LUÔN NẰM TRÊN 1 HÀNG KHÔNG RỚT DÒNG) */}
            <ul 
              className={`nav d-none ${isScrolled ? 'd-xl-flex' : 'd-lg-flex'} flex-nowrap text-nowrap fw-bold text-uppercase align-items-center mb-0 ms-lg-1 ms-xl-2 gap-1 flex-shrink-0`} 
              style={{ fontSize: "0.82rem" }}
            >
              {[
                { name: "Trang chủ", path: "/" },
                { name: "Giới thiệu", path: "/gioi-thieu" },
                { name: "Liên hệ", path: "/lien-he" },
              ].map((item) => {
                const active = pathname === item.path; 

                return (
                  <li className="nav-item text-nowrap" key={item.path}>
                    <Link 
                      href={item.path}
                      className={`nav-link px-2.5 py-1 text-nowrap rounded-pill transition-all ${active ? 'text-danger' : 'text-dark hover-subtle-bg'}`}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* HOTLINE PC (DẠNG GỌN GÀNG, KHÔNG CHIẾM DIỆN TÍCH NGANG) */}
            {!isScrolled ? (
              <div className="d-none d-xl-flex align-items-center ms-1 ms-xxl-2 flex-nowrap text-nowrap phone_header flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25.849 22.4917C24.7383 21.3951 23.3515 21.3951 22.2478 22.4917C21.4059 23.3266 20.564 24.1614 19.7362 25.0104C19.5098 25.2439 19.3187 25.2934 19.0428 25.1378C18.498 24.8406 17.9179 24.6001 17.3943 24.2746C14.9534 22.7393 12.9087 20.7654 11.0975 18.5438C10.199 17.4401 9.39948 16.2586 8.84055 14.9284C8.72735 14.6596 8.74858 14.4827 8.9679 14.2634C9.80984 13.4497 10.6305 12.6149 11.4583 11.78C12.6116 10.6197 12.6116 9.2613 11.4513 8.09391C10.7933 7.42885 10.1353 6.77795 9.47731 6.11289C8.7981 5.43368 8.12597 4.7474 7.43969 4.07527C6.3289 2.99278 4.94219 2.99278 3.83847 4.08234C2.98946 4.9172 2.17583 5.77328 1.31267 6.59399C0.513187 7.35103 0.109907 8.27786 0.0250061 9.36035C-0.10942 11.122 0.322159 12.7847 0.930616 14.4049C2.17583 17.7585 4.07195 20.7371 6.37135 23.4681C9.47731 27.1612 13.1847 30.0833 17.5217 32.1916C19.4744 33.1397 21.4979 33.8684 23.6982 33.9887C25.2123 34.0736 26.5282 33.6915 27.5824 32.51C28.3041 31.7034 29.1177 30.9676 29.8818 30.1965C31.0138 29.0503 31.0209 27.6636 29.896 26.5316C28.5517 25.1802 27.2004 23.836 25.849 22.4917Z" fill="white" />
                </svg>
                <div className="ct-header ms-1.5">
                  <span className="d-block small" style={{ fontSize: "0.7rem", lineHeight: 1 }}>Hotline</span>
                  <a href="tel:0903989096" className="fw-bold text-decoration-none" style={{ fontSize: "0.84rem" }}>0903 989 096</a>
                </div>
              </div>
            ) : (
              <a 
                href="tel:0903989096" 
                className="btn btn-outline-warning btn-sm rounded-pill fw-bold d-none d-xxl-inline-flex align-items-center gap-1 text-dark flex-shrink-0"
                title="Gọi hotline tư vấn"
                style={{ fontSize: "0.78rem", padding: "4px 10px" }}
              >
                <i className="bi bi-telephone-fill text-danger"></i>
                <span>0903 989 096</span>
              </a>
            )}

            {/* Ô TÌM KIẾM TÍCH HỢP NÚT DANH MỤC TRÊN DESKTOP (TIKI / AMAZON STYLE) */}
            <form 
              onSubmit={handleSearch} 
              className="d-none d-lg-flex flex-grow-1 mx-2 mx-xl-3" 
              style={{ maxWidth: isScrolled ? "400px" : "440px", minWidth: "220px", transition: "max-width 0.25s ease" }}
            >
              <div className="position-relative w-100 header-search-wrapper" ref={desktopSearchRef}>
                <div 
                  className="input-group search-pill-container d-flex align-items-stretch"
                  style={{ 
                    borderRadius: "50px", 
                    backgroundColor: "#f8f9fa",
                    border: "1.5px solid #e2e8f0",
                    height: isScrolled ? "38px" : "44px",
                    transition: "all 0.25s ease"
                  }}
                >
                  {/* NÚT DANH MỤC TÍCH HỢP ĐẦU THANH TÌM KIẾM */}
                  <div className="position-relative h-100" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      className={`btn btn-category-integrated h-100 d-flex align-items-center gap-1.5 fw-bold text-nowrap border-0 border-end transition-all ${
                        showCategoryDropdown ? 'bg-primary text-white' : 'text-dark bg-transparent'
                      }`}
                      style={{ 
                        fontSize: "0.82rem",
                        paddingLeft: "15px",
                        paddingRight: "13px",
                        borderTopLeftRadius: "50px",
                        borderBottomLeftRadius: "50px",
                        borderColor: "#e2e8f0"
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowCategoryDropdown(!showCategoryDropdown);
                      }}
                      aria-expanded={showCategoryDropdown}
                    >
                      <i className={`bi bi-grid-fill ${showCategoryDropdown ? 'text-white' : 'text-primary'}`}></i>
                      <span>Danh mục</span>
                      <i className={`bi bi-chevron-down small ${showCategoryDropdown ? 'rotate-180 text-white' : 'text-muted'}`} style={{ fontSize: "0.7rem", transition: "transform 0.2s ease" }}></i>
                    </button>

                    {/* DROPDOWN MENU DANH MỤC */}
                    {showCategoryDropdown && (
                      <div 
                        className="position-absolute bg-white rounded-4 shadow-xl border overflow-hidden mt-2 p-1"
                        style={{ 
                          top: "100%", 
                          left: 0, 
                          width: "280px", 
                          maxHeight: "440px", 
                          overflowY: "auto", 
                          zIndex: 1060,
                          boxShadow: "0 15px 35px -5px rgba(0, 120, 212, 0.22)"
                        }}
                      >
                        <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center justify-content-between">
                          <span className="fw-bold small text-dark text-uppercase" style={{ fontSize: "0.78rem" }}>
                            <i className="bi bi-list-task me-1 text-primary"></i> Danh mục vật tư ({sortedCategories.length})
                          </span>
                          <Link 
                            href="/san-pham" 
                            className="text-primary text-decoration-none fw-semibold small" 
                            style={{ fontSize: "0.76rem" }}
                            onClick={() => setShowCategoryDropdown(false)}
                          >
                            Xem tất cả &rarr;
                          </Link>
                        </div>
                        
                        <div className="py-1">
                          {sortedCategories.length > 0 ? (
                            sortedCategories.map((cat) => {
                              const isZero = (cat._count?.products ?? 0) === 0;
                              return (
                                <Link
                                  key={cat.id}
                                  href={`/category/${cat.slug}`}
                                  className="dropdown-category-item d-flex align-items-center justify-content-between px-3 py-2 text-dark text-decoration-none rounded-3"
                                  style={{ fontSize: "0.86rem", transition: "all 0.15s ease" }}
                                  onClick={() => setShowCategoryDropdown(false)}
                                >
                                  <div className="d-flex align-items-center gap-2 text-truncate me-2">
                                    <i className={`bi ${renderCategoryIcon(cat)} fs-6 text-primary`}></i>
                                    <span className="fw-medium text-truncate">{cat.name}</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1">
                                    {isZero && (
                                      <span
                                        className="badge rounded-pill bg-light text-muted border-0 opacity-75 small"
                                        style={{ fontSize: "0.65rem", padding: "0.2em 0.5em" }}
                                      >
                                        Đang nhập
                                      </span>
                                    )}
                                    <i className="bi bi-chevron-right small text-muted opacity-50" style={{ fontSize: "0.7rem" }}></i>
                                  </div>
                                </Link>
                              );
                            })
                          ) : (
                            <div className="p-3 text-center text-muted small">Đang nạp danh mục...</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ô NHẬP TÌM KIẾM */}
                  <input
                    className="form-control border-0 ps-3 shadow-none bg-transparent flex-grow-1"
                    type="search"
                    placeholder="Tìm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    style={{ fontSize: "0.88rem" }}
                  />

                  {/* NÚT KÍNH LÚP TÌM KIẾM */}
                  <button className="btn btn-link border-0 pe-3 text-decoration-none" type="submit">
                    <i className="bi bi-search text-danger fw-bold"></i>
                  </button>
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="position-absolute w-100 bg-white shadow-lg rounded-4 list-unstyled mb-0 overflow-hidden" style={{ top: "calc(100% + 8px)", left: 0, zIndex: 1050, border: "1px solid #e0e0e0" }}>
                    {suggestions.map((item, idx) => (
                      <li key={idx} className="px-3 d-flex align-items-center text-dark bg-white border-bottom" style={{ minHeight: "44px", cursor: "pointer", fontSize: "14px", padding: "10px 0", transition: "all 0.2s ease" }} onClick={() => handleSelectSuggestion(item)}>
                        <i className="bi bi-search text-muted me-3 opacity-75"></i>{item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>

            {/* KHU VỰC CHỨC NĂNG BÊN PHẢI (TRA ĐƠN, TÀI KHOẢN, GIỎ HÀNG) */}
            <div className="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
              
              {/* NÚT TRA CỨU ĐƠN HÀNG */}
              <Link href="/track-order" className="btn-track-order hover-scale hover-bg-primary-light d-none d-lg-flex" style={{ height: isScrolled ? "36px" : "auto" }}>
                <i className="bi bi-box-seam fs-5 text-primary"></i>
                <span className="d-none d-xl-inline text-uppercase" style={{ fontSize: "0.78rem" }}>Tra đơn</span>
              </Link>

              {/* TÀI KHOẢN */}
              {isMounted ? (
                user ? (
                  <div className="dropdown">
                    <button className="btn-login hover-scale hover-bg-danger-light" type="button" data-bs-toggle="dropdown" style={{ height: isScrolled ? "36px" : "auto" }}>
                      <i className="bi bi-person-circle fs-5 text-danger"></i>
                      <span className="d-none d-sm-inline text-uppercase text-truncate" style={{ fontSize: "0.78rem", maxWidth: "85px" }}>Chào, {user.name}</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-3">
                      {user.role === "ADMIN" && (
                        <li><Link className="dropdown-item py-2 small fw-bold text-primary" href="/admin/dashboard"><i className="bi bi-speedometer2 me-2"></i> QUẢN TRỊ VIÊN</Link></li>
                      )}
                      <li><Link className="dropdown-item py-2 small" href="/account"><i className="bi bi-person me-2"></i> Thông tin cá nhân</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item py-2 small text-danger fw-bold" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Đăng xuất</button></li>
                    </ul>
                  </div>
                ) : (
                  <button className="btn-login hover-scale hover-bg-danger-light" data-bs-toggle="modal" data-bs-target="#authModal" style={{ height: isScrolled ? "36px" : "auto" }}>
                    <i className="bi bi-person fs-5"></i>
                    <span className="d-none d-xl-inline text-uppercase" style={{ fontSize: "0.78rem" }}>ĐĂNG NHẬP</span>
                  </button>
                )
              ) : (
                <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
              )}

              {/* GIỎ HÀNG */}
              <Link href="/cart" className="position-relative text-dark text-decoration-none cursor-pointer hover-scale p-1">
                <i className="bi bi-cart3 fs-5"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge cart-badge bg-danger">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Ô TÌM KIẾM MOBILE */}
          <div className="container d-block d-lg-none mt-2">
            <form onSubmit={handleSearch} className="w-100">
              <div className="position-relative w-100 header-search-wrapper" ref={mobileSearchRef}>
                <div className="input-group search-input-group" style={{ borderRadius: "50px" }}>
                  <input
                    className="form-control header-search-input border-0 ps-3 shadow-none"
                    type="search"
                    placeholder="Tìm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    style={{ height: isScrolled ? "36px" : "40px", fontSize: "0.88rem" }}
                  />
                  <button className="btn btn-link border-0 px-3 text-decoration-none" type="submit">
                    <i className="bi bi-search text-danger fw-bold"></i>
                  </button>
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="position-absolute w-100 bg-white shadow rounded-4 list-unstyled mb-0 overflow-hidden" style={{ top: "calc(100% + 8px)", left: 0, zIndex: 1050, border: "1px solid #e0e0e0" }}>
                    {suggestions.map((item, idx) => (
                      <li key={idx} className="px-3 d-flex align-items-center text-dark bg-white border-bottom" style={{ minHeight: "44px", cursor: "pointer", fontSize: "14px", padding: "10px 0", transition: "all 0.2s ease" }} onClick={() => handleSelectSuggestion(item)}>
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
          <button ref={closeBtnRef} type="button" className="btn-close shadow-none" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>

        <div className="offcanvas-body p-0">
          <div className="mobile-menu-items p-2">
            <Link href="/" className="mobile-menu-item list-group-item list-group-item-action fw-bold text-dark" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-house-door text-primary me-2 fs-5 align-middle"></i> TRANG CHỦ
            </Link>
            <Link href="/san-pham" className="mobile-menu-item list-group-item list-group-item-action fw-bold text-dark" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-grid text-success me-2 fs-5 align-middle"></i> TẤT CẢ SẢN PHẨM
            </Link>
            <Link href="/gioi-thieu" className="mobile-menu-item list-group-item list-group-item-action fw-bold text-dark" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-info-circle text-info me-2 fs-5 align-middle"></i> GIỚI THIỆU
            </Link>
            <Link href="/lien-he" className="mobile-menu-item list-group-item list-group-item-action fw-bold text-dark" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-geo-alt-fill text-danger me-2 fs-5 align-middle"></i> LIÊN HỆ & BẢN ĐỒ
            </Link>
          </div>

          {/* Hotline Card */}
          <div className="px-2 my-3">
            <a 
              href="tel:0903989096" 
              className="hotline-card d-flex align-items-center text-white text-decoration-none"
              onClick={() => closeBtnRef.current?.click()}
            >
              <svg width="32" height="32" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25.849 22.4917C24.7383 21.3951 23.3515 21.3951 22.2478 22.4917C21.4059 23.3266 20.564 24.1614 19.7362 25.0104C19.5098 25.2439 19.3187 25.2934 19.0428 25.1378C18.498 24.8406 17.9179 24.6001 17.3943 24.2746C14.9534 22.7393 12.9087 20.7654 11.0975 18.5438C10.199 17.4401 9.39948 16.2586 8.84055 14.9284C8.72735 14.6596 8.74858 14.4827 8.9679 14.2634C9.80984 13.4497 10.6305 12.6149 11.4583 11.78C12.6116 10.6197 12.6116 9.2613 11.4513 8.09391C10.7933 7.42885 10.1353 6.77795 9.47731 6.11289C8.7981 5.43368 8.12597 4.7474 7.43969 4.07527C6.3289 2.99278 4.94219 2.99278 3.83847 4.08234C2.98946 4.9172 2.17583 5.77328 1.31267 6.59399C0.513187 7.35103 0.109907 8.27786 0.0250061 9.36035C-0.10942 11.122 0.322159 12.7847 0.930616 14.4049C2.17583 17.7585 4.07195 20.7371 6.37135 23.4681C9.47731 27.1612 13.1847 30.0833 17.5217 32.1916C19.4744 33.1397 21.4979 33.8684 23.6982 33.9887C25.2123 34.0736 26.5282 33.6915 27.5824 32.51C28.3041 31.7034 29.1177 30.9676 29.8818 30.1965C31.0138 29.0503 31.0209 27.6636 29.896 26.5316C28.5517 25.1802 27.2004 23.836 25.849 22.4917Z" fill="white" />
              </svg>
              <div className="ms-3">
                <span className="d-block small fw-normal" style={{ fontSize: "0.8rem" }}>Gọi hỗ trợ ngay</span>
                <span className="fw-bold fs-5">0903 989 096</span>
              </div>
            </a>
          </div>
            
          {/* NÚT TRA CỨU ĐƠN HÀNG MOBILE */}
          <div className="mobile-menu-items p-2">
            <Link href="/track-order" className="mobile-menu-item list-group-item list-group-item-action fw-bold text-danger" onClick={() => closeBtnRef.current?.click()}>
              <i className="bi bi-box-seam text-danger me-2 fs-5 align-middle"></i> TRA CỨU ĐƠN HÀNG
            </Link>
          </div>

          <div className="px-3 py-2 bg-light text-muted small fw-bold text-uppercase mt-2">
            Danh mục vật tư ({sortedCategories.length})
          </div>
          <div className="mobile-menu-items p-2">
            {sortedCategories.map((category) => {
              const isZero = (category._count?.products ?? 0) === 0;
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="mobile-menu-item list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onClick={() => closeBtnRef.current?.click()}
                >
                  <div className="d-flex align-items-center gap-2 text-truncate">
                    <i className={`bi ${renderCategoryIcon(category)} text-primary fs-6`}></i>
                    <span>{category.name}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {isZero && (
                      <span className="badge bg-light text-muted small" style={{ fontSize: "0.68rem" }}>
                        Đang nhập
                      </span>
                    )}
                    <i className="bi bi-chevron-right small text-muted"></i>
                  </div>
                </Link>
              );
            })}
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

      <style jsx>{`
        .search-pill-container:focus-within {
          background-color: #ffffff !important;
          border-color: #0078D4 !important;
          box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.15) !important;
        }
        .btn-category-integrated:hover {
          background-color: #e8f4fd !important;
          color: #0078D4 !important;
        }
        .transition-all { transition: all 0.2s ease; }
        .hover-subtle-bg:hover { 
          background-color: #e8f4fd; 
          color: #0078D4 !important;
        }
        .rotate-180 {
          transform: rotate(180deg);
        }
        .dropdown-category-item:hover {
          background-color: #f0f7ff;
          color: #0078D4 !important;
          padding-left: 1.25rem !important;
        }
      `}</style>
    </>
  );
}