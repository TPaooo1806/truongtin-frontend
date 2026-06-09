import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient"; // Import file giao diện cũ của bạn

// 1. Hàm gọi API lấy thông tin sản phẩm trên Server
// (Lưu ý: Trên Server component của Next.js, khuyên dùng fetch mặc định thay vì axios để tận dụng bộ nhớ đệm cache)
async function getProductData(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com"}/api/products/${slug}`,
      {
        next: { revalidate: 60 }, // Cache lại 60 giây để web chạy cực nhanh, không lo nghẽn Database
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data; // Tùy cấu trúc API của bạn trả về nhé
  } catch (error) {
    return null;
  }
}

// 2. 💡 HÀM MA THUẬT: TỰ ĐỘNG TẠO THẺ SEO ĐỘNG CHO TỪNG SẢN PHẨM
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductData(resolvedParams.slug);

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm | Điện Nước Trường Tín",
      description:
        "Sản phẩm bạn tìm kiếm không tồn tại hoặc đã ngừng kinh doanh.",
    };
  }

  // Lấy link ảnh đầu tiên làm ảnh đại diện khi Share Zalo/Facebook
  const ogImage = product.images?.[0]?.url || "/default-seo-image.jpg";

  return {
    title: `${product.name} | Điện Nước Trường Tín`,
    description:
      product.description ||
      `Mua ${product.name} chính hãng, giá tốt tại Cửa hàng Trường Tín.`,
    openGraph: {
      title: `${product.name} - Giá tốt tại Trường Tín`,
      description:
        product.description ||
        `Nhấp vào để xem chi tiết và báo giá ${product.name}.`,
      images: [
        {
          url: ogImage,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: "website",
    },
  };
}

// 3. COMPONENT CHÍNH
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProductData(resolvedParams.slug);

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h3 className="fw-bold text-danger">
          Rất tiếc! Không tìm thấy vật tư này.
        </h3>
        <p>Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.</p>
      </div>
    );
  }

  // 4. Gọi Component Client ra và ném dữ liệu vào cho nó render giao diện
  return <ProductDetailClient initialProduct={product} />;
}
