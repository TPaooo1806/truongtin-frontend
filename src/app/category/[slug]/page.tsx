import { Suspense } from 'react';
import Sidebar from '../../components/Sidebar';
import LoadMoreProductList from '../../components/LoadMoreProductList';

// Hàm lấy tên danh mục để làm Title
function getCategoryTitle(slug: string, products: any[]) {
  if (products.length > 0 && products[0].category) {
    return `Danh mục: ${products[0].category.name}`;
  }
  return `Danh mục: ${slug.replace(/-/g, ' ')}`;
}

async function fetchCategoryProducts(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com";
  try {
    const res = await fetch(`${apiUrl}/api/products?category=${slug}&page=1&limit=12`, {
      next: { revalidate: 60 } // Caching 60s
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
    console.error("Lỗi fetchCategoryProducts:", error);
    return { products: [], totalPages: 1, totalItems: 0 };
  }
}

// 🛒 Component Server bọc dữ liệu
async function CategoryGrid({ slug }: { slug: string }) {
  const { products, totalPages, totalItems } = await fetchCategoryProducts(slug);
  const categoryTitle = getCategoryTitle(slug, products);

  return (
    <LoadMoreProductList 
      initialProducts={products} 
      totalPages={totalPages} 
      totalItems={totalItems} 
      apiEndpoint={`/api/products?category=${slug}`} 
      title={categoryTitle.toUpperCase()}
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

// 📦 Trang Danh mục Chính (Server Component)
export default async function CategoryPage(props: { params: Promise<{ slug: string }> | { slug: string } }) {
  // Fix tương thích cho cả Next 14 và Next 15+ (khi params trở thành Promise)
  const params = await Promise.resolve(props.params);
  const slug = params.slug;

  return (
    <div className="container my-4">
      <div className="row g-4">
        <div className="col-lg-3 d-none d-lg-block">
          <Sidebar />
        </div>

        <div className="col-lg-9">
          <Suspense key={slug} fallback={<ProductGridSkeleton />}>
            <CategoryGrid slug={slug} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}