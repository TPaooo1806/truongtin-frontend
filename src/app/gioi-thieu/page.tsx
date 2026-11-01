"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import "./about.css";

// --- ẢNH MẶT TIỀN THỰC TẾ & VẬT TƯ CỬA HÀNG ---
const STORE_IMAGE = "/images/STORE_IMAGE_URL.webp";

// --- DANH SÁCH THƯƠNG HIỆU PHÂN PHỐI CHÍNH HÃNG ---
const BRANDS = [
  { name: "CADIVI", desc: "Dây & Cáp điện số 1 VN", tag: "Dây cáp điện", color: "#d97706" },
  { name: "BÌNH MINH", desc: "Ống nhựa PVC, PPR, HDPE", tag: "Ống & Phụ kiện", color: "#0284c7" },
  { name: "PANASONIC", desc: "Thiết bị điện & Chiếu sáng", tag: "Công tắc, CB", color: "#0078d4" },
  { name: "PHILIPS", desc: "Bóng đèn & Chiếu sáng LED", tag: "Đèn LED", color: "#2563eb" },
  { name: "MPE", desc: "Thiết bị điện & Smart Home", tag: "Đèn & Thiết bị", color: "#ea580c" },
  { name: "SINO - VANLOCK", desc: "Công tắc, Ổ cắm, Tủ điện", tag: "Điện dân dụng", color: "#dc2626" },
  { name: "DAPHACO", desc: "Dây cáp điện dân dụng", tag: "Dây điện", color: "#ca8a04" },
  { name: "APOLLO", desc: "Keo Silicone & Chống thấm", tag: "Keo & Phụ gia", color: "#16a34a" },
  { name: "NANOCO", desc: "Quạt hút & Phụ kiện điện", tag: "Thông gió & Đèn", color: "#0891b2" },
  { name: "SCHNEIDER", desc: "Aptomat & Thiết bị an toàn", tag: "CB & Khởi động", color: "#059669" },
];

// --- COMPONENT SỐ NHẢY TỰ ĐỘNG (NUMBER COUNTER TICKER) ---
function NumberCounter({
  target,
  suffix = "",
  duration = 1400,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.2 }
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasStarted, target]);

  useEffect(() => {
    if (!hasStarted) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const animDuration = isMobile ? Math.min(duration, 900) : duration;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / animDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, target, duration]);

  return (
    <span ref={ref} className="fw-bolder">
      {count}
      {suffix}
    </span>
  );
}

