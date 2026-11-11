"use client";

import { useEffect, useState } from "react";
import { fetchNews } from "@/actions/news";
import type { NewsItem } from "@/data/curated-news";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80";
const LOCAL_FALLBACK = "/images/ongnuoc.png";

export default function DailyNews() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    let isMounted = true;
    const loadNews = async () => {
      try {
        const news = await fetchNews();
        if (isMounted) {
          setNewsList(news);
        }
      } catch (error) {
        console.error("Lỗi tải tin tức cẩm nang:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadNews();
    return () => {
      isMounted = false;
    };
  }, []);

  const nextSlide = () => {
    if (currentIndex + itemsPerPage < newsList.length) {
      setCurrentIndex(currentIndex + itemsPerPage);
    }
  };

  const prevSlide = () => {
    if (currentIndex - itemsPerPage >= 0) {
      setCurrentIndex(currentIndex - itemsPerPage);
    }
  };

  if (loading) {
    return (
      <section className="mb-5 position-relative">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h4
            className="fw-bold mb-0 d-flex align-items-center gap-2 fs-5 fs-md-4"
            style={{ color: "#1a3a5c" }}
          >
            <span
              style={{
                width: "5px",
                height: "22px",
                display: "inline-block",
                backgroundColor: "#0078D4",
                borderRadius: "2px",
              }}
            ></span>
            CẨM NANG ĐIỆN NƯỚC & TIN TỨC TP.HCM
          </h4>
        </div>
        <div className="position-relative">
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="col d-flex align-items-stretch" key={i}>
                <div className="card w-100 h-100 border-0 shadow-sm rounded-4 placeholder-glow">
                  <div className="p-2">
                    <div
                      className="placeholder w-100 rounded-3"
                      style={{ height: "135px", backgroundColor: "#e2e8f0" }}
                    ></div>
                  </div>
                  <div className="card-body pt-1 px-3 pb-3">
                    <h6 className="card-title fw-bold">
                      <span className="placeholder col-12 mb-1"></span>
                      <span className="placeholder col-8"></span>
                    </h6>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (newsList.length === 0) return null;

  const visibleNews = newsList.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="mb-5 position-relative">
      {/* Tiêu đề mục Tin Tức & Cẩm Nang */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
        <div>
          <h4
            className="fw-bold mb-1 d-flex align-items-center gap-2 fs-5 fs-md-4"
            style={{ color: "#1a3a5c" }}
          >
            <span
              style={{
                width: "5px",
                height: "22px",
                display: "inline-block",
                backgroundColor: "#0078D4",
                borderRadius: "2px",
              }}
            ></span>
            CẨM NANG ĐIỆN NƯỚC & TIN TỨC TP.HCM
          </h4>
          <p className="text-muted small mb-0 ps-3 ms-1">
            Sổ tay hướng dẫn tự sửa chữa, an toàn mùa mưa và kinh nghiệm vật tư xây dựng
          </p>
        </div>
      </div>

      <div className="position-relative">
        {/* Nút lùi Slide */}
        {currentIndex > 0 && (
          <button
            className="btn btn-white shadow rounded-circle position-absolute top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center border slider-btn-prev"
            style={{
              width: "42px",
              height: "42px",
              left: "-18px",
              backgroundColor: "rgba(255,255,255,0.95)",
            }}
            onClick={prevSlide}
            aria-label="Xem tin trước"
          >
            <i className="bi bi-chevron-left fs-5"></i>
          </button>
        )}

        {/* Nút tiến Slide */}
        {currentIndex + itemsPerPage < newsList.length && (
          <button
            className="btn btn-white shadow rounded-circle position-absolute top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center border slider-btn-next"
            style={{
              width: "42px",
              height: "42px",
              right: "-18px",
              backgroundColor: "rgba(255,255,255,0.95)",
            }}
            onClick={nextSlide}
            aria-label="Xem tin kế tiếp"
          >
            <i className="bi bi-chevron-right fs-5"></i>
          </button>
        )}

        {/* Lưới danh sách bài viết */}
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-2 g-md-3">
          {visibleNews.map((news, index) => {
            const imageUrl = news.imageUrl || DEFAULT_IMAGE;

            return (
              <div className="col d-flex align-items-stretch" key={index}>
                <div
                  className="card w-100 h-100 bg-white shadow-sm rounded-4 position-relative border transition-all hover-subtle-bg overflow-hidden"
                  style={{ borderColor: "#edf2f7" }}
                >
                  {/* Khung ảnh bài viết */}
                  <div className="p-2 pb-1 position-relative">
                    <div className="position-relative overflow-hidden rounded-3" style={{ height: "135px" }}>
                      <img
                        src={imageUrl}
                        className="w-100 h-100 object-fit-cover transition-all"
                        alt={news.title}
                        loading="lazy"
                        onError={(e) => {
                          // Nếu ảnh bị lỗi 403 hoặc hỏng link, tự động đổi sang ảnh dự phòng sắc nét
                          const target = e.currentTarget as HTMLImageElement;
                          if (target.src !== DEFAULT_IMAGE && !target.src.includes(DEFAULT_IMAGE)) {
                            target.src = DEFAULT_IMAGE;
                          } else if (!target.src.includes("ongnuoc.png")) {
                            target.src = LOCAL_FALLBACK;
                          }
                        }}
                        style={{ backgroundColor: "#f8f9fa" }}
                      />
                      {/* Badge phân loại bài viết */}
                      {news.category && (
                        <span
                          className="position-absolute top-0 start-0 m-2 badge px-2 py-1 shadow-sm"
                          style={{
                            fontSize: "0.68rem",
                            backgroundColor: "rgba(0, 120, 212, 0.9)",
                            backdropFilter: "blur(4px)",
                            fontWeight: 600,
                          }}
                        >
                          {news.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phần thân nội dung bài viết */}
                  <div className="card-body pt-2 px-3 pb-3 d-flex flex-column">
                    <h6
                      className="card-title fw-bold mb-1 text-dark"
                      style={{
                        fontSize: "0.82rem",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      <a
                        href={news.link}
                        target={news.isCurated ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        className="text-decoration-none text-reset stretched-link"
                        title={news.title}
                      >
                        {news.title}
                      </a>
                    </h6>

                    {/* Tóm tắt nội dung ngắn */}
                    {news.description && (
                      <p
                        className="text-muted small mb-0 mt-auto"
                        style={{
                          fontSize: "0.72rem",
                          lineHeight: "1.35",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {news.description.replace(/<[^>]*>?/gm, "")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
