"use client";
import React, { useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

interface ImportExcelModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ onClose, onSuccess }: ImportExcelModalProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, text: "" });
  const [report, setReport] = useState<any>(null);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExcelFile(e.target.files[0]);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const startImport = async () => {
    if (!excelFile) {
      toast.error("Vui lòng chọn file Excel!");
      return;
    }

    setIsProcessing(true);
    setReport(null);
    let imagesMap: Record<string, string> = {};

    try {
      // 1. Upload Images to Cloudinary if any are selected
      if (imageFiles.length > 0) {
        setProgress({ current: 0, total: imageFiles.length, text: "Đang lấy signature từ máy chủ..." });
        
        // Get signature once or per batch depending on expiration, but it's usually valid for 1 hour.
        const sigRes = await api.get('/api/upload/signature');
        if (!sigRes.data.success) throw new Error("Không thể lấy signature");
        const sigData = sigRes.data.data;

        const CHUNK_SIZE = 5;
        for (let i = 0; i < imageFiles.length; i += CHUNK_SIZE) {
          const chunk = imageFiles.slice(i, i + CHUNK_SIZE);
          
          setProgress({ current: i, total: imageFiles.length, text: `Đang tải ảnh lên Cloudinary (${i}/${imageFiles.length})...` });

          const uploadPromises = chunk.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", sigData.apiKey);
            formData.append("timestamp", sigData.timestamp.toString());
            formData.append("signature", sigData.signature);
            formData.append("folder", sigData.folder);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
              method: "POST",
              body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
              return { name: file.name, url: data.secure_url };
            }
            return null;
          });

          const results = await Promise.all(uploadPromises);
          results.forEach(res => {
            if (res) imagesMap[res.name] = res.url;
          });
        }
      }

      setProgress({ current: 0, total: 0, text: "Đang nạp file Excel vào máy chủ..." });

      // 2. Upload Excel + imagesMap to Backend
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("imagesMap", JSON.stringify(imagesMap));

      const res = await api.post("/api/products/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setReport(res.data.data);
        onSuccess(); // refresh table
      }

    } catch (error: any) {
      console.error("Lỗi import:", error);
      toast.error(error.response?.data?.message || error.message || "Lỗi khi import file Excel!");
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0, text: "" });
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-success">
              <i className="bi bi-cloud-arrow-up me-2"></i> Import Sản Phẩm Siêu Tốc
            </h5>
            {!isProcessing && (
              <button type="button" className="btn-close" onClick={onClose}></button>
            )}
          </div>

          <div className="modal-body p-4">
            {!report ? (
              <div className="row g-4">
                {/* Bước 1: Chọn Excel */}
                <div className="col-12">
                  <div className="p-3 border rounded-3 bg-light">
                    <h6 className="fw-bold mb-3">Bước 1: Chọn File Excel</h6>
                    <input 
                      type="file" 
                      className="form-control" 
                      accept=".xlsx, .xls"
                      onChange={handleExcelChange}
                      disabled={isProcessing}
                    />
                    <small className="text-muted mt-2 d-block">
                      Tải form mẫu tại <a href={`${process.env.NEXT_PUBLIC_API_URL || 'https://truongtin-api.onrender.com'}/api/products/template`} target="_blank" className="text-decoration-none">đây</a>.
                    </small>
                  </div>
                </div>

                {/* Bước 2: Chọn Ảnh (Tùy chọn) */}
                <div className="col-12">
                  <div className="p-3 border rounded-3 bg-light">
                    <h6 className="fw-bold mb-3">Bước 2: Tải lên thư mục ảnh (Tùy chọn)</h6>
                    <p className="small text-muted mb-2">
                      Nếu trong Excel bạn có dùng Tên File Ảnh (VD: <code>bong-den.jpg</code>), hãy chọn toàn bộ ảnh từ máy tính ở đây. Hệ thống sẽ tự động upload lên mây và nối ảnh vào sản phẩm giúp bạn.
                    </p>
                    <input 
                      type="file" 
                      className="form-control" 
                      multiple 
                      accept="image/*"
                      onChange={handleImagesChange}
                      disabled={isProcessing}
                    />
                    {imageFiles.length > 0 && (
                      <span className="badge bg-primary mt-2">Đã chọn {imageFiles.length} ảnh</span>
                    )}
                  </div>
                </div>

                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="col-12 text-center mt-4">
                    <div className="spinner-border text-success mb-2" role="status"></div>
                    <p className="fw-bold text-success mb-0">{progress.text}</p>
                    {progress.total > 0 && (
                      <div className="progress mt-2" style={{ height: "10px" }}>
                        <div 
                          className="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Kết quả Report
              <div className="animate__animated animate__fadeIn">
                <div className="text-center mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "3rem" }}></i>
                  <h4 className="fw-bold mt-2">Import Hoàn Tất!</h4>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-success bg-opacity-10 rounded-3 text-success border border-success border-opacity-25">
                      <h6 className="fw-bold mb-1">Thành công</h6>
                      <h3 className="mb-0">{report.successCount} <span className="fs-6 fw-normal">sản phẩm</span></h3>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-danger bg-opacity-10 rounded-3 text-danger border border-danger border-opacity-25">
                      <h6 className="fw-bold mb-1">Bị lỗi (Thất bại)</h6>
                      <h3 className="mb-0">{report.failedCount} <span className="fs-6 fw-normal">sản phẩm</span></h3>
                    </div>
                  </div>
                </div>

                {report.warnings && report.warnings.length > 0 && (
                  <div className="alert alert-warning border-warning">
                    <h6 className="fw-bold text-dark mb-2">
                      <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                      Cảnh báo ({report.warnings.length}):
                    </h6>
                    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                      <ul className="mb-0 small text-dark list-unstyled">
                        {report.warnings.map((w: any, idx: number) => (
                          <li key={idx} className="mb-1 border-bottom border-warning pb-1">
                            <strong>Dòng {w.row} ({w.name}):</strong> {w.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {report.errors && report.errors.length > 0 && (
                  <div className="alert alert-danger border-danger mt-3">
                    <h6 className="fw-bold mb-2">
                      <i className="bi bi-x-circle-fill me-2"></i>
                      Lỗi ({report.errors.length}):
                    </h6>
                    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                      <ul className="mb-0 small list-unstyled">
                        {report.errors.map((e: any, idx: number) => (
                          <li key={idx} className="mb-1 border-bottom border-danger pb-1 border-opacity-25">
                            <strong>Dòng {e.row}:</strong> {e.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer border-0 pt-0">
            {!report ? (
              <>
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose} disabled={isProcessing}>Hủy</button>
                <button type="button" className="btn btn-success rounded-pill px-4 shadow-sm" onClick={startImport} disabled={isProcessing || !excelFile}>
                  <i className="bi bi-cloud-upload me-2"></i> Bắt Đầu Import
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-success rounded-pill px-4 shadow-sm" onClick={onClose}>
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
