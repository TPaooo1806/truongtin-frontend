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

// Bộ nhớ đệm Client: Khi người dùng chuyển trang (Giới thiệu -> Trang chủ), banner lấy ngay từ cache mà không bị chớp trắng
const bannerCache: Record<string, Banner[]> = {};

export default function BannerDisplay({ position }: { position: BannerPosition }) {
  const cachedData = bannerCache[position];
  const [banners, setBanners] = useState<Banner[]>(cachedData || []);
  const [loading, setLoading] = useState<boolean>(!cachedData);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isSub = position.includes("HOME_SUB");
  const containerClass = isSub ? "banner-sub-container" : "banner-main-container";

  useEffect(() => {
    let isMounted = true;
    const fetchActiveBanners = async () => {
      try {
        const res = await api.get(`/api/banners/active?position=${position}`);
        if (res.data?.success && isMounted) {
          const freshData: Banner[] = res.data.data || [];
          bannerCache[position] = freshData;
          setBanners(freshData);
        }
      } catch (error) {
        console.error("Lỗi tải banner trang chủ:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActiveBanners();
    return () => {
      isMounted = false;
    };
  }, [position]);

  // Tự động chuyển slide mỗi 3.5 giây nếu có nhiều hơn 1 banner
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (banners.length || 1));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(goNext, 3500);
    return () => clearInterval(interval);
  }, [banners.length, goNext]);

  // 1. Trạng thái Loading: Hiển thị Skeleton khớp chính xác 100% tỷ lệ khung hình với banner thật
  if (loading && banners.length === 0) {
    return (
      <div className="container-fluid px-0 mb-4">
        <div className={`w-100 rounded-4 overflow-hidden placeholder-glow shadow-sm ${containerClass}`}>
          <div className="placeholder w-100 h-100 rounded-4" style={{ backgroundColor: "#e2e8f0" }}></div>
        </div>
        <style jsx>{`
          .banner-main-container {
            width: 100%;
            aspect-ratio: 16 / 9;
          }
          @media (min-width: 768px) {
            .banner-main-container {
              aspect-ratio: 21 / 9;
              max-height: 400px;
            }
          }
          @media (min-width: 1200px) {
            .banner-main-container {
              aspect-ratio: 21 / 8;
              max-height: 420px;
            }
          }
          .banner-sub-container {
            width: 100%;
            aspect-ratio: 16 / 9;
          }
          @media (min-width: 768px) {
            .banner-sub-container {
              aspect-ratio: 2 / 1;
              max-height: 220px;
            }
          }
        `}</style>
      </div>
    );
  }

  // 2. Nếu không có banner nào hoạt động: Hiển thị banner mặc định thương hiệu cho 2 khối phụ
  if (banners.length === 0) {
    if (position === "HOME_SUB_LEFT") {
      return (
        <div className="container-fluid px-0 mb-4">
          <div
            className={`rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end position-relative overflow-hidden ${containerClass}`}
            style={{ backgroundColor: "#0078D4" }}
          >
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.5))",
                zIndex: 1,
              }}
            ></div>
            <div style={{ zIndex: 2 }}>
              <span className="badge bg-white text-primary mb-2 px-2 py-1 fw-bold">CHÍNH HÃNG</span>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "0.5px" }}>ỐNG NHỰA BÌNH MINH</h3>
              <p className="mb-0 fw-medium">Đầy đủ kích cỡ Φ21 - Φ200 • Giá đại lý cấp 1</p>
            </div>
          </div>
          <style jsx>{`
            .banner-sub-container {
              width: 100%;
              aspect-ratio: 16 / 9;
            }
            @media (min-width: 768px) {
              .banner-sub-container {
                aspect-ratio: 2 / 1;
                max-height: 220px;
              }
            }
          `}</style>
        </div>
      );
    }
    if (position === "HOME_SUB_RIGHT") {
      return (
        <div className="container-fluid px-0 mb-4">
          <div
            className={`rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end position-relative overflow-hidden ${containerClass}`}
            style={{ backgroundColor: "#005a9e" }}
          >
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.5))",
                zIndex: 1,
              }}
            ></div>
            <div style={{ zIndex: 2 }}>
              <span className="badge bg-warning text-dark mb-2 px-2 py-1 fw-bold">CHIẾT KHẤU CAO</span>
              <h3 className="fw-bold mb-1" style={{ letterSpacing: "0.5px" }}>DÂY CÁP ĐIỆN CADIVI</h3>
              <p className="mb-0 fw-medium">Dây đôi, dây đơn, cáp ngầm cho thợ & công trình</p>
            </div>
          </div>
          <style jsx>{`
            .banner-sub-container {
              width: 100%;
              aspect-ratio: 16 / 9;
            }
            @media (min-width: 768px) {
              .banner-sub-container {
                aspect-ratio: 2 / 1;
                max-height: 220px;
              }
            }
          `}</style>
        </div>
      );
    }
    return null;
  }

  // ID duy nhất cho mỗi carousel Bootstrap
  const carouselId = `bannerCarousel-${position}`;

  return (
    <div className="container-fluid px-0 mb-4">
      <div
        id={carouselId}
        className="carousel slide shadow-sm rounded-4 overflow-hidden"
        data-bs-ride="carousel"
      >
        {/* Indicators (Các dấu gạch chuyển slide) */}
        {banners.length > 1 && (
          <div className="carousel-indicators mb-2" style={{ zIndex: 5 }}>
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

        {/* Danh sách Hình ảnh Banner với kiến trúc Dual Layer */}
        <div className="carousel-inner">
          {banners.map((banner, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={banner.id}
                className={`carousel-item ${isActive ? "active" : ""}`}
              >
                <div
                  className={`position-relative w-100 overflow-hidden ${containerClass}`}
                  style={{ backgroundColor: "#1e293b" }}
                >
                  {/* LỚP 1: Lớp nền mờ (Backdrop Blur) giải quyết 100% khoảng trống thừa nếu ảnh gốc lệch tỷ lệ */}
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      backgroundImage: `url("${banner.imageUrl}")`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      filter: "blur(20px) brightness(0.65)",
                      transform: "scale(1.15)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />

                  {/* LỚP 2: Lớp ảnh chính (Foreground Contain) đảm bảo logo BM Plasco, chữ, sản phẩm KHÔNG BAO GIỜ bị cắt xén */}
                  <div
                    className="position-relative w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ zIndex: 2 }}
                  >
                    {banner.link ? (
                      <a
                        href={banner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-block w-100 h-100 position-relative"
                        title={banner.title}
                      >
                        <Image
                          src={banner.imageUrl}
                          alt={banner.title || "Banner Điện Nước Trường Tín"}
                          fill
                          priority={index === 0}
                          className="object-fit-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                          unoptimized
                        />
                      </a>
                    ) : (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title || "Banner Điện Nước Trường Tín"}
                        fill
                        priority={index === 0}
                        className="object-fit-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                        unoptimized
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nút Điều hướng Trái / Phải */}
        {banners.length > 1 && (
          <>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target={`#${carouselId}`}
              data-bs-slide="prev"
              onClick={() =>
                setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
              }
              style={{ zIndex: 5, width: "6%" }}
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
              style={{ zIndex: 5, width: "6%" }}
            >
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .banner-main-container {
          width: 100%;
          aspect-ratio: 16 / 9;
        }
        @media (min-width: 768px) {
          .banner-main-container {
            aspect-ratio: 21 / 9;
            max-height: 400px;
          }
        }
        @media (min-width: 1200px) {
          .banner-main-container {
            aspect-ratio: 21 / 8;
            max-height: 420px;
          }
        }

        .banner-sub-container {
          width: 100%;
          aspect-ratio: 16 / 9;
        }
        @media (min-width: 768px) {
          .banner-sub-container {
            aspect-ratio: 2 / 1;
            max-height: 220px;
          }
        }
      `}</style>
    </div>
  );
}