export default function AboutPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // State cho Form nhận ưu đãi / báo giá sỉ
  const [promoName, setPromoName] = useState("");
  const [promoPhone, setPromoPhone] = useState("");
  const [promoRole, setPromoRole] = useState("Khách lẻ sửa nhà");
  const [promoNote, setPromoNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherReceived, setVoucherReceived] = useState<string | null>(null);

  // Quan sát các Section để thêm hiệu ứng Fade-in theo nhịp cuộn
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".fade-in-section");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Xử lý gửi Form nhận ưu đãi
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promoName.trim() || !promoPhone.trim()) {
      toast.error("Vui lòng nhập họ tên và số điện thoại / Zalo!");
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(promoPhone.trim())) {
      toast.error("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)!");
      return;
    }

    setIsSubmitting(true);
    try {
      const messageContent = `[Đăng ký ưu đãi Giới Thiệu] Vai trò: ${promoRole}. Ghi chú: ${promoNote.trim() || "Không có"}`;
      const res = await api.post("/api/contact", {
        name: promoName.trim(),
        phone: promoPhone.trim(),
        message: messageContent,
      });

      if (res.data?.success) {
        setVoucherReceived("TRUONGTIN5");
        toast.success("Đăng ký thành công! Bạn nhận được mã giảm giá 5%.");
      } else {
        toast.error(res.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
      }
    } catch {
      // Fallback ngay cả khi offline
      setVoucherReceived("TRUONGTIN5");
      toast.success("Đã ghi nhận! Bạn nhận được mã giảm giá 5%.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="about-landing overflow-hidden">
      {/* =================================================================
          TẦNG 1: HERO ASYMMETRIC SPLIT - HÌNH ẢNH MẶT TIỀN THẬT & ĐẬM MÀU
          ================================================================= */}
      <section className="hero-wrapper-v2 py-4 py-lg-5 position-relative border-bottom">
        <div className="container py-lg-4">
          <div className="row align-items-center g-4 g-lg-5">
            {/* Cột trái: Thông điệp cốt lõi & CTA */}
            <div className="col-lg-6">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill hero-tag-v2 mb-3">
                <i className="bi bi-geo-alt-fill text-danger"></i>
                <span className="fw-bold">Cửa hàng Điện Nước Trường Tín – 358 Nơ Trang Long, Bình Thạnh</span>
              </div>

              <h1 className="display-5 fw-bolder mb-3 text-contrast-dark" style={{ lineHeight: 1.25 }}>
                Hơn 20 Năm Giữ Trọn Chữ Tín Trong Từng{" "}
                <span className="text-gradient-blue">Công Trình & Nếp Nhà</span>
              </h1>

              <p className="lead text-contrast-body mb-4 fw-normal" style={{ fontSize: "1.1rem", lineHeight: 1.75 }}>
                Tọa lạc tại mặt tiền <strong>358 Nơ Trang Long (Bình Thạnh)</strong>, Cửa hàng Điện Nước <strong>Trường Tín</strong> là điểm tựa vật tư quen thuộc suốt hơn hai thập kỷ của cư dân và thợ điện nước khu vực Bình Thạnh, Thủ Đức. Dù bạn mua lẻ một chiếc bóng đèn, một cuộn băng keo non hay lấy trọn gói thiết bị cho công trình, chúng tôi luôn tận tâm tư vấn đúng kích cỡ, đúng bệnh và bán đúng giá tốt như mua sỉ.
              </p>

              {/* Các cam kết nhanh bằng badge màu sắc */}
              <div className="row g-2 mb-4">
                <div className="col-sm-6">
                  <div className="p-2 px-3 rounded-3 bg-white border border-primary border-opacity-25 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-patch-check-fill fs-5 text-primary"></i>
                    <span className="fw-bold text-dark small">Mua lẻ 1 món giá tốt như sỉ</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-2 px-3 rounded-3 bg-white border border-success border-opacity-25 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-arrow-repeat fs-5 text-success"></i>
                    <span className="fw-bold text-dark small">Hỗ trợ đổi trả trong 7 ngày</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-2 px-3 rounded-3 bg-white border border-warning border-opacity-50 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-lightning-charge-fill fs-5 text-warning"></i>
                    <span className="fw-bold text-dark small">Hàng sẵn kho, ghé lấy liền</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-2 px-3 rounded-3 bg-white border border-danger border-opacity-25 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-shield-check fs-5 text-danger"></i>
                    <span className="fw-bold text-dark small">100% Chính hãng Cadivi, Bình Minh</span>
                  </div>
                </div>
              </div>

              {/* Nút bấm hành động */}
              <div className="d-flex flex-wrap gap-3">
                <Link
                  href="/san-pham"
                  className="btn btn-brand-primary-v2 btn-pulse-v2 btn-lg px-4 py-3 rounded-3 d-flex align-items-center gap-2"
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>Khám Phá 400+ Sản Phẩm</span>
                </Link>

                <a
                  href="https://maps.google.com/?q=358+Nơ+Trang+Long,+Phường+13,+Bình+Thạnh,+Hồ+Chí+Minh"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-dark btn-lg px-4 py-3 fw-bold rounded-3 d-flex align-items-center gap-2 shadow-sm"
                  style={{ borderWidth: "2px" }}
                >
                  <i className="bi bi-compass-fill text-danger"></i>
                  <span>Chỉ Đường Tới Tiệm (Google Maps)</span>
                </a>
              </div>
            </div>

            {/* Cột phải: ẢNH MẶT TIỀN THỰC TẾ 358 NƠ TRANG LONG */}
            <div className="col-lg-6">
              <div className="position-relative ps-lg-3">
                <div
                  className="hero-store-frame border border-4 border-white position-relative"
                  style={{ aspectRatio: "4/3", backgroundColor: "#0b192c" }}
                >
                  <Image
                    src={STORE_IMAGE}
                    alt="Mặt tiền Cửa hàng Điện Nước Trường Tín - 358 Nơ Trang Long, P.13, Bình Thạnh"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    className="object-fit-cover"
                  />

                  {/* Huy hiệu xác thực ảnh thật */}
                  <div className="store-real-badge d-flex align-items-center gap-1 shadow">
                    <i className="bi bi-camera-fill text-warning"></i>
                    <span>Ảnh thực tế cửa hàng</span>
                  </div>

                  {/* Glassmorphism Badge định vị cửa hàng */}
                  <div className="position-absolute bottom-0 start-0 w-100 p-3 p-md-4" style={{ zIndex: 4 }}>
                    <div className="glass-badge-v2 rounded-3 p-3 text-white d-flex align-items-center justify-content-between gap-3">
                      <div>
                        <div className="fw-bold d-flex align-items-center gap-2 mb-1" style={{ fontSize: "1rem" }}>
                          <i className="bi bi-shop-window text-warning fs-5"></i>
                          <span>Cửa Hàng Điện Nước Trường Tín</span>
                        </div>
                        <div className="small text-white-50" style={{ fontSize: "0.85rem" }}>
                          📍 358 Nơ Trang Long, P.13, Q. Bình Thạnh • 7h00 - 18h30 (T2 - CN)
                        </div>
                      </div>
                      <a
                        href="tel:0903989096"
                        className="btn btn-warning btn-sm fw-bold px-3 py-2 text-nowrap rounded-pill text-dark d-none d-sm-inline-flex align-items-center gap-1 shadow"
                      >
                        <i className="bi bi-telephone-fill"></i>
                        <span>0903 989 096</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1: 20+ Năm Kinh Nghiệm */}
                <div
                  className="floating-badge-1 position-absolute top-0 start-0 translate-middle-y bg-white p-3 rounded-4 shadow-lg border d-none d-md-flex align-items-center gap-3"
                  style={{ marginLeft: "-15px", zIndex: 5 }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow"
                    style={{ width: "52px", height: "52px", backgroundColor: "#ff6b00", fontSize: "1.25rem" }}
                  >
                    20+
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: "0.98rem" }}>
                      Năm Kinh Nghiệm
                    </div>
                    <div className="text-secondary small" style={{ fontSize: "0.8rem" }}>
                      Uy tín vững bền từ năm 2004
                    </div>
                  </div>
                </div>

                {/* Floating Badge 2: Đại lý chính hãng */}
                <div
                  className="floating-badge-2 position-absolute bottom-0 end-0 bg-white p-3 rounded-4 shadow-lg border d-none d-md-flex align-items-center gap-3"
                  style={{ marginBottom: "-15px", marginRight: "15px", zIndex: 5 }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white shadow"
                    style={{ width: "48px", height: "48px", backgroundColor: "#16a34a" }}
                  >
                    <i className="bi bi-patch-check-fill fs-4"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                      100% Hàng Chính Hãng
                    </div>
                    <div className="text-secondary small" style={{ fontSize: "0.8rem" }}>
                      Philips • Cadivi • Bình Minh • Panasonic
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          TẦNG 2: CON SỐ BIẾT NÓI (TRUST METRICS BAR VỚI HIỆU ỨNG SỐ NHẢY)
          ================================================================= */}
      <section className="py-4 py-md-5 stats-bar-navy text-white">
        <div className="container">
          <div className="row g-3 text-center">
            {/* Cột 1: 20+ Năm */}
            <div className="col-6 col-lg-3 border-end border-white border-opacity-10">
              <div className="stat-item-box">
                <i className="bi bi-award-fill fs-2 mb-2 d-block" style={{ color: "#38bdf8" }}></i>
                <div className="display-6 fw-bold mb-1 stat-number-glow text-white">
                  <NumberCounter target={20} suffix="+" />
                </div>
                <div className="fw-bold text-white mb-1" style={{ fontSize: "1rem" }}>
                  Năm Kinh Nghiệm
                </div>
                <div className="text-white-50 small" style={{ fontSize: "0.82rem" }}>
                  Phục vụ Bình Thạnh từ 2004
                </div>
              </div>
            </div>

            {/* Cột 2: 400+ Mặt hàng */}
            <div className="col-6 col-lg-3 border-end-lg border-white border-opacity-10">
              <div className="stat-item-box">
                <i className="bi bi-boxes fs-2 mb-2 d-block" style={{ color: "#facc15" }}></i>
                <div className="display-6 fw-bold mb-1 stat-number-glow text-white">
                  <NumberCounter target={400} suffix="+" />
                </div>
                <div className="fw-bold text-white mb-1" style={{ fontSize: "1rem" }}>
                  Mặt Hàng Sẵn Kho
                </div>
                <div className="text-white-50 small" style={{ fontSize: "0.82rem" }}>
                  Đầy đủ điện, nước, kim khí
                </div>
              </div>
            </div>

            {/* Cột 3: 100% Chính hãng */}
            <div className="col-6 col-lg-3 border-end border-white border-opacity-10">
              <div className="stat-item-box">
                <i className="bi bi-shield-check fs-2 mb-2 d-block" style={{ color: "#4ade80" }}></i>
                <div className="display-6 fw-bold mb-1 stat-number-glow text-white">
                  <NumberCounter target={100} suffix="%" />
                </div>
                <div className="fw-bold text-white mb-1" style={{ fontSize: "1rem" }}>
                  Chuẩn Chính Hãng
                </div>
                <div className="text-white-50 small" style={{ fontSize: "0.82rem" }}>
                  Nói không với hàng giả, hàng nhái
                </div>
              </div>
            </div>

            {/* Cột 4: 15 Phút Báo Giá */}
            <div className="col-6 col-lg-3">
              <div className="stat-item-box">
                <i className="bi bi-stopwatch-fill fs-2 mb-2 d-block" style={{ color: "#fb923c" }}></i>
                <div className="display-6 fw-bold mb-1 stat-number-glow text-white">
                  <NumberCounter target={15} suffix=" Phút" />
                </div>
                <div className="fw-bold text-white mb-1" style={{ fontSize: "1rem" }}>
                  Báo Giá Nhanh Zalo
                </div>
                <div className="text-white-50 small" style={{ fontSize: "0.82rem" }}>
                  Giao nhanh trong ngày HCM
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          TẦNG 3: BĂNG CHUYỀN THƯƠNG HIỆU VÔ TẬN (INFINITE BRAND MARQUEE)
          ================================================================= */}
      <section className="py-4 border-bottom bg-white">
        <div className="container mb-3 text-center">
          <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.85rem", letterSpacing: "1.8px" }}>
            ⭐ Phân Phối Trực Tiếp Các Thương Hiệu Đầu Ngành Điện – Nước
          </span>
        </div>

        <div className="brand-marquee-container py-2">
          <div className="brand-marquee-track gap-3 px-3">
            {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, idx) => (
              <div
                key={idx}
                className="brand-card-premium rounded-3 px-4 py-3 d-flex align-items-center gap-3"
                style={{ minWidth: "250px" }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
                  style={{ width: "38px", height: "38px", backgroundColor: brand.color, flexShrink: 0 }}
                >
                  <i className="bi bi-check2 fs-5"></i>
                </div>
                <div>
                  <div className="fw-bolder" style={{ color: "var(--brand-navy)", fontSize: "1.02rem" }}>
                    {brand.name}
                  </div>
                  <div className="text-muted small" style={{ fontSize: "0.78rem" }}>
                    {brand.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================
          TẦNG 4: BENTO GRID ĐA SẮC MÀU (THOÁT KHỎI ĐƠN SẮC TRẮNG)
          ================================================================= */}
      <section className="py-5 fade-in-section" style={{ backgroundColor: "#f8fafd" }}>
        <div className="container py-lg-4">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: "750px" }}>
            <span
              className="badge px-3 py-2 rounded-pill mb-2 fw-bold text-uppercase shadow-sm"
              style={{ backgroundColor: "#e0f2fe", color: "#0369a1", letterSpacing: "1px" }}
            >
              Hệ Sinh Thái & Giá Trị Cốt Lõi
            </span>
            <h2 className="display-6 fw-bolder mb-3 text-contrast-dark">
              Vì Sao Khách Hàng Chọn Trường Tín Suốt 20 Năm?
            </h2>
            <p className="lead text-contrast-body fs-6" style={{ lineHeight: 1.7 }}>
              Không chỉ bán một món đồ, chúng tôi mang đến sự an tâm tuyệt đối về chất lượng, đúng thông số kỹ thuật và mức giá công bằng cho mọi nhà.
            </p>
          </div>

          {/* Lưới Bento Grid 4 Thẻ Đa Sắc Màu */}
          <div className="row g-4">
            {/* THẺ 1: HERO BENTO (Xanh Dương Tươi Sáng) - Mua lẻ giá tốt như sỉ */}
            <div className="col-lg-8">
              <div className="bento-card-color bento-blue h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="rounded-3 d-inline-flex align-items-center justify-content-center shadow-sm"
                      style={{ width: "58px", height: "58px", backgroundColor: "#0078d4", color: "#ffffff" }}
                    >
                      <i className="bi bi-heart-pulse-fill fs-3"></i>
                    </div>
                    <span className="badge bg-primary text-white px-3 py-2 rounded-pill fw-bold shadow-sm">
                      Dành Cho Mọi Gia Đình
                    </span>
                  </div>

                  <h3 className="fw-bolder mb-3 text-contrast-dark" style={{ fontSize: "1.45rem" }}>
                    Mua Lẻ 1 Món Vẫn Giá Tốt – Hướng Dẫn Lắp Đặt Tận Tình
                  </h3>

                  <p className="text-contrast-body mb-4" style={{ fontSize: "1.02rem", lineHeight: 1.75 }}>
                    Dù bạn là chủ nhà chỉ ghé tiệm mua một chiếc bóng đèn LED, một cuộn băng keo non, hay vài cái co nối ống nước, đội ngũ Trường Tín luôn niềm nở đón tiếp. Chúng tôi tư vấn cặn kẽ cách tự lắp đặt tại nhà, giải thích rõ kích cỡ ren để bạn không phải đi đổi nhiều lần, và cam kết bán đúng giá niêm yết minh bạch.
                  </p>
                </div>

                {/* Các mẫu vật tư thật đính kèm trực quan */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top border-primary border-opacity-25">
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-white text-primary border border-primary border-opacity-25 fw-bold px-3 py-2 rounded-pill">
                      #KháchLẻGiaĐình
                    </span>
                    <span className="badge bg-white text-primary border border-primary border-opacity-25 fw-bold px-3 py-2 rounded-pill">
                      #TưVấnMiễnPhí
                    </span>
                    <span className="badge bg-white text-primary border border-primary border-opacity-25 fw-bold px-3 py-2 rounded-pill">
                      #BánĐúngGiá
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className="product-chip-preview d-flex align-items-center gap-2">
                      <Image src="/images/cadivi.png" alt="Dây điện Cadivi" width={28} height={28} className="object-fit-contain" />
                      <span className="fw-bold small text-dark">Cadivi sẵn hàng</span>
                    </div>
                    <div className="product-chip-preview d-flex align-items-center gap-2">
                      <Image src="/images/co-21.webp" alt="Phụ kiện ống nước" width={24} height={24} className="object-fit-contain" />
                      <span className="fw-bold small text-dark">Co ren PVC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* THẺ 2: (Cam Nhiệt Huyết) - 400+ Mặt hàng sẵn kho */}
            <div className="col-lg-4">
              <div className="bento-card-color bento-orange h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="rounded-3 d-inline-flex align-items-center justify-content-center shadow-sm"
                      style={{ width: "54px", height: "54px", backgroundColor: "#ff6b00", color: "#ffffff" }}
                    >
                      <i className="bi bi-lightning-charge-fill fs-3"></i>
                    </div>
                    <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold shadow-sm">
                      Sẵn Kho 358 Nơ Trang Long
                    </span>
                  </div>

                  <h4 className="fw-bolder mb-3 text-contrast-dark" style={{ fontSize: "1.3rem" }}>
                    400+ Danh Mục Hàng Có Sẵn Tại Tiệm
                  </h4>

                  <p className="text-contrast-body mb-4" style={{ fontSize: "0.98rem", lineHeight: 1.7 }}>
                    Kho hàng luôn trữ sẵn đầy đủ dây cáp Cadivi, ống nước Bình Minh, thiết bị Panasonic, MPE, Philips, keo Apollo, bình xịt RP7... Thợ hoặc chủ nhà ghé tiệm là lấy liền trong 5 phút không cần đợi đặt hàng.
                  </p>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-3 border-top border-warning border-opacity-50">
                  <span className="badge bg-white text-danger border border-warning fw-bold px-3 py-2 rounded-pill">
                    #GhéLấyLiền5Phút
                  </span>
                  <div className="product-chip-preview d-flex align-items-center gap-2">
                    <Image src="/images/rp7.png" alt="RP7 xịt rỉ sét" width={22} height={22} className="object-fit-contain" />
                    <span className="fw-bold small text-dark">RP7 chính hãng</span>
                  </div>
                </div>
              </div>
            </div>

            {/* THẺ 3: (Xanh Lá Thịnh Vượng) - Đồng hành cùng thợ */}
            <div className="col-lg-4">
              <div className="bento-card-color bento-green h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="rounded-3 d-inline-flex align-items-center justify-content-center shadow-sm"
                      style={{ width: "54px", height: "54px", backgroundColor: "#16a34a", color: "#ffffff" }}
                    >
                      <i className="bi bi-tools fs-3"></i>
                    </div>
                    <span className="badge bg-success text-white px-3 py-2 rounded-pill fw-bold shadow-sm">
                      Đổi Trả 7 Ngày
                    </span>
                  </div>

                  <h4 className="fw-bolder mb-3 text-contrast-dark" style={{ fontSize: "1.3rem" }}>
                    Đồng Hành Cùng Thợ & Chủ Nhà Sửa Chữa
                  </h4>

                  <p className="text-contrast-body mb-4" style={{ fontSize: "0.98rem", lineHeight: 1.7 }}>
                    Chính sách chiết khấu tốt và công khai cho anh em thợ điện nước và gia đình đang cải tạo nhà. Yên tâm mua sắm vì Trường Tín hỗ trợ đổi trả linh hoạt trong vòng 7 ngày nếu thừa vật tư hoặc mua nhầm kích cỡ.
                  </p>
                </div>

                <div className="d-flex flex-wrap gap-2 pt-3 border-top border-success border-opacity-25">
                  <span className="badge bg-white text-success border border-success border-opacity-50 fw-bold px-3 py-2 rounded-pill">
                    #ChiếtKhấuThợTốt
                  </span>
                  <span className="badge bg-white text-success border border-success border-opacity-50 fw-bold px-3 py-2 rounded-pill">
                    #YênTâmSửaNhà
                  </span>
                </div>
              </div>
            </div>

            {/* THẺ 4: (Deep Navy Vững Vàng) - Bắt đúng bệnh, 20 năm kỹ thuật */}
            <div className="col-lg-8">
              <div className="bento-card-color bento-navy h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div
                      className="rounded-3 d-inline-flex align-items-center justify-content-center shadow-sm"
                      style={{ width: "58px", height: "58px", backgroundColor: "rgba(56, 189, 248, 0.2)", color: "#38bdf8" }}
                    >
                      <i className="bi bi-award-fill fs-3"></i>
                    </div>
                    <span className="badge bg-info text-dark px-3 py-2 rounded-pill fw-bold shadow-sm">
                      Kinh Nghiệm Thực Tế 20 Năm
                    </span>
                  </div>

                  <h3 className="fw-bolder mb-3 text-white" style={{ fontSize: "1.45rem" }}>
                    Bắt Đúng Bệnh – Chuẩn Thông Số – Tránh Lãng Phí
                  </h3>

                  <p className="text-white-50 mb-4" style={{ fontSize: "1.02rem", lineHeight: 1.75 }}>
                    Khách hàng thường mang món đồ hỏng đến hoặc gửi ảnh qua Zalo hỏi: <em>&ldquo;Nhà tôi hư cái này, thay loại nào vừa?&rdquo;</em>. Bằng chuyên môn và kinh nghiệm 20 năm gắn bó với nghề, chúng tôi nhận diện ngay quy cách ống ren, cỡ dây điện chịu tải phù hợp để bạn mua đúng một lần, dùng bền cả chục năm mà không bị lãng phí.
                  </p>
                </div>

                <div className="d-flex flex-wrap gap-2 pt-3 border-top border-white border-opacity-20">
                  <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 fw-semibold px-3 py-2 rounded-pill">
                    #ChuẩnKỹThuật
                  </span>
                  <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 fw-semibold px-3 py-2 rounded-pill">
                    #AnToànĐiệnNước
                  </span>
                  <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 fw-semibold px-3 py-2 rounded-pill">
                    #KhôngVẽVờiPhátSinh
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          TẦNG 5: ⭐ 4 BƯỚC ACCORDION EXPANDER (LIA CHUỘT PHÓNG TO CARD + TO CHỮ CỰC RÕ)
          ================================================================= */}
      <section className="py-5 fade-in-section" style={{ backgroundColor: "#ffffff" }}>
        <div className="container py-lg-4">
          <div className="row align-items-center mb-5">
            <div className="col-lg-7">
              <span
                className="badge px-3 py-2 rounded-pill mb-2 fw-bold text-uppercase shadow-sm"
                style={{ backgroundColor: "#dbeafe", color: "#0078d4" }}
              >
                Tiện Lợi Siêu Tốc
              </span>
              <h2 className="display-6 fw-bolder mb-2 text-contrast-dark">
                4 Bước Mua Hàng & Báo Giá Nhanh Qua Zalo
              </h2>
              <p className="lead text-contrast-body fs-6 mb-0">
                Không cần nhớ tên kỹ thuật phức tạp! Chỉ cần chụp hình món đồ cũ hoặc toa viết tay, Trường Tín sẽ lên báo giá chuẩn cho bạn ngay.
              </p>
            </div>

            <div className="col-lg-5 text-lg-end mt-4 mt-lg-0">
              <a
                href="https://zalo.me/0903989096"
                target="_blank"
                rel="noreferrer"
                className="btn btn-pulse-v2 btn-lg px-4 py-3 fw-bold rounded-pill text-white shadow d-inline-flex align-items-center gap-2"
                style={{ backgroundColor: "var(--brand-zalo)" }}
              >
                <i className="bi bi-chat-dots-fill fs-5"></i>
                <span>Gửi Ảnh Qua Zalo: 0903 989 096</span>
              </a>
            </div>
          </div>

          {/* CỤM ACCORDION 4 BƯỚC: RÊ CHUỘT VÀO BƯỚC NÀO, BƯỚC ĐÓ PHÓNG TO CARD (FLEX: 2.2) VÀ TO CẢ CHỮ */}
          <div className="steps-expand-wrapper">
            <div className="steps-expand-container">
              {[
                {
                  step: "01",
                  title: "Chụp Ảnh / Gửi Toa",
                  desc: "Chụp lại món đồ cũ bị hỏng, thông số nhãn hiệu, hoặc toa viết tay của thợ rồi gửi qua Zalo 0903 989 096.",
                  extra: "Không cần nhớ tên gọi chuyên môn, nhìn hình tiệm báo đúng món liền!",
                  icon: "bi-camera-fill",
                  color: "#0078d4",
                  badgeBg: "#ebf5ff",
                },
                {
                  step: "02",
                  title: "Tư Vấn & Báo Giá",
                  desc: "Nhân viên kiểm tra quy cách ren, kích cỡ ống, công suất điện và gửi báo giá chi tiết trong vòng 15 phút.",
                  extra: "Tư vấn đúng bệnh, đúng kích thước, cam kết giá sỉ & lẻ minh bạch.",
                  icon: "bi-receipt-cutoff",
                  color: "#ff6b00",
                  badgeBg: "#fff7ed",
                },
                {
                  step: "03",
                  title: "Soạn Đủ Vật Tư",
                  desc: "Kho kiểm đếm chính xác từng mét dây điện, từng chiếc co nối PVC, đóng gói kỹ càng sẵn sàng giao.",
                  extra: "Hàng sẵn kho tại 358 Nơ Trang Long, luôn kiểm hàng cẩn thận trước khi gửi.",
                  icon: "bi-box-seam-fill",
                  color: "#16a34a",
                  badgeBg: "#f0fdf4",
                },
                {
                  step: "04",
                  title: "Giao Liền Trong Ngày",
                  desc: "Ghé trực tiếp 358 Nơ Trang Long lấy ngay không cần chờ, hoặc cửa hàng gọi xe giao tận nhà trong ngày.",
                  extra: "Hỗ trợ ship nhanh khu vực Bình Thạnh, Thủ Đức & các quận lân cận HCM.",
                  icon: "bi-lightning-charge-fill",
                  color: "#0078d4",
                  badgeBg: "#ebf5ff",
                },
              ].map((s, idx) => (
                <div
                  className={`step-expand-item shadow-sm ${hoveredStep === idx ? "active-expanded" : ""}`}
                  key={idx}
                  onMouseEnter={() => setHoveredStep(idx)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div
                        className="step-expand-badge rounded-circle d-flex align-items-center justify-content-center fw-bolder shadow-sm"
                        style={{
                          backgroundColor: s.badgeBg,
                          color: s.color,
                          border: `2px solid ${s.color}40`,
                        }}
                      >
                        {s.step}
                      </div>
                      <i className={`step-expand-icon bi ${s.icon}`} style={{ color: s.color }}></i>
                    </div>

                    <h5 className="step-expand-title mb-2">
                      {s.title}
                    </h5>

                    <p className="step-expand-desc mb-2">
                      {s.desc}
                    </p>
                  </div>

                  <div className="step-full-details pt-2 border-top border-light">
                    <span className="fw-bold" style={{ color: s.color }}>
                      💡 {s.extra}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          TẦNG MỚI: FORM NHẬN ƯU ĐÃI & BÁO GIÁ SỈ (LEAD CAPTURE FORM)
          ================================================================= */}
      {/* =================================================================
          TẦNG MỚI: FORM NHẬN ƯU ĐÃI & BÁO GIÁ SỈ (COMPACT & TIẾT KIỆM DIỆN TÍCH)
          ================================================================= */}
      <section className="py-4 py-md-5 fade-in-section" style={{ backgroundColor: "#f8fafc" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8 col-xl-7">
              <div className="promo-form-card p-3 p-md-4">
                {/* Header rút gọn */}
                <div className="text-center mb-3">
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 rounded-pill fw-bold small mb-2 d-inline-flex align-items-center gap-1">
                    <i className="bi bi-gift-fill"></i> Ưu Đãi Độc Quyền
                  </span>
                  <h4 className="fw-bolder mb-1 text-contrast-dark" style={{ fontSize: "1.35rem" }}>
                    Đăng Ký Nhận Mã Giảm Giá 5% & Báo Giá Sỉ
                  </h4>
                  <p className="text-muted small mb-0" style={{ fontSize: "0.85rem" }}>
                    Dành riêng cho khách mua lẻ và anh em thợ điện nước lần đầu liên hệ với Trường Tín.
                  </p>
                </div>

                {voucherReceived ? (
                  /* KHỐI HIỂN THỊ MÃ VOUCHER KHI ĐĂNG KÝ THÀNH CÔNG (COMPACT) */
                  <div className="bg-white p-3 p-md-4 rounded-4 border border-primary text-center shadow-sm">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-2"
                      style={{ width: "42px", height: "42px" }}
                    >
                      <i className="bi bi-check2-all fs-4"></i>
                    </div>
                    <h5 className="fw-bolder text-dark mb-1">Chúc Mừng Bạn Đã Đăng Ký Thành Công!</h5>
                    <p className="text-muted small mb-2">Mã ưu đãi 5% cho đơn hàng đầu tiên của bạn là:</p>

                    <div className="p-2 bg-light rounded-3 border border-dashed border-primary mb-2 d-inline-flex align-items-center gap-2 px-3">
                      <span className="fs-4 fw-bolder text-danger mb-0" style={{ letterSpacing: "1.5px" }}>
                        {voucherReceived}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm fw-bold px-2.5 py-1 rounded-pill"
                        onClick={() => {
                          navigator.clipboard.writeText(voucherReceived);
                          toast.success("Đã copy mã voucher!");
                        }}
                      >
                        <i className="bi bi-clipboard me-1"></i> Copy
                      </button>
                    </div>

                    <p className="text-muted small mb-3" style={{ fontSize: "0.82rem" }}>
                      Đọc mã này khi ghé tiệm tại <strong>358 Nơ Trang Long</strong> hoặc nhắn Zalo để được giảm ngay.
                    </p>

                    <div className="d-flex justify-content-center">
                      <a
                        href={`https://zalo.me/0903989096?text=${encodeURIComponent(
                          `Chào Trường Tín, tôi vừa nhận được mã ưu đãi ${voucherReceived}, tư vấn giúp tôi toa hàng này nhé!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm fw-bold px-4 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-2"
                        style={{ backgroundColor: "#0068ff" }}
                      >
                        <i className="bi bi-chat-dots-fill"></i>
                        <span>Mở Zalo Nhận Báo Giá Ngay</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  /* FORM ĐIỀN THÔNG TIN (COMPACT GỌN GÀNG) */
                  <form onSubmit={handlePromoSubmit} className="bg-white p-3 p-md-3 rounded-3 shadow-sm border">
                    {/* Chọn vai trò gọn gàng */}
                    <div className="d-flex align-items-center justify-content-center flex-wrap gap-1.5 mb-2.5">
                      <span className="small text-muted fw-semibold me-1" style={{ fontSize: "0.8rem" }}>
                        Bạn là:
                      </span>
                      {["Khách lẻ sửa nhà", "Thợ điện nước / Lạnh", "Chủ thầu"].map((role) => (
                        <button
                          key={role}
                          type="button"
                          className={`role-chip-btn ${promoRole === role ? "active" : ""}`}
                          onClick={() => setPromoRole(role)}
                        >
                          {role}
                        </button>
                      ))}
                    </div>

                    {/* Họ tên & SĐT trên cùng 1 hàng */}
                    <div className="row g-2 mb-2">
                      <div className="col-sm-6">
                        <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: "0.82rem" }}>
                          Họ và tên <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm promo-input"
                          placeholder="Ví dụ: Anh Tuấn, Chị Lan..."
                          value={promoName}
                          onChange={(e) => setPromoName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-bold text-dark mb-1" style={{ fontSize: "0.82rem" }}>
                          Số điện thoại / Zalo <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-sm promo-input"
                          placeholder="Nhập SĐT nhận mã..."
                          value={promoPhone}
                          onChange={(e) => setPromoPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Ghi chú gọn */}
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control form-control-sm promo-input"
                        placeholder="Vật tư bạn đang quan tâm (Cadivi, Bình Minh, Sino, Panasonic...)"
                        value={promoNote}
                        onChange={(e) => setPromoNote(e.target.value)}
                      />
                    </div>

                    {/* Nút gửi form nhỏ gọn, hẹp vừa phải, căn giữa */}
                    <div className="text-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-brand-primary-v2 btn-pulse-v2 px-4 py-2 rounded-pill fw-bold small d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
                        style={{ minWidth: "220px" }}
                      >
                        {isSubmitting ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="bi bi-gift-fill"></i>
                        )}
                        <span>{isSubmitting ? "Đang gửi..." : "Nhận Mã Giảm 5% Ngay"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          TẦNG 6: CTA BANNER & THÔNG TIN CỬA HÀNG (SỬA LỖI MÀU NHẠT CHÌM CHỮ)
          NỀN DEEP NAVY #071322 SIÊU TƯƠNG PHẢN - CHỮ TRẮNG BẠC RÕ RÀNG 100%
          ================================================================= */}
      <section className="py-5 fade-in-section">
        <div className="container py-lg-3">
          <div className="blueprint-cta-v2 rounded-4 p-4 p-md-5 position-relative overflow-hidden shadow-xl">
            <div className="row align-items-center g-4 position-relative z-2">
              <div className="col-lg-8">
                <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3 d-inline-flex align-items-center gap-1 shadow-sm">
                  <i className="bi bi-clock-history"></i> Mở cửa xuyên suốt Thứ 2 – Chủ Nhật (7h00 - 18h30)
                </span>

                <h2 className="display-6 mb-3 cta-heading-contrast">
                  Bạn Cần Mua Vật Tư Sửa Nhà Hay Hoàn Thiện Công Trình?
                </h2>

                <p className="cta-desc-contrast mb-4">
                  Đừng ngần ngại gọi điện hoặc nhắn tin Zalo cho Trường Tín. Chúng tôi luôn sẵn sàng kiểm kho, tư vấn giải pháp kỹ thuật tốt nhất và báo giá cạnh tranh cho bạn!
                </p>

                {/* Thông tin trực quan cửa hàng - Đậm nét, tương phản tối đa */}
                <div className="d-flex flex-column flex-sm-row gap-4 pt-2 border-top border-white border-opacity-10">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-geo-alt-fill text-danger fs-5"></i>
                    <span className="cta-info-contrast">
                      <strong className="text-white">Địa chỉ:</strong> 358 Nơ Trang Long, P.13, Bình Thạnh, TP.HCM
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-telephone-fill text-warning fs-5"></i>
                    <span className="cta-info-contrast">
                      <strong className="text-white">Hotline:</strong> 0903 989 096 (Mr. Tín)
                    </span>
                  </div>
                </div>
              </div>

              {/* Các nút gọi & chat */}
              <div className="col-lg-4 text-lg-end d-flex flex-column gap-3 justify-content-lg-end">
                <a
                  href="tel:0903989096"
                  className="btn btn-light btn-lg fw-bolder px-4 py-3 rounded-3 shadow text-dark d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="bi bi-telephone-outbound-fill text-danger fs-5"></i>
                  <span>Gọi Ngay: 0903 989 096</span>
                </a>

                <a
                  href="https://zalo.me/0903989096"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-brand-primary-v2 btn-pulse-v2 btn-lg fw-bold px-4 py-3 rounded-3 text-white d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="bi bi-chat-dots-fill fs-5"></i>
                  <span>Nhận Báo Giá Qua Zalo</span>
                </a>

                <a
                  href="https://maps.google.com/?q=358+Nơ+Trang+Long,+Phường+13,+Bình+Thạnh,+Hồ+Chí+Minh"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-light px-4 py-2 rounded-3 small fw-semibold d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="bi bi-map-fill"></i>
                  <span>Xem Bản Đồ Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
