"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/axios";

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
}

export default function BannerDisplay() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveBanners = async () => {
      try {
        const res = await api.get("/api/banners/active");
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
  }, []);

  // 1. Trạng thái Loading: Hiển thị Skeleton
  if (loading) {
    return (
      <div className="container-fluid px-0 mb-4">
        <div 
          className="placeholder-glow rounded-4 shadow-sm w-100"
          style={{ height: "300px" }} // Default height for skeleton
        >
          <div className="placeholder w-100 h-100 rounded-4"></div>
        </div>
      </div>
    );
  }

  // 2. Nếu không có banner nào hoạt động: Ẩn hoàn toàn component
  if (banners.length === 0) {
    return null;
  }

  // 3. Render Carousel
  return (
    <div className="container-fluid px-0 mb-4">
      <div 
        id="homeBannerCarousel" 
        className="carousel slide shadow-sm rounded-4 overflow-hidden" 
        data-bs-ride="carousel"
        data-bs-interval="3000" // Đổi ảnh mỗi 3 giây
      >
        {/* Indicators (Các dấu chấm nhảy trang) */}
        {banners.length > 1 && (
          <div className="carousel-indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                data-bs-target="#homeBannerCarousel"
                data-bs-slide-to={index}
                className={index === 0 ? "active" : ""}
                aria-current={index === 0 ? "true" : "false"}
                aria-label={`Slide ${index + 1}`}
              ></button>
            ))}
          </div>
        )}

        {/* Danh sách Hình ảnh */}
        <div className="carousel-inner">
          {banners.map((banner, index) => (
            <div 
              key={banner.id} 
              className={`carousel-item ${index === 0 ? "active" : ""}`}
            >
              {/* Vùng chứa ảnh với style Responsive */}
              <div 
                className="position-relative w-100 banner-container"
              >
                {banner.link ? (
                  <a href={banner.link} target="_blank" rel="noreferrer" className="d-block w-100 h-100">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      priority={index === 0} // Ưu tiên load ảnh đầu tiên
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
              data-bs-target="#homeBannerCarousel"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#homeBannerCarousel"
              data-bs-slide="next"
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
          height: 150px;
        }
        @media (min-width: 768px) {
          .banner-container {
            height: 300px;
          }
        }
        @media (min-width: 992px) {
          .banner-container {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
}
