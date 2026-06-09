"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Product, ApiResponse, Category } from "./type";
import Sidebar from "./components/Sidebar";
import ProductCard from "./components/ProductCard";
import BannerDisplay from "@/components/BannerDisplay";
import DailyNews from "@/components/DailyNews";
import api from "@/lib/axios";

// Component con để hiển thị từng hàng sản phẩm (Slider)
const ProductSection = ({
  title,
  products,
  link,
}: {
  title: string;
  products: Product[];
  link?: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6;

  const nextSlide = () => {
    if (currentIndex + itemsPerPage < products.length)
      setCurrentIndex(currentIndex + itemsPerPage);
  };

  const prevSlide = () => {
    if (currentIndex - itemsPerPage >= 0)
      setCurrentIndex(currentIndex - itemsPerPage);
  };

  const visibleProducts = products.slice(
    currentIndex,
    currentIndex + itemsPerPage,
  );

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
          {title}
        </h4>
        {link && (
          <a
            href={link}
            className="fw-bold text-decoration-none small hover-underline"
            style={{ color: "#0078D4" }}
          >
            Xem tất cả <i className="bi bi-chevron-right" style={{ fontSize: "0.7rem" }}></i>
          </a>
        )}
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

        {currentIndex + itemsPerPage < products.length && (
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

        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-2 g-md-3">
          {visibleProducts.map((p) => (
            <div className="col d-flex align-items-stretch" key={p.id}>
              <ProductCard item={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function App() {
  const [topSelling, setTopSelling] = useState<Product[]>([]);
  const [homeCategories, setHomeCategories] = useState<(Category & { products: Product[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/home-data");
        if (res.data.success) {
          setTopSelling(res.data.data.topSelling || []);
          setHomeCategories(res.data.data.homeCategories || []);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu hệ thống:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="container my-4 px-2 px-md-3">
        {/* Skeleton Banner */}
        <div className="row g-3 mb-4">
          <div className="col-lg-3 d-none d-lg-block">
            <div
              className="bg-secondary bg-opacity-10 rounded-4"
              style={{ height: "400px" }}
            ></div>
          </div>
          <div className="col-lg-9">
            <div
              className="bg-secondary bg-opacity-10 rounded-4 placeholder-glow"
              style={{ height: "400px" }}
            ></div>
          </div>
        </div>
        {/* Skeleton Products */}
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-2 g-md-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div className="col" key={i}>
                <div className="bg-white rounded-3 border p-2">
                  <div
                    className="bg-secondary bg-opacity-10 rounded mb-2 placeholder-glow"
                    style={{ aspectRatio: "1/1" }}
                  ></div>
                  <div className="placeholder-glow">
                    <span
                      className="placeholder col-8 bg-secondary bg-opacity-10 rounded mb-1 d-block"
                      style={{ height: "14px" }}
                    ></span>
                    <span
                      className="placeholder col-5 bg-secondary bg-opacity-10 rounded d-block"
                      style={{ height: "18px" }}
                    ></span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );

  return (
    <div className="bg-white min-vh-100">
      <main className="container my-4 px-2 px-md-3">
        {/* SECTION 1: SIDEBAR & BANNER CHÍNH */}
        <section className="row g-3 mb-4">
          <aside className="col-lg-3 d-none d-lg-block">
            <Sidebar />
          </aside>
          <div className="col-lg-9">
            <BannerDisplay position="HOME_MAIN" />
          </div>
        </section>

        {/* SECTION: USP TRUST STRIP */}
        <section className="mb-5">
          <div className="row g-2 g-md-3">
            {[
              {
                icon: "bi-shield-check",
                title: "Chính hãng 100%",
                desc: "Cam kết hàng chính hãng",
                color: "#0078D4",
              },
              {
                icon: "bi-truck",
                title: "Giao nhanh 2H",
                desc: "Nội thành TP.HCM",
                color: "#0063B1",
              },
              {
                icon: "bi-tags",
                title: "Giá sỉ tốt nhất",
                desc: "Chiết khấu cao cho thầu",
                color: "#2e7d32",
              },
              {
                icon: "bi-arrow-repeat",
                title: "Đổi trả 7 ngày",
                desc: "Đổi trả nhanh chóng",
                color: "#e65100",
              },
            ].map((item, idx) => (
              <div className="col-6 col-md-3" key={idx}>
                <div
                  className="bg-white rounded-3 p-3 d-flex align-items-center gap-2 gap-md-3 shadow-sm border h-100"
                  style={{ transition: "transform 0.2s" }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: "42px",
                      height: "42px",
                      backgroundColor: item.color + "15",
                      color: item.color,
                    }}
                  >
                    <i className={`bi ${item.icon} fs-5`}></i>
                  </div>
                  <div>
                    <div
                      className="fw-bold text-dark"
                      style={{ fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}
                    >
                      {item.title}
                    </div>
                    <div
                      className="text-muted d-none d-md-block"
                      style={{ fontSize: "0.72rem" }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: SẢN PHẨM BÁN CHẠY */}
        {topSelling.length > 0 && (
          <ProductSection title="TOP BÁN CHẠY" products={topSelling} link="/san-pham" />
        )}

        {/* NƠI 2: DOUBLE BANNER (TRÁI / PHẢI) */}
        <div className="row my-4 g-3">
          <div className="col-12 col-md-6">
            <BannerDisplay position="HOME_SUB_LEFT" />
          </div>
          <div className="col-12 col-md-6">
            <BannerDisplay position="HOME_SUB_RIGHT" />
          </div>
        </div>

        {/* SECTION 4: DANH MỤC ĐỘNG TỪ ADMIN */}
        {homeCategories.map((cat) => {
          if (!cat.products || cat.products.length === 0) return null;
          return (
            <ProductSection
              key={cat.id}
              title={cat.name.toUpperCase()}
              products={cat.products}
              link={`/category/${cat.slug}`}
            />
          );
        })}

        {/* SECTION 5: TIN TỨC TỰ ĐỘNG TỪ RSS */}
        <DailyNews />
      </main>
    </div>
  );
}
