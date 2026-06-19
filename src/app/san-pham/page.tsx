import { Suspense } from 'react';
import Sidebar from '../components/Sidebar';
import LoadMoreProductList from '../components/LoadMoreProductList';

async function fetchInitialProducts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com";
  try {
    const res = await fetch(`${apiUrl}/api/products?page=1&limit=12`, {
      next: { revalidate: 60 } // Caching 60s để Server SSR siêu nhanh
    });
    if (!res.ok) {
      return { products: [], totalPages: 1, totalItems: 0 };
    }
    const data = await res.json();
    return {
      products: data.data || [],
      totalPages: data.pagination?.totalPages || 1,
      totalItems: data.pagination?.totalItems || 0
    };
  } catch (error) {
    console.error("Lỗi fetchInitialProducts:", error);
    return { products: [], totalPages: 1, totalItems: 0 };
  }
}

// 🛒 Component Server bọc dữ liệu ban đầu
async function ProductGridInitial() {
  const { products, totalPages, totalItems } = await fetchInitialProducts();

  return (
    <LoadMoreProductList 
      initialProducts={products} 
      totalPages={totalPages} 
      totalItems={totalItems} 
      apiEndpoint="/api/products" 
    />
  );
}

// ⏳ Skeleton hiển thị trong lúc Server chờ tải cục dữ liệu đầu tiên
function ProductGridSkeleton() {
  return (
    <>
      <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border mb-4 placeholder-glow">
        <div className="d-flex justify-content-between align-items-center mb-0">
          <span className="placeholder col-4 rounded" style={{ height: "24px" }}></span>
          <span className="placeholder col-2 rounded" style={{ height: "24px" }}></span>
        </div>
      </div>
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-2 g-md-3 mb-4">
        {Array(12).fill(0).map((_, i) => (
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
    </>
  );
}

// 📦 Trang Chính (Server Component không cần nhận searchParams nữa vì đổi sang Lazy Load)
export default async function ShopPage() {
  return (
    <div className="container my-4">
      <div className="row g-4">
        <div className="col-lg-3 d-none d-lg-block">
          <Sidebar />
        </div>

        <div className="col-lg-9">
          {/* Suspense để tối ưu UX cho lần load trang đầu tiên */}
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGridInitial />
          </Suspense>
        </div>
      </div>
    </div>
  );
}