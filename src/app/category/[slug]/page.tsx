'use client';
import { useEffect, useState, use } from 'react';
import ProductCard from '../../components/ProductCard'; 
import Sidebar from '../../components/Sidebar';
import type { Product } from '../../type';
import api from '@/lib/axios';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlug, setCurrentSlug] = useState('');
  // Thêm state để lưu tên danh mục có dấu
  const [categoryName, setCategoryName] = useState('');

  if (slug !== currentSlug) {
    setCurrentSlug(slug);
    setLoading(true);
    setProducts([]);
    setCategoryName(''); // Reset tên danh mục khi đổi slug
  }

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const res = await api.get(`/api/products?category=${slug}`);
        if (isMounted && res.data.success) {
          const fetchedProducts = res.data.data;
          setProducts(fetchedProducts);

          // LẤY TÊN CÓ DẤU: Nếu có sản phẩm, lấy tên danh mục từ sản phẩm đầu tiên
          if (fetchedProducts.length > 0 && fetchedProducts[0].category) {
            setCategoryName(fetchedProducts[0].category.name);
          } else {
            // Nếu không có sản phẩm, dùng hàm format tạm thời từ slug
            setCategoryName(slug.replace(/-/g, ' '));
          }
        }
      } catch (err) {
        console.error("Lỗi lọc sản phẩm:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [slug]);

  return (
    <div className="container my-4">
      <div className="row g-4">
        
        {/* 💡 SỬA Ở ĐÂY: Thêm d-none d-lg-block để ẩn trên Mobile, hiện trên PC */}
        <div className="col-lg-3 d-none d-lg-block">
          <Sidebar />
        </div>

        <div className="col-lg-9">
          <div className="bg-white p-3 rounded-3 shadow-sm mb-4 border-start border-danger border-5 d-flex align-items-center gap-2">
            <h4 className="fw-bold mb-0 text-uppercase text-danger d-flex align-items-center">
              {/* HIỂN THỊ TÊN CÓ DẤU TẠI ĐÂY */}
              Danh mục: {categoryName || slug.replace(/-/g, ' ')}
            </h4>
          </div>

          {loading ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-2 text-muted">Đang tìm sản phẩm...</p>
            </div>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3">
              {products.length > 0 ? (
                products.map((item) => (
                  <div className="col" key={item.id}>
                    <ProductCard item={item} />
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5 text-muted bg-white rounded-3">
                   Chưa có sản phẩm nào trong danh mục này.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}