import { MetadataRoute } from 'next';
import api from '@/lib/axios';

// Định nghĩa base URL của trang web
const baseUrl = 'https://diennuoctruongtin.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Khai báo các trang tĩnh (Trang chủ, Liên hệ, Giới thiệu...)
  const staticRoutes = [
    '',
    '/gioi-thieu',
    '/lien-he',
    '/san-pham',
    '/track-order',
    '/cart'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8, // Trang chủ ưu tiên cao nhất (1.0)
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // 2. Tự động lấy danh sách Sản phẩm từ Backend để tạo sitemap động
    // Lưu ý: Thay đổi URL API cho khớp với backend của bạn nếu cần
    const resProducts = await fetch('https://truongtin-api.onrender.com/api/products?limit=1000');
    const productsData = await resProducts.json();

    if (productsData.success && Array.isArray(productsData.data)) {
      const productRoutes = productsData.data.map((product: any) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
      dynamicRoutes = [...dynamicRoutes, ...productRoutes];
    }

    // 3. Tự động lấy danh sách Danh mục (Categories)
    const resCategories = await fetch('https://truongtin-api.onrender.com/api/categories');
    const categoriesData = await resCategories.json();

    if (categoriesData.success && Array.isArray(categoriesData.data)) {
      const categoryRoutes = categoriesData.data.map((category: any) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
      dynamicRoutes = [...dynamicRoutes, ...categoryRoutes];
    }
  } catch (error) {
    console.error("Lỗi khi tạo sitemap động:", error);
  }

  // Gộp trang tĩnh và trang động lại trả về cho Google
  return [...staticRoutes, ...dynamicRoutes];
}
