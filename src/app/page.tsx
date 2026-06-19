import { Suspense } from 'react';
import type { Product, Category } from "./type";
import Sidebar from "./components/Sidebar";
import BannerDisplay from "@/components/BannerDisplay";
import DailyNews from "@/components/DailyNews";
import ProductSection from "./components/ProductSection";

// --- Async Data Fetching Component ---
async function HomeContent() {
  let topSelling: Product[] = [];
  let homeCategories: (Category & { products: Product[] })[] = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com";
    const res = await fetch(`${apiUrl}/api/home-data`, {
      next: { revalidate: 60 },
    });
    
    if (res.ok) {
      const data = await res.json();
      topSelling = data.data?.topSelling || [];
      homeCategories = data.data?.homeCategories || [];
    }
  } catch (error) {
    console.error("Lỗi tải dữ liệu hệ thống:", error);
  }

  return (
    <>
      {/* SECTION 2: SẢN PHẨM BÁN CHẠY */}
      {topSelling.length > 0 && (
        <ProductSection title="TOP BÁN CHẠY" products={topSelling} link="/san-pham" />
      )}

      {/* DOUBLE BANNER (TRÁI / PHẢI) */}
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
    </>
  );
}

// --- Loading Skeleton Component ---
function HomeLoading() {
  return (
    <div className="container my-4 px-2 px-md-3">
      {/* Skeleton Products */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-2 g-md-3 mb-5">
        {Array(6).fill(0).map((_, i) => (
          <div className="col" key={i}>
            <div className="bg-white rounded-3 border p-2">
              <div className="bg-secondary bg-opacity-10 rounded mb-2 placeholder-glow" style={{ aspectRatio: "1/1" }}></div>
              <div className="placeholder-glow">
                <span className="placeholder col-8 bg-secondary bg-opacity-10 rounded mb-1 d-block" style={{ height: "14px" }}></span>
                <span className="placeholder col-5 bg-secondary bg-opacity-10 rounded d-block" style={{ height: "18px" }}></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page (Server Component) ---
export default function HomePage() {
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
              { icon: "bi-shield-check", title: "Chính hãng 100%", desc: "Cam kết hàng chính hãng", color: "#0078D4" },
              { icon: "bi-truck", title: "Giao nhanh 2H", desc: "Nội thành TP.HCM", color: "#0063B1" },
              { icon: "bi-tags", title: "Giá sỉ tốt nhất", desc: "Chiết khấu cao cho thầu", color: "#2e7d32" },
              { icon: "bi-arrow-repeat", title: "Đổi trả 7 ngày", desc: "Đổi trả nhanh chóng", color: "#e65100" },
            ].map((item, idx) => (
              <div className="col-6 col-md-3" key={idx}>
                <div className="bg-white rounded-3 p-3 d-flex align-items-center gap-2 gap-md-3 shadow-sm border h-100" style={{ transition: "transform 0.2s" }}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "42px", height: "42px", backgroundColor: item.color + "15", color: item.color }}>
                    <i className={`bi ${item.icon} fs-5`}></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)" }}>{item.title}</div>
                    <div className="text-muted d-none d-md-block" style={{ fontSize: "0.72rem" }}>{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic Content with Suspense */}
        <Suspense fallback={<HomeLoading />}>
          <HomeContent />
        </Suspense>

        {/* SECTION 5: TIN TỨC TỰ ĐỘNG TỪ RSS */}
        <DailyNews />
      </main>
    </div>
  );
}
