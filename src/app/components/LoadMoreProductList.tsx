"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import type { Product } from "../type";
import toast from "react-hot-toast";

interface LoadMoreProductListProps {
  initialProducts: Product[];
  totalPages: number;
  totalItems: number;
  apiEndpoint: string;
  title?: string;
}

const BRANDS = [
  "Tất cả",
  "Cadivi",
  "Bình Minh",
  "Panasonic",
  "MPE",
  "Sino",
  "Daphaco",
  "Apollo",
];

export default function LoadMoreProductList({
  initialProducts,
  totalPages,
  totalItems,
  apiEndpoint,
  title = "TẤT CẢ SẢN PHẨM",
}: LoadMoreProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // VẤN ĐỀ 3: STATE LỌC HÃNG & SẮP XẾP
  const [selectedBrand, setSelectedBrand] = useState("Tất cả");
  const [sortOption, setSortOption] = useState<"latest" | "price_asc" | "price_desc" | "bestseller">("latest");

  // VẤN ĐỀ 2: NỐI TIẾP MẢNG AN TOÀN & KHÔNG XÁO TRỘN THỨ TỰ (DEDUPLICATION)
  const handleLoadMore = async () => {
    if (page >= totalPages || loading) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com";
      const separator = apiEndpoint.includes("?") ? "&" : "?";
      const res = await fetch(`${apiUrl}${apiEndpoint}${separator}page=${nextPage}&limit=12`);

      if (res.ok) {
        const data = await res.json();
        const newProducts: Product[] = data.data || [];

        // Khóa thứ tự & loại trừ trùng lặp ID tuyệt đối
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = newProducts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Lỗi tải thêm sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper lấy giá thấp nhất từ danh sách biến thể
  const getMinPrice = (item: Product) => {
    if (!item.variants || item.variants.length === 0) return 0;
    const validPrices = item.variants.map((v) => v.price).filter((p) => p > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : 0;
  };

  // VẤN ĐỀ 3: LỌC THEO HÃNG & SẮP XẾP TỨC THÌ TRÊN GIAO DIỆN
  const displayedProducts = useMemo(() => {
    // 1. Lọc theo Brand Chip (Ưu tiên trường brand chuẩn hóa từ Database, fallback theo tên sản phẩm)
    const filtered = products.filter((item) => {
      if (selectedBrand === "Tất cả") return true;
      if (item.brand) {
        return item.brand.trim().toLowerCase() === selectedBrand.trim().toLowerCase();
      }
      return item.name.toLowerCase().includes(selectedBrand.toLowerCase());
    });

    // 2. Sắp xếp theo Dropdown
    return [...filtered].sort((a, b) => {
      if (sortOption === "price_asc") {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (sortOption === "price_desc") {
        return getMinPrice(b) - getMinPrice(a);
      }
      if (sortOption === "bestseller") {
        const stockA = a.variants?.reduce((s, v) => s + v.stock, 0) || 0;
        const stockB = b.variants?.reduce((s, v) => s + v.stock, 0) || 0;
        return stockB - stockA;
      }
      return 0; // Mặc định giữ nguyên thứ tự Backend
    });
  }, [products, selectedBrand, sortOption]);

  // Hành động mở Zalo báo giá nhanh khi danh mục rỗng
  const handleZaloInquiry = () => {
    const categoryName = title.replace("DANH MỤC: ", "").trim();
    const message = `Chào Điện Nước Trường Tín, tôi cần tìm mua các mặt hàng thuộc nhóm: ${categoryName}. Vui lòng tư vấn và báo giá giúp tôi!`;

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).catch(() => {});
    }

    toast.success("Đã sao chép nội dung hỏi hàng! Đang chuyển sang Zalo...", { icon: "💬" });
    window.open("https://zalo.me/0903989096", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* VẤN ĐỀ 3: THANH CÔNG CỤ TOOLBAR (TIÊU ĐỀ + TỔNG SỐ + DROPDOWN SẮP XẾP) */}
      <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold text-dark mb-0 text-uppercase fs-5">
              <i className="bi bi-grid-fill text-primary me-2"></i>
              {title}
            </h4>
            <span className="badge bg-light text-secondary border px-3 py-2 fw-semibold rounded-pill small">
              Tổng: {displayedProducts.length} / {totalItems} sản phẩm
            </span>
          </div>

          {/* DROPDOWN SẮP XẾP */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            <label className="text-muted small fw-medium text-nowrap d-none d-sm-inline">
              Sắp xếp:
            </label>
            <select
              className="form-select form-select-sm rounded-3 shadow-none border bg-light fw-medium"
              style={{ width: "auto", minWidth: "170px", fontSize: "0.88rem" }}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
            >
              <option value="latest">Mới nhất (Mặc định)</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="bestseller">Bán chạy nhất</option>
            </select>
          </div>
        </div>

        {/* VẤN ĐỀ 3: DẢI LỌC NHANH THEO HÃNG (BRAND CHIPS) */}
        <div className="pt-3 mt-3 border-top">
          <div className="d-flex align-items-center gap-2 overflow-auto hide-scrollbar pb-1">
            <span className="text-muted small fw-semibold text-nowrap me-1">
              Thương hiệu:
            </span>
            {BRANDS.map((brand) => {
              const isSelected = selectedBrand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={`btn btn-sm rounded-pill text-nowrap px-3 py-1 fw-medium transition-all ${
                    isSelected
                      ? "btn-primary shadow-sm"
                      : "btn-light text-dark border"
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: "#0078D4", borderColor: "#0078D4" }
                      : { fontSize: "0.82rem", backgroundColor: "#f8f9fa" }
                  }
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LƯỚI SẢN PHẨM HOẶC EMPTY STATE */}
      {displayedProducts.length > 0 ? (
        <>
          <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 g-md-3 mb-4">
            {displayedProducts.map((item: Product) => (
              <div className="col" key={item.id}>
                <ProductCard item={item} />
              </div>
            ))}
          </div>

          {/* VẤN ĐỀ 6: NÚT XEM THÊM MÀU XANH THƯƠNG HIỆU TRƯỜNG TÍN */}
          {page < totalPages && selectedBrand === "Tất cả" && (
            <div className="text-center mt-5 mb-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn fw-bold px-5 py-2 rounded-pill shadow-sm transition-all"
                style={{
                  border: "1.5px solid #0078D4",
                  color: "#0078D4",
                  backgroundColor: "transparent",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#0078D4";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#0078D4";
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span> Đang tải...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-down-circle me-2"></i> Xem thêm sản phẩm
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* VẤN ĐỀ 4: TÁI THIẾT KẾ EMPTY STATE THÂN THIỆN (CHỐNG CỤT ĐƯỜNG) */
        <div className="text-center py-5 px-3 bg-white rounded-4 shadow-sm border my-2">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3 shadow-sm"
            style={{ backgroundColor: "#EBF5FF", width: "70px", height: "70px", color: "#0078D4" }}
          >
            <i className="bi bi-box-seam fs-2"></i>
          </div>

          <h5 className="text-dark fw-bold mb-2">
            Kho hàng luôn có sẵn đầy đủ tại cửa hàng!
          </h5>

          <p
            className="text-muted mx-auto mb-4"
            style={{ maxWidth: "560px", fontSize: "0.92rem", lineHeight: "1.5" }}
          >
            Mặt hàng{" "}
            <strong className="text-dark">
              {title.replace("DANH MỤC: ", "").trim()}
            </strong>{" "}
            {selectedBrand !== "Tất cả" ? `(Thương hiệu: ${selectedBrand})` : ""}{" "}
            đang được Điện Nước Trường Tín hoàn tất chụp ảnh mẫu mã và cập nhật lên website. Kho hàng tại{" "}
            <strong className="text-dark">358 Nơ Trang Long, P.13, Q. Bình Thạnh</strong>{" "}
            luôn có sẵn số lượng lớn và sẵn sàng xuất kho giao ngay trong ngày!
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3">
            <button
              onClick={handleZaloInquiry}
              className="btn btn-primary fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
              style={{ backgroundColor: "#0068FF", borderColor: "#0068FF" }}
            >
              <i className="bi bi-chat-dots-fill"></i> Nhắn Zalo Báo Giá Nhanh
            </button>

            <Link
              href="/san-pham"
              className="btn btn-outline-secondary fw-semibold px-4 py-2 rounded-pill d-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-left"></i> Xem Tất Cả Sản Phẩm Khác
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
