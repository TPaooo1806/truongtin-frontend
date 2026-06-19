"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "../type";

interface LoadMoreProductListProps {
  initialProducts: Product[];
  totalPages: number;
  totalItems: number;
  apiEndpoint: string;
  title?: string;
}

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

  const handleLoadMore = async () => {
    if (page >= totalPages || loading) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com";
      const separator = apiEndpoint.includes('?') ? '&' : '?';
      const res = await fetch(`${apiUrl}${apiEndpoint}${separator}page=${nextPage}&limit=12`);
      
      if (res.ok) {
        const data = await res.json();
        const newProducts = data.data || [];
        setProducts((prev) => [...prev, ...newProducts]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Lỗi tải thêm sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border mb-4">
        <div className="d-flex justify-content-between align-items-center mb-0">
          <h4 className="fw-bold text-dark mb-0 text-uppercase fs-5">
            <i className="bi bi-grid-fill text-danger me-2"></i> {title}
          </h4>
          <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
            Tổng: {totalItems} sản phẩm
          </span>
        </div>
      </div>

      {products.length > 0 ? (
        <>
          <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 g-md-3 mb-4">
            {products.map((item: Product, index: number) => (
              <div className="col" key={`${item.id}-${index}`}>
                <ProductCard item={item} />
              </div>
            ))}
          </div>

          {/* NÚT TẢI THÊM (LAZY LOADING) */}
          {page < totalPages && (
            <div className="text-center mt-5 mb-4">
              <button 
                onClick={handleLoadMore} 
                disabled={loading}
                className="btn btn-outline-danger fw-bold px-5 py-2 rounded-pill shadow-sm"
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span> Đang tải...</>
                ) : (
                  <><i className="bi bi-arrow-down-circle me-2"></i> Xem thêm sản phẩm</>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
          <i className="bi bi-box-seam text-muted" style={{ fontSize: '3rem' }}></i>
          <h5 className="mt-3 text-dark fw-bold">Chưa có sản phẩm nào!</h5>
          <p className="text-muted">Cửa hàng đang cập nhật sản phẩm, bạn vui lòng quay lại sau nhé.</p>
        </div>
      )}
    </>
  );
}
