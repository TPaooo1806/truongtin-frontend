import { Suspense } from 'react';
import LoadMoreProductList from '../components/LoadMoreProductList';

async function fetchSearchResults(query: string) {
  if (!query) return { products: [], totalPages: 1, totalItems: 0 };
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com";
  try {
    const res = await fetch(`${apiUrl}/api/products?q=${encodeURIComponent(query)}&page=1&limit=12`, {
      next: { revalidate: 60 }
    });
    
    if (!res.ok) return { products: [], totalPages: 1, totalItems: 0 };
    
    const data = await res.json();
    return {
      products: data.data || [],
      totalPages: data.pagination?.totalPages || 1,
      totalItems: data.pagination?.totalItems || 0
    };
  } catch (error) {
    console.error("Lỗi fetchSearchResults:", error);
    return { products: [], totalPages: 1, totalItems: 0 };
  }
}

async function SearchGrid({ query }: { query: string }) {
  const { products, totalPages, totalItems } = await fetchSearchResults(query);

  return (
    <>
      <div className="search-header bg-white p-3 rounded-4 shadow-sm mb-4">
        <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "1.125rem", color: "#5d4037", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Kết quả tìm kiếm cho: <span className="text-danger font-weight-bold" style={{ color: "#d32f2f", marginLeft: "6px" }}>&quot;{query}&quot;</span>
        </h4>
        <p className="text-muted small mt-2 mb-0">
          Tìm thấy <b>{totalItems}</b> sản phẩm phù hợp
        </p>
      </div>

      <LoadMoreProductList 
        initialProducts={products} 
        totalPages={totalPages} 
        totalItems={totalItems} 
        apiEndpoint={`/api/products?q=${encodeURIComponent(query)}`} 
        title={`TÌM KIẾM: ${query.toUpperCase()}`}
      />
      
      <style>{`
        .search-header {
          background: linear-gradient(180deg, #ffffff, #fff);
          border-left: 6px solid #d32f2f;
        }
      `}</style>
    </>
  );
}

function SearchSkeleton() {
  return (
    <>
      <div className="search-header bg-white p-3 rounded-4 shadow-sm mb-4 placeholder-glow">
        <h4 className="placeholder col-4 rounded" style={{ height: "24px" }}></h4>
        <p className="placeholder col-2 rounded mt-2 mb-0" style={{ height: "14px" }}></p>
      </div>
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3 mb-4">
        {Array(8).fill(0).map((_, i) => (
          <div className="col" key={i}>
            <div className="bg-white rounded-3 border p-2">
              <div className="bg-secondary bg-opacity-10 rounded mb-2 placeholder-glow" style={{ aspectRatio: "1/1" }}></div>
              <div className="placeholder-glow">
                <span className="placeholder col-8 bg-secondary bg-opacity-10 rounded mb-1 d-block" style={{ height: "14px" }}></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> | { q?: string } }) {
  const searchParams = await Promise.resolve(props.searchParams);
  const q = searchParams?.q || '';

  return (
    <div className="container my-4 search-page" style={{ backgroundColor: "#f6f5f4", paddingBottom: "2.5rem" }}>
      <Suspense key={q} fallback={<SearchSkeleton />}>
        <SearchGrid query={q} />
      </Suspense>
    </div>
  );
}