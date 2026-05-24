"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import api from "@/lib/axios";

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
}

type BannerPosition = "HOME_MAIN" | "HOME_SUB_LEFT" | "HOME_SUB_RIGHT";

export default function BannerDisplay({ position }: { position: BannerPosition }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchActiveBanners = async () => {
      try {
        const res = await api.get(`/api/banners/active?position=${position}`);
        if (res.data.success) {
          setBanners(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi tải banner trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveBanners();
  }, [position]);

  // Auto-slide mỗi 3 giây nếu có nhiều hơn 1 banner
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(goNext, 3000);
    return () => clearInterval(interval);
  }, [banners.length, goNext]);

  // 1. Trạng thái Loading: Hiển thị Skeleton
  if (loading) {
    return (
      <div className="container-fluid px-0 mb-4">
        <div
          className="placeholder-glow rounded-4 shadow-sm w-100"
          style={{ height: "300px" }}
        >
          <div className="placeholder w-100 h-100 rounded-4"></div>
        </div>
      </div>
    );
  }

  // 2. Nếu không có banner nào hoạt động: Ẩn hoàn toàn component hoặc hiển thị banner cứng mặc định
  if (banners.length === 0) {
    if (position === "HOME_SUB_LEFT") {
      return (
        <div className="rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end position-relative overflow-hidden mb-4 h-100"
             style={{ minHeight: '200px', backgroundColor: '#0078D4' }}>
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4))', zIndex: 1 }}></div>
          <div style={{ zIndex: 2 }}>
            <h3 className="fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>ỐNG NHỰA BÌNH MINH</h3>
            <p className="mb-0 fw-medium">Đầy đủ kích cỡ Φ21 - Φ200</p>
          </div>
        </div>
      );
    }
    if (position === "HOME_SUB_RIGHT") {
      return (
        <div className="rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end position-relative overflow-hidden mb-4 h-100"
             style={{ minHeight: '200px', backgroundColor: '#005a9e' }}>
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4))', zIndex: 1 }}></div>
          <div style={{ zIndex: 2 }}>
            <h3 className="fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>DÂY ĐIỆN CADIVI</h3>
            <p className="mb-0 fw-medium">Chiết khấu cao cho nhà thầu</p>
          </div>
        </div>
      );
    }
    return null;
  }
  // ID duy nhất cho mỗi position để tránh xung đột Bootstrap
  const carouselId = `bannerCarousel-${position}`;

  // 3. Render Carousel (giữ nguyên cấu trúc HTML Bootstrap cũ)
  return (
    <div className="container-fluid px-0 mb-4">
      <div
        id={carouselId}
        className="carousel slide shadow-sm rounded-4 overflow-hidden"
        data-bs-ride="carousel"
        data-bs-interval="3000"
      >
        {/* Indicators (Các dấu chấm nhảy trang) */}
        {banners.length > 1 && (
          <div className="carousel-indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                data-bs-target={`#${carouselId}`}
                data-bs-slide-to={index}
                className={index === currentIndex ? "active" : ""}
                aria-current={index === currentIndex ? "true" : "false"}
                aria-label={`Slide ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
              ></button>
            ))}
          </div>
        )}

        {/* Danh sách Hình ảnh */}
        <div className="carousel-inner">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`carousel-item ${index === currentIndex ? "active" : ""}`}
            >
              {/* Vùng chứa ảnh với style Responsive */}
              <div className="position-relative w-100 banner-container">
                {banner.link ? (
                  <a href={banner.link} target="_blank" rel="noreferrer" className="d-block w-100 h-100">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      priority={index === 0}
                      className="d-block w-100"
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </a>
                ) : (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    priority={index === 0}
                    className="d-block w-100"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nút Điều hướng (Trái / Phải) */}
        {banners.length > 1 && (
          <>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide="prev"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            >
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide="next"
              onClick={() => goNext()}
            >
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </>
        )}
      </div>

      {/* Style tùy chỉnh cho chiều cao Responsive của Banner */}
      <style jsx>{`
        .banner-container {
          height: ${position.includes('HOME_SUB') ? '120px' : '150px'};
        }
        @media (min-width: 768px) {
          .banner-container {
            height: ${position.includes('HOME_SUB') ? '180px' : '300px'};
          }
        }
        @media (min-width: 992px) {
          .banner-container {
            height: ${position.includes('HOME_SUB') ? '220px' : '400px'};
          }
        }
      `}</style>
    </div>
  );
}
