"use client";

import { useState } from 'react';
import api from '@/lib/axios';

export default function ImageUploadDemo() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Phải dùng FormData để gửi file qua mạng thay vì gửi JSON
    const formData = new FormData();
    formData.append("image", file); // Chữ "image" này phải khớp với upload.single('image') ở Backend

    setLoading(true);
    try {
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // Cực kỳ quan trọng
      });
      
      if (res.data.success) {
        alert("Up ảnh thành công Sếp ơi!");
        setPreview(res.data.imageUrl); // Nhận link ảnh xịn từ Cloudinary về
        
        // 💡 TẠI ĐÂY: Bạn có thể lấy res.data.imageUrl để lưu tiếp vào Database (Sản phẩm, Banner...)
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-4 shadow-sm">
      <input type="file" className="form-control mb-3" onChange={handleUpload} accept="image/*" />
      
      {loading && <p className="text-primary fw-bold">Đang tải ảnh lên mây...</p>}
      
      {preview && (
        <div className="mt-3">
          <p>Link ảnh của bạn:</p>
          <img src={preview} alt="Đã up" className="img-thumbnail" style={{ maxWidth: "200px" }} />
        </div>
      )}
    </div>
  );
}
