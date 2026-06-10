"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="pt-5 pb-4 mt-5 border-top"
      style={{ backgroundColor: "#1a2a3a", color: "rgba(255,255,255,0.75)" }}
    >
      <div className="container">
        <div className="row g-4 g-lg-5 mb-4">
          {/* Cột 1: Thông tin cửa hàng */}
          <div className="col-12 col-md-5 col-lg-5">
            <h5
              className="fw-bold text-white mb-3"
              style={{ letterSpacing: "-0.5px" }}
            >
              <span className="text-brand">TRƯỜNG</span> TÍN
            </h5>
            <p className="mb-2 lh-lg fs-6">
              Chuyên cung cấp vật tư điện nước chính hãng, giá sỉ tốt nhất dành
              cho thợ thầu và các công trình tại TP. Hồ Chí Minh.
            </p>
            <ul className="list-unstyled mt-3 d-flex flex-column gap-2 fs-6">
              <li>
                <div className="d-flex align-items-start">
                  <i className="bi bi-geo-alt-fill text-brand me-2 mt-1"></i>
                  <div>
                    Cửa hàng Trường Tín, 358 Nơ Trang Long, Phường 13, Bình Thạnh, TP. HCM
                    <div className="mt-2 mb-2">
                      <Link href="/lien-he" className="btn btn-sm btn-danger rounded-pill px-3 fw-bold shadow-sm d-inline-flex align-items-center">
                        <i className="bi bi-map-fill me-2"></i> Xem đường đi trên Bản đồ
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <i className="bi bi-telephone-fill text-brand me-2"></i>
                <a
                  href="tel:0903989096"
                  className="text-white text-decoration-none fw-semibold"
                >
                  0903 989 096
                </a>
              </li>
              <li>
                <i className="bi bi-envelope-fill text-brand me-2"></i>
                <a
                  href="mailto:ben0903989690@gmail.com"
                  className="text-white-50 text-decoration-none"
                >
                  ben0903989690@gmail.com
                </a>
              </li>
              <li>
                <i className="bi bi-clock-fill text-brand me-2"></i>
                T2 — CN: 7h30 — 17h30
              </li>
            </ul>
          </div>

          {/* Cột 2: Chính sách (mới) */}
          <div className="col-12 col-md-3 col-lg-3">
            <h5 className="fw-bold text-white text-uppercase mb-3">
              Chính sách
            </h5>
            <ul className="list-unstyled fs-6 d-flex flex-column gap-3">
              <li>
                <Link
                  href="/lien-he"
                  className="text-white-50 text-decoration-none footer-link"
                >
                  Liên hệ hỗ trợ
                </Link>
              </li>
              <li>
                <span className="text-white-50" style={{ cursor: "pointer" }}>
                  Chính sách đổi trả 7 ngày
                </span>
              </li>
              <li>
                <span className="text-white-50" style={{ cursor: "pointer" }}>
                  Chính sách giao hàng
                </span>
              </li>
              <li>
                <span className="text-white-50" style={{ cursor: "pointer" }}>
                  Chính sách bảo hành
                </span>
              </li>
              <li>
                <Link
                  href="/track-order"
                  className="text-white-50 text-decoration-none footer-link"
                >
                  Tra cứu đơn hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Kết nối (mới) */}
          <div className="col-12 col-md-4 col-lg-4">
            <h5 className="fw-bold text-white text-uppercase mb-3">
              Kết nối với chúng tôi
            </h5>
            <div className="d-flex gap-2 mb-3">
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center justify-content-center rounded-circle text-white"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#3b5998",
                  transition: "transform 0.2s",
                }}
                title="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                href="https://zalo.me/0903989096"
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#0068FF",
                  transition: "transform 0.2s",
                  fontSize: "0.85rem",
                }}
                title="Zalo"
              >
                Z
              </a>
              <a
                href="tel:0903989096"
                className="d-flex align-items-center justify-content-center rounded-circle text-white"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#0078D4",
                  transition: "transform 0.2s",
                }}
                title="Gọi ngay"
              >
                <i className="bi bi-telephone-fill"></i>
              </a>
            </div>
            <div className="bg-white bg-opacity-10 rounded-3 p-3 mt-2">
              <p
                className="mb-1 small fw-bold text-white"
                style={{ fontSize: "0.8rem" }}
              >
                💬 HỖ TRỢ NHANH QUA ZALO
              </p>
              <p
                className="mb-0 small text-white-50"
                style={{ fontSize: "0.75rem" }}
              >
                Nhắn tin Zalo để được báo giá sỉ và tư vấn miễn phí 24/7
              </p>
            </div>
          </div>
        </div>

        {/* Đường kẻ + Copyright */}
        <hr className="border-secondary opacity-25" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p className="small mb-0 text-white-50">
            © 2026 Cửa hàng Điện Nước Trường Tín. All rights reserved.
          </p>
          <p className="small mb-0 text-white-50">Thực hiện bởi Tpaooo</p>
        </div>
      </div>

      <style jsx>{`
        .footer-link {
          transition:
            color 0.2s ease,
            padding-left 0.2s ease;
        }
        .footer-link:hover {
          color: #fff !important;
          padding-left: 4px;
        }
      `}</style>
    </footer>
  );
}
