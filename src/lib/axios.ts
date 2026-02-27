import axios from "axios";

const api = axios.create({
  baseURL: "https://truongtin-api.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm Interceptor để tự động gắn Token vào Request Header
api.interceptors.request.use(
  (config) => {
    // Kiểm tra xem có đang chạy trên trình duyệt không (vì Next.js có SSR)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        // Gắn token vào header Authorization (chuẩn Bearer Token)
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;