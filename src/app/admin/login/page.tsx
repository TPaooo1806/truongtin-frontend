'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    id: number;
    phone: string;
    name: string;
    role: string;
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Nếu đã đăng nhập với quyền ADMIN, tự động chuyển vào trang chủ quản trị
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') {
          const isSubdomain = window.location.hostname.startsWith('admin.');
          if (isSubdomain) {
            router.replace('/');
          } else {
            router.replace('/admin');
          }
          return;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim()) {
      toast.error('Vui lòng nhập số điện thoại hoặc email quản trị');
      return;
    }
    if (!password) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { phone: account.trim(), password });
      if (res.data.success && res.data.data) {
        const user = res.data.data;
        const token = res.data.token;

        // KIỂM TRA QUYỀN ADMIN
        if (user.role !== 'ADMIN') {
          toast.error('Tài khoản không có quyền truy cập trang Quản trị!');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }

        // Lưu thông tin đăng nhập vào localStorage
        if (token) {
          localStorage.setItem('token', token);
          
          // Ghi cookie admin_auth và admin_token hỗ trợ Middleware / Proxy
          const isProd = window.location.hostname.includes('diennuoctruongtin.com');
          const domainAttr = isProd ? '; domain=.diennuoctruongtin.com' : '';
          document.cookie = `admin_auth=1; path=/${domainAttr}; max-age=604800; SameSite=Lax${isProd ? '; Secure' : ''}`;
          document.cookie = `admin_auth=1; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `admin_token=${token}; path=/${domainAttr}; max-age=604800; SameSite=Lax${isProd ? '; Secure' : ''}`;
          document.cookie = `admin_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        }
        localStorage.setItem('user', JSON.stringify(user));

        toast.success('Đăng nhập Quản trị viên thành công!');

        // Điều hướng theo domain hiện tại
        const hostname = window.location.hostname.toLowerCase();
        const isAdminSubdomain =
          hostname === 'admin.diennuoctruongtin.com' ||
          hostname === 'admin.localhost' ||
          hostname.startsWith('admin.');

        setTimeout(() => {
          if (isAdminSubdomain) {
            router.replace('/');
          } else {
            router.replace('/admin');
          }
        }, 300);
      } else {
        toast.error(res.data.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      const error = err as AxiosError<AuthResponse>;
      toast.error(error.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang kiểm tra phiên...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-vh-100 w-100 d-flex align-items-center justify-content-center px-3 py-4"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0078D4 100%)',
        minHeight: '100dvh',
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden w-100"
        style={{
          maxWidth: '400px',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header Logo & Title */}
        <div
          className="text-white text-center py-4 px-3"
          style={{
            background: 'linear-gradient(135deg, #0078D4 0%, #005a9e 100%)',
          }}
        >
          {/* Logo Trường Tín chính thức */}
          <div
            className="d-inline-flex align-items-center justify-content-center bg-white rounded-3 px-3 py-2 mb-2 shadow-sm"
            style={{ maxWidth: '220px' }}
          >
            <Image
              src="/Main_logo.png"
              alt="Logo Trường Tín"
              width={180}
              height={46}
              style={{ objectFit: 'contain', width: 'auto', height: '40px' }}
              priority
            />
          </div>
          <h4 className="fw-bold mb-1 tracking-wide">CỔNG QUẢN TRỊ VIÊN</h4>
          <p className="mb-0 text-white-50" style={{ fontSize: '13px' }}>
            Hệ Thống Quản Trị Cửa Hàng
          </p>
        </div>

        {/* Form Body */}
        <div className="card-body p-4 bg-white">
          <form onSubmit={handleSubmit} noValidate>
            {/* Tài khoản / Số điện thoại */}
            <div className="mb-3">
              <label
                htmlFor="admin-account"
                className="form-label fw-semibold text-secondary mb-1"
                style={{ fontSize: '13px' }}
              >
                Số Điện Thoại / Tài Khoản
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-person-fill"></i>
                </span>
                <input
                  id="admin-account"
                  type="text"
                  className="form-control bg-light border-start-0 ps-1"
                  placeholder="Nhập số điện thoại admin"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="username"
                  required
                  style={{ fontSize: '16px' }} // Khóa zoom Safari iOS
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="mb-4">
              <label
                htmlFor="admin-password"
                className="form-label fw-semibold text-secondary mb-1"
                style={{ fontSize: '13px' }}
              >
                Mật Khẩu
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-key-fill"></i>
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control bg-light border-start-0 border-end-0 ps-1"
                  placeholder="Nhập mật khẩu quản trị"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ fontSize: '16px' }} // Khóa zoom Safari iOS
                />
                <button
                  type="button"
                  className="input-group-text bg-light border-start-0 text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 rounded-pill py-2.5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: '15px' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right fs-5"></i>
                  <span>Đăng Nhập Quản Trị</span>
                </>
              )}
            </button>
          </form>

          {/* Ghi chú bảo mật */}
          <div className="text-center mt-4 pt-3 border-top">
            <small className="text-muted d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '12px' }}>
              <i className="bi bi-lock-fill text-success"></i>
              Khu vực bảo mật nội bộ Cửa Hàng Trường Tín
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
