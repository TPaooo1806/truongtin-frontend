import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. Chỉ chạy khi người dùng truy cập vào /admin/...
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 2. Đọc token từ cookie (tùy thuộc vào cách dự án lưu token. Dự án hiện tại lưu user/token ở localStorage nhưng ta nên kiểm tra cookie nếu có)
  // Trong trường hợp Frontend chỉ dùng localStorage và không có HttpOnly Cookie,
  // Middleware trên server KHÔNG thể đọc được localStorage.
  // Tuy nhiên, có vẻ dự án đang dùng 'user' trong localStorage. Để Middleware chạy chuẩn, 
  // ta cần yêu cầu Auth API set thêm Cookie 'token' hoặc 'admin_token' khi đăng nhập.
  // Nhưng tạm thời ta sẽ chặn bằng cách kiểm tra một cookie 'token' nếu có.
  // Nếu chưa cấu hình Cookie, Middleware sẽ luôn chặn. Để sửa tận gốc, phần login cần set cookie.
  // Ở đây tôi viết chuẩn khung Middleware:
  const token = request.cookies.get('admin_token')?.value;

  // Nếu không có token hợp lệ, lập tức NextResponse.redirect() đẩy người dùng văng ra trang /login
  if (!token) {
    // Chuyển hướng người lạ về trang chủ hoặc trang đăng nhập
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
