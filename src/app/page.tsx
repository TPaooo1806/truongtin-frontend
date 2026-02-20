'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { Product, ApiResponse, Category } from './type';
import Sidebar from './components/Sidebar';
import ProductCard from './components/ProductCard';

// Component con để hiển thị từng hàng sản phẩm (Slider)
const ProductSection = ({ title, products }: { title: string, products: Product[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6; 

  const nextSlide = () => {
    if (currentIndex + itemsPerPage < products.length) setCurrentIndex(currentIndex + itemsPerPage);
  };

  const prevSlide = () => {
    if (currentIndex - itemsPerPage >= 0) setCurrentIndex(currentIndex - itemsPerPage);
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="mb-5 position-relative">
      <div className="d-flex justify-content-between align-items-end mb-3">
        <h4 className="fw-bold mb-0 d-flex align-items-center gap-2 fs-5 fs-md-4" style={{ color: '#5D4037' }}>
          <span className="bg-danger" style={{ width: '5px', height: '20px', display: 'inline-block' }}></span>
          {title}
        </h4>
        <a href="#" className="text-danger fw-bold text-decoration-none small hover-underline">
          Xem tất cả <i className="bi bi-chevron-right" style={{ fontSize: '0.7rem' }}></i>
        </a>
      </div>

      <div className="position-relative">
        {currentIndex > 0 && (
          <button 
            className="btn btn-white shadow rounded-circle position-absolute start-0 top-50 translate-middle-y z-3 d-none d-md-flex align-items-center justify-content-center border"
            style={{ width: '42px', height: '42px', marginLeft: '-21px', backgroundColor: 'white' }}
            onClick={prevSlide}
          >
            <i className="bi bi-chevron-left fs-5"></i>
          </button>
        )}

        {currentIndex + itemsPerPage < products.length && (
          <button 
            className="btn btn-white shadow rounded-circle position-absolute end-0 top-50 translate-middle-y z-3 d-none d-md-flex align-items-center justify-content-center border"
            style={{ width: '42px', height: '42px', marginRight: '-21px', backgroundColor: 'white' }}
            onClick={nextSlide}
          >
            <i className="bi bi-chevron-right fs-5"></i>
          </button>
        )}

        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-2 g-md-3">
          {visibleProducts.map(p => (
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // FIX LỖI MẤT SẢN PHẨM: Thêm ?limit=100 để lấy đủ số lượng sản phẩm từ tất cả danh mục, 
        // tránh việc Bóng đèn bị đẩy sang trang 2 không hiện được.
        const [prodRes, catRes] = await Promise.all([
          axios.get<ApiResponse<Product[]>>('http://localhost:5000/api/products?limit=100'),
          axios.get<ApiResponse<Category[]>>('http://localhost:5000/api/categories')
        ]);
        
        if (prodRes.data.success) setProducts(prodRes.data.data);
        if (catRes.data.success) setCategories(catRes.data.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu hệ thống:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-white">
      <div className="spinner-border text-danger mb-2" role="status"></div>
      <div className="text-danger fw-bold">ĐANG TẢI DỮ LIỆU TRƯỜNG TÍN...</div>
    </div>
  );

  return (
    <div className="bg-light min-vh-100">
      <main className="container my-4 px-2 px-md-3">
        
        {/* SECTION 1: SIDEBAR & BANNER CHÍNH */}
        <section className="row g-3 mb-5">
          <aside className="col-lg-3 d-none d-lg-block">
            <Sidebar /> 
          </aside>
          <div className="col-lg-9">
            <div className="rounded-4 overflow-hidden shadow-sm h-100 d-flex align-items-center p-4 p-md-5 text-white"
                 style={{ background: 'linear-gradient(45deg, #5D4037, #D32F2F)', minHeight: '300px' }}>
              <div>
                <span className="badge bg-warning text-dark mb-2 fw-bold">Khuyến mãi tháng 2</span>
                <h1 className="fw-black italic display-5">TRƯỜNG TÍN</h1>
                <p className="lead fw-bold text-uppercase">Giải pháp điện nước toàn diện cho mọi công trình</p>
                <button className="btn btn-light fw-bold rounded-pill px-4 mt-3 shadow">XEM ƯU ĐÃI NGAY</button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SẢN PHẨM BÁN CHẠY */}
        <ProductSection title="TOP BÁN CHẠY" products={products} />

        {/* SECTION 3: BANNER QUẢNG CÁO PHỤ */}
        <section className="row g-3 mb-5">
          <div className="col-md-6">
            <div className="rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end"
                 style={{ height: '200px', backgroundColor: '#6c757d', backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))' }}>
              <h3 className="fw-bold">ỐNG NHỰA BÌNH MINH</h3>
              <p className="mb-0 small">Đầy đủ kích cỡ Φ21 - Φ200</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="rounded-4 p-4 text-white shadow-sm d-flex flex-column justify-content-end"
                 style={{ height: '200px', backgroundColor: '#5D4037', backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))' }}>
              <h3 className="fw-bold">DÂY ĐIỆN CADIVI</h3>
              <p className="mb-0 small">Chiết khấu cao cho nhà thầu</p>
            </div>
          </div>
        </section>

       {/* SECTION 4: CHỈ HIỂN THỊ 3 DANH MỤC (Ống nước, Phụ kiện, Bóng đèn) */}
        {categories.map(cat => {
            const catName = cat.name.toLowerCase();
            
            // 1. Chỉ cho phép 3 danh mục này được đi tiếp
            const isTargetCategory = catName.includes("ống nước") || 
                                     catName.includes("phụ kiện") || 
                                     catName.includes("bóng đèn");
            
            if (!isTargetCategory) return null; // Nếu danh mục khác -> Bỏ qua

            // 2. Lọc sản phẩm khớp với danh mục
            const categoryProducts = products.filter(p => p.categoryId === cat.id);
            
            // 3. Nếu không có sản phẩm nào -> Ẩn luôn
            if (categoryProducts.length === 0) return null;
            
            return (
                <ProductSection 
                    key={cat.id} 
                    title={cat.name.toUpperCase()} 
                    products={categoryProducts} 
                />
            );
        })}

     {/* SECTION 5: DANH MỤC NGANG (Đã làm cho bấm được) */}
        <section className="mb-5 py-4 py-md-5 bg-white rounded-4 shadow-sm mt-5">
          <h5 className="fw-bold text-center mb-4 text-secondary fs-6">
            KHÁM PHÁ DANH MỤC HÀNG HÓA
          </h5>
          <div 
            className="d-flex flex-nowrap hide-scrollbar overflow-auto justify-content-start justify-content-lg-evenly align-items-start gap-3 px-3 px-md-4" 
            style={{ paddingBottom: '15px' }}
          >
            {categories.map(cat => (
              /* THAY ĐỔI: Chuyển div thành thẻ a, thêm href trỏ tới trang danh mục tương ứng */
              <a 
                key={cat.id} 
                href={`/category/${cat.slug}`} // Chuyển hướng đến đường dẫn danh mục
                className="text-center flex-shrink-0 text-decoration-none group-hover" 
                style={{ width: 'clamp(85px, 12vw, 140px)', display: 'block' }}
              >
                <div 
                  className="p-0 border rounded-circle mx-auto mb-3 bg-light d-flex align-items-center justify-content-center shadow-sm category-icon-box" 
                  style={{ 
                    width: 'clamp(65px, 8vw, 95px)', 
                    height: 'clamp(65px, 8vw, 95px)', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = '#f8d7da'; // Đổi màu nền nhẹ sang đỏ nhạt khi hover
                    e.currentTarget.style.borderColor = '#dc3545';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  <i className="bi bi-tools text-danger category-icon" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)', transition: 'all 0.3s' }}></i>
                </div>
                <p 
                  className="fw-bold text-muted text-uppercase mb-0 text-wrap mx-auto" 
                  style={{ fontSize: 'clamp(10px, 1vw, 13px)', lineHeight: '1.4', transition: 'color 0.3s' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#dc3545'} // Chữ cũng đổi màu khi trỏ chuột
                  onMouseOut={(e) => e.currentTarget.style.color = '#6c757d'}
                >
                  {cat.name}
                </p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}