'use client';
import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

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

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone: '', password: '', name: '' });
  const [errors, setErrors] = useState({ phone: '', password: '', name: '' });

  const validateForm = () => {
    let valid = true;
    const newErrors = { phone: '', password: '', name: '' };

    if (!isLogin && formData.name.trim().length < 2) {
      newErrors.name = "Họ tên phải có ít nhất 2 ký tự";
      valid = false;
    }

    const vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
    if (!formData.phone) {
      newErrors.phone = "Số điện thoại không được để trống";
      valid = false;
    } else if (!vnf_regex.test(formData.phone)) {
      newErrors.phone = "SĐT không đúng định dạng (10 số)";
      valid = false;
    }

    const pass_regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
      valid = false;
    } else if (!pass_regex.test(formData.password)) {
      newErrors.password = "Mật khẩu cần ít nhất 6 ký tự, 1 chữ Hoa, 1 số";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    const url = isLogin ? 'login' : 'register';
    
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/${url}`, formData);
      if (res.data.success) {
        toast.success(res.data.message);
        if (isLogin && res.data.token && res.data.data) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.data));
          const expiryTime = new Date().getTime() + 60 * 60 * 1000; 
    localStorage.setItem('expiry', expiryTime.toString());
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setIsLogin(true);
          setErrors({ phone: '', password: '', name: '' });
        }
      }
    } catch (err) {
      const error = err as AxiosError<AuthResponse>;
      toast.error(error.response?.data?.message || "Lỗi máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="authModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-0 pb-0">
            <button type="button" className="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body p-4 pt-0">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-danger text-uppercase">{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h3>
              <p className="text-muted small">Cửa hàng điện nước Trường Tín</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {!isLogin && (
                <div className="mb-3">
                  <label className="small fw-bold mb-1 text-dark">Họ và Tên</label>
                  <input 
                    type="text" 
                    className={`form-control custom-input rounded-3 px-3 py-2 shadow-none border-2 ${errors.name ? 'border-danger' : 'border-secondary-subtle'}`}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if(errors.name) setErrors({...errors, name: ''});
                    }} 
                  />
                  <div className={`mt-1 ms-1 ${errors.name ? 'text-danger fw-bold' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                    {errors.name || "Nhập tên thật để thuận tiện bảo hành"}
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <label className="small fw-bold mb-1 text-dark">Số điện thoại</label>
                <input 
                  type="tel" 
                  className={`form-control custom-input rounded-3 px-3 py-2 shadow-none border-2 ${errors.phone ? 'border-danger' : 'border-secondary-subtle'}`}
                  placeholder="Ví dụ: 0912345678"
                  onChange={(e) => {
                    setFormData({...formData, phone: e.target.value});
                    if(errors.phone) setErrors({...errors, phone: ''});
                  }} 
                />
                <div className={`mt-1 ms-1 ${errors.phone ? 'text-danger fw-bold' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                  {errors.phone || "Sử dụng số điện thoại chính chủ để đăng nhập"}
                </div>
              </div>

              <div className="mb-3">
                <label className="small fw-bold mb-1 text-dark">Mật khẩu</label>
                <input 
                  type="password" 
                  className={`form-control custom-input rounded-3 px-3 py-2 shadow-none border-2 ${errors.password ? 'border-danger' : 'border-secondary-subtle'}`}
                  placeholder="Nhập mật khẩu của bạn..."
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    if(errors.password) setErrors({...errors, password: ''});
                  }} 
                />
                <div className={`mt-1 ms-1 ${errors.password ? 'text-danger fw-bold' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                  {errors.password || "Ít nhất 6 ký tự, gồm 1 chữ Hoa và 1 Số"}
                </div>
              </div>

              <button type="submit" className="btn btn-danger w-100 rounded-3 fw-bold py-2 mt-3 shadow-sm" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm"></span> : (isLogin ? 'VÀO CỬA HÀNG' : 'ĐĂNG KÝ NGAY')}
              </button>
            </form>

            <div className="text-center mt-4 border-top pt-3">
               <button 
                type="button"
                className="btn btn-link btn-sm text-danger fw-bold text-decoration-none shadow-none"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({ phone: '', password: '', name: '' });
                }}
              >
                {isLogin ? 'Chưa có tài khoản? Đăng ký tại đây' : 'Đã có tài khoản? Đăng nhập ngay'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}