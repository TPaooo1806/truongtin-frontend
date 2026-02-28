'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import Sidebar from '../components/Sidebar';
import type { Product } from '../type';
import api from '@/lib/axios';

// --- COMPONENT CHÍNH XỬ LÝ HIỂN THỊ ---
function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Lấy số trang hiện tại từ URL (VD: /san-pham?page=2), mặc định là 1
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Gọi API lấy danh sách tất cả sản phẩm, giới hạn 12 cái 1 trang
        const res = await api.get(`/api/products?page=${currentPage}&limit=12`);
        if (res.data.success) {
          setProducts(res.data.data);
          setTotalPages(res.data.pagination.totalPages);
          setTotalItems(res.data.pagination.totalItems);
        }
      } catch (err) {
        console.error("Lỗi tải trang sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage]);

  // Hàm chuyển trang
  const handlePageChange = (newPage: number) => {
    router.push(`/san-pham?page=${newPage}`);
  };

  return (
    <div className="container my-4">
      <div className="row g-4">
        
        {/* CỘT TRÁI: SIDEBAR DANH MỤC (Tự động ẩn trên Mobile, hiện trên Desktop) */}
        <div className="col-lg-3 d-none d-lg-block">
          <Sidebar />
        </div>

        {/* CỘT PHẢI: DANH SÁCH SẢN PHẨM */}
        <div className="col-lg-9">
          
          {/* Header của khu vực sản phẩm */}
          <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border mb-4">
            <div className="d-flex justify-content-between align-items-center mb-0">
              <h4 className="fw-bold text-dark mb-0 text-uppercase fs-5">
                <i className="bi bi-grid-fill text-danger me-2"></i> TẤT CẢ SẢN PHẨM
              </h4>
              {!loading && (
                <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
                  Tổng: {totalItems} sản phẩm
                </span>
              )}
            </div>
          </div>

          {/* Nội dung danh sách */}
          {loading ? (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-2 text-muted fw-bold">Đang tải dữ liệu cửa hàng...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Lưới sản phẩm dùng chung ProductCard */}
              <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 g-md-3 mb-4">
                {products.map((item) => (
                  <div className="col" key={item.id}>
                    <ProductCard item={item} />
                  </div>
                ))}
              </div>

              {/* KHU VỰC PHÂN TRANG (PAGINATION) */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-5">
                  <nav>
                    <ul className="pagination shadow-sm">
                      {/* Nút lùi */}
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link text-danger fw-bold" onClick={() => handlePageChange(currentPage - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      
                      {/* Danh sách các số trang */}
                      {Array.from({ length: totalPages }, (_, i) => (
                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                          <button 
                            className={`page-link fw-bold ${currentPage === i + 1 ? 'bg-danger border-danger text-white' : 'text-dark'}`} 
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}

                      {/* Nút tiến */}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link text-danger fw-bold" onClick={() => handlePageChange(currentPage + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            // Báo lỗi nếu chưa có sản phẩm nào
            <div className="text-center py-5 bg-white rounded-4 shadow-sm border">
              <i className="bi bi-box-seam text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-dark fw-bold">Chưa có sản phẩm nào!</h5>
              <p className="text-muted">Cửa hàng đang cập nhật sản phẩm, bạn vui lòng quay lại sau nhé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Bắt buộc bọc bằng Suspense trong Next.js (App Router) để tránh lỗi build khi dùng useSearchParams
export default function ShopPage() {
  return (
    <Suspense fallback={<div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-danger"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}