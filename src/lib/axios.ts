import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  // XÓA cái process.env đi, dán cứng link Render vào đây luôn:
  baseURL: 'https://truongtin-api.onrender.com', 
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