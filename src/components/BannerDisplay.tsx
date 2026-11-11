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

// Bộ nhớ đệm Client: Tránh chớp trắng khi người dùng chuyển trang quay lại
const bannerCache: Record<string, Banner[]> = {};

export default function BannerDisplay({ position }: { position: BannerPosition }) {
  const cachedData = bannerCache[position];
  const [banners, setBanners] = useState<Banner[]>(cachedData || []);
  const [loading, setLoading] = useState<boolean>(!cachedData);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Tự động chuyển slide mỗi 3 giây nếu có nhiều hơn 1 banner
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (banners.length || 1));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(goNext, 3000);
    return () => clearInterval(interval);
  }, [banners.length, goNext]);

  // 1. Trạng thái Loading: Hiển thị Skeleton khớp đúng chiều cao gốc
  if (loading && banners.length === 0) {
    return (
      <div className="container-fluid px-0 mb-4">
        <div className="placeholder-glow rounded-4 shadow-sm w-100 banner-container">
          <div className="placeholder w-100 h-100 rounded-4" style={{ backgroundColor: "#e2e8f0" }}></div>
        </div>
        <style jsx>{`
          .banner-container {
            height: ${position.includes("HOME_SUB") ? "120px" : "150px"};
          }
          @media (min-width: 768px) {
            .banner-container {
              height: ${position.includes("HOME_SUB") ? "180px" : "300px"};
            }
          }
          @media (min-width: 992px) {
            .banner-container {
              height: ${position.includes("HOME_SUB") ? "220px" : "400px"};
            }
          }
        `}</style>
      </div>
    );
  }

  // 2. Nếu không có banner nào hoạt động: Hiển thị banner cứng mặc định cho 2 khối phụ
  if (banners.length === 0) {
    if (position === "HOME_SUB_LEFT") {
      return (
        <div
          className="rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end position-relative overflow-hidden mb-4 h-100 banner-container"
          style={{ minHeight: "200px", backgroundColor: "#0078D4" }}
        >
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4))",
              zIndex: 1,
            }}
          ></div>
          <div style={{ zIndex: 2 }}>
            <h3 className="fw-bold mb-1" style={{ letterSpacing: "0.5px" }}>
              ỐNG NHỰA BÌNH MINH
            </h3>
            <p className="mb-0 fw-medium">Đầy đủ kích cỡ Φ21 - Φ200</p>
          </div>
          <style jsx>{`
            .banner-container {
              height: 120px;
            }
            @media (min-width: 768px) {
              .banner-container {
                height: 180px;
              }
            }
            @media (min-width: 992px) {
              .banner-container {
                height: 220px;
              }
            }
          `}</style>
        </div>
      );
    }
    if (position === "HOME_SUB_RIGHT") {
      return (
        <div
          className="rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end position-relative overflow-hidden mb-4 h-100 banner-container"
          style={{ minHeight: "200px", backgroundColor: "#005a9e" }}
        >
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4))",
              zIndex: 1,
            }}
          ></div>
          <div style={{ zIndex: 2 }}>
            <h3 className="fw-bold mb-1" style={{ letterSpacing: "0.5px" }}>
              DÂY ĐIỆN CADIVI
            </h3>
            <p className="mb-0 fw-medium">Chiết khấu cao cho nhà thầu</p>
          </div>
          <style jsx>{`
            .banner-container {
              height: 120px;
            }
            @media (min-width: 768px) {
              .banner-container {
                height: 180px;
              }
            }
            @media (min-width: 992px) {
              .banner-container {
                height: 220px;
              }
            }
          `}</style>
        </div>
      );
    }
    return null;
  }

  // ID duy nhất cho mỗi position để tránh xung đột Bootstrap
  const carouselId = `bannerCarousel-${position}`;

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

        {/* Danh sách Hình ảnh Banner */}
        <div className="carousel-inner">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`carousel-item ${index === currentIndex ? "active" : ""}`}
            >
              <div className="position-relative w-100 banner-container">
                {banner.link ? (
                  <a
                    href={banner.link}
                    target="_blank"
                    rel="noreferrer"
                    className="d-block w-100 h-100 position-relative"
                  >
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
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + banners.length) % banners.length
                )
              }
              style={{ width: "6%" }}
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
              style={{ width: "6%" }}
            >
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </>
        )}
      </div>

      {/* Style tùy chỉnh cho chiều cao Responsive của Banner chuẩn kích thước ban đầu */}
      <style jsx>{`
        .banner-container {
          height: ${position.includes("HOME_SUB") ? "120px" : "150px"};
        }
        @media (min-width: 768px) {
          .banner-container {
            height: ${position.includes("HOME_SUB") ? "180px" : "300px"};
          }
        }
        @media (min-width: 992px) {
          .banner-container {
            height: ${position.includes("HOME_SUB") ? "220px" : "400px"};
          }
        }
      `}</style>
    </div>
  );
}
