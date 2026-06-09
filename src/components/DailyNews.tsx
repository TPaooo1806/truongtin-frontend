"use client";
import { useEffect, useState } from "react";
import { fetchNews } from "@/actions/news";

export default function DailyNews() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadNews = async () => {
      try {
        const news = await fetchNews();
        setNewsList(news);
      } catch (error) {
        console.error("Lỗi hút tin tức:", error);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

  const nextSlide = () => {
    if (currentIndex + itemsPerPage < newsList.length)
      setCurrentIndex(currentIndex + itemsPerPage);
  };

  const prevSlide = () => {
    if (currentIndex - itemsPerPage >= 0)
      setCurrentIndex(currentIndex - itemsPerPage);
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
                height: "20px",
                display: "inline-block",
                backgroundColor: "#0078D4",
              }}
            ></span>
            TIN TỨC
          </h4>
        </div>
        <div className="position-relative">
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="col d-flex align-items-stretch" key={i}>
                <div className="card w-100 h-100 border-0 shadow-sm rounded-3 placeholder-glow">
                  <div className="p-2">
                    <div
                      className="placeholder w-100 rounded-2"
                      style={{ height: "140px" }}
                    ></div>
                  </div>
                  <div className="card-body pt-1 px-3 pb-3">
                    <h6 className="card-title fw-bold">
                      <span className="placeholder col-12"></span>
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
      <div className="d-flex justify-content-between align-items-end mb-3">
        <h4
          className="fw-bold mb-0 d-flex align-items-center gap-2 fs-5 fs-md-4"
          style={{ color: "#1a3a5c" }}
        >
          <span
            style={{
              width: "5px",
              height: "20px",
              display: "inline-block",
              backgroundColor: "#0078D4",
            }}
          ></span>
          TIN TỨC
        </h4>
      </div>

      <div className="position-relative">
        {currentIndex > 0 && (
          <button
            className="btn btn-white shadow rounded-circle position-absolute top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center border slider-btn-prev"
            style={{
              width: "42px",
              height: "42px",
              left: "-15px",
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
            onClick={prevSlide}
          >
            <i className="bi bi-chevron-left fs-5"></i>
          </button>
        )}

        {currentIndex + itemsPerPage < newsList.length && (
          <button
            className="btn btn-white shadow rounded-circle position-absolute top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center border slider-btn-next"
            style={{
              width: "42px",
              height: "42px",
              right: "-15px",
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
            onClick={nextSlide}
          >
            <i className="bi bi-chevron-right fs-5"></i>
          </button>
        )}

        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-2 g-md-3">
          {visibleNews.map((news, index) => {
            const imgMatch =
              news.content?.match(/src="(.*?)"/) ||
              news.description?.match(/src="(.*?)"/);
            const imageUrl = imgMatch ? imgMatch[1] : "/no-image.png";

            return (
              <div className="col d-flex align-items-stretch" key={index}>
                <div
                  className="card w-100 h-100 bg-white shadow-sm rounded-4 position-relative border transition-all hover-subtle-bg"
                  style={{ borderColor: "#f1f1f1" }}
                >
                  <div className="p-2 pb-1">
                    <img
                      src={imageUrl}
                      className="card-img-top rounded-3 object-fit-cover w-100"
                      alt={news.title}
                      style={{ height: "140px", backgroundColor: "#f8f9fa" }}
                    />
                  </div>
                  <div className="card-body pt-2 px-3 pb-3">
                    <h6
                      className="card-title fw-bold mb-0 text-dark"
                      style={{
                        fontSize: "13px",
                        lineHeight: "1.5",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none text-reset stretched-link"
                        title={news.title}
                      >
                        {news.title}
                      </a>
                    </h6>
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
