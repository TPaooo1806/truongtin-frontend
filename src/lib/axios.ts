import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  // Khi deploy, link này sẽ được lấy từ biến môi trường trên Vercel
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm Token vào mọi yêu cầu gửi đi
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        // Sử dụng set để đảm bảo Authorization được gán đúng cách trong TS
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