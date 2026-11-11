import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://truongtin-api.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  // [BM-02] withCredentials = true: Trình duyệt tự động đính kèm httpOnly Cookie
  // vào mọi request mà không cần code thủ công, JS không thể đọc cookie này
  withCredentials: true,
});

// Interceptor Request: Vẫn giữ fallback đọc token từ localStorage
// để tương thích ngược nếu người dùng đã đăng nhập từ trước
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Tự động phát hiện phiên đăng nhập hết hạn (401 Unauthorized)
// và kích hoạt đồng bộ đăng xuất toàn cục (Global Auth Sync)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "admin_token=; path=/; max-age=0";
      // Bắn sự kiện để Header và toàn bộ component lập tức cập nhật trạng thái "ĐĂNG NHẬP"
      window.dispatchEvent(new Event("authUpdated"));
    }
    return Promise.reject(error);
  }
);

export default api;
