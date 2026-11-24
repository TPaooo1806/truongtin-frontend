import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // 1. Lấy hostname (loại bỏ cổng nếu có, ví dụ "admin.localhost:3000" -> "admin.localhost")
  const hostHeader = req.headers.get('host') || '';
  const hostname = hostHeader.split(':')[0].toLowerCase();

  // 2. Bỏ qua các file tĩnh, asset, icon, manifest và API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/apple-icon.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|woff|woff2)$/i)
  ) {
    return NextResponse.next();
  }

  // Nhận diện Subdomain Admin
  const isAdminSubdomain =
    hostname === 'admin.diennuoctruongtin.com' ||
    hostname === 'admin.localhost' ||
    hostname.startsWith('admin.');

  // ==========================================
  // A. KHI HOSTNAME LÀ ADMIN SUBDOMAIN (admin.diennuoctruongtin.com / admin.localhost)
  // ==========================================
  if (isAdminSubdomain) {
    // 1. Nếu pathname là '/' -> rewrite ngầm sang '/admin' (hiển thị Bảng điều khiển quản trị)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', req.url));
    }

    // 2. Nếu pathname là '/login' -> rewrite ngầm sang '/admin/login' (hiển thị trang Đăng nhập riêng của Admin)
    if (pathname === '/login') {
      return NextResponse.rewrite(new URL('/admin/login', req.url));
    }

    // 3. Nếu pathname đã bắt đầu bằng '/admin' -> cho đi qua bình thường
    if (pathname.startsWith('/admin')) {
      return NextResponse.next();
    }

    // 4. Nếu pathname chưa bắt đầu bằng '/admin' (vd: /products, /orders, /banners, /categories) -> rewrite ngầm sang /admin + pathname
    return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
  }

  // ==========================================
  // B. KHI HOSTNAME LÀ TÊN MIỀN BÁN HÀNG CỦA KHÁCH (diennuoctruongtin.com / vercel)
  // ==========================================
  // Nếu có người truy cập /admin hoặc /admin/..., tự động chuyển hướng sang https://admin.diennuoctruongtin.com
  if (
    hostname === 'diennuoctruongtin.com' ||
    hostname === 'www.diennuoctruongtin.com' ||
    hostname.endsWith('.vercel.app')
  ) {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const targetUrl = new URL(pathname, 'https://admin.diennuoctruongtin.com');
      return NextResponse.redirect(targetUrl);
    }
  }

  return NextResponse.next();
}

// Hỗ trợ alias middleware nếu cần
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, _next, favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
