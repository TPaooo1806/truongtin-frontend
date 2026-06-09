"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardData {
  summary: {
    totalRevenue: number;
    approvedRevenue: number;
    pendingRevenue: number;
    totalOrdersCount: number;
    approvedOrdersCount: number;
    pendingOrdersCount: number;
    totalProductsCount: number;
  };
  revenueChart: {
    labels: string[];
    data: number[];
  };
  topProducts: {
    labels: string[];
    data: number[];
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("thisMonth"); // thisWeek, thisMonth, thisYear

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/reports/dashboard?range=${range}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi tải dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [range]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!data)
    return (
      <div className="text-center mt-5 text-danger fw-bold">
        Không thể tải dữ liệu Dashboard!
      </div>
    );

  // Xử lý dữ liệu cho Recharts
  const chartData = data.revenueChart.labels.map((label, idx) => ({
    name: label,
    DoanhThu: data.revenueChart.data[idx],
  }));

  const topProductsList = data.topProducts.labels.map((label, idx) => ({
    name: label,
    sold: data.topProducts.data[idx],
  }));

  return (
    <div className="container-fluid py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            Bảng điều khiển thống kê 🚀
          </h3>
          <p className="text-muted mb-0">
            Theo dõi doanh thu và tình hình kinh doanh của Trường Tín.
          </p>
        </div>
        <div>
          <select
            className="form-select border-primary text-primary fw-bold"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="thisWeek">7 Ngày Qua</option>
            <option value="thisMonth">30 Ngày Qua</option>
            <option value="thisYear">Năm Nay</option>
          </select>
        </div>
      </div>

      {/* 4 THẺ TỔNG QUAN */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden">
            <div className="card-body p-4 position-relative">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle me-3">
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
                <h6 className="text-muted fw-bold mb-0 text-uppercase">
                  Doanh Thu (Đã Duyệt)
                </h6>
              </div>
              <h3 className="fw-bold text-dark mb-0">
                {data.summary.approvedRevenue.toLocaleString("vi-VN")} đ
              </h3>
              <div
                className="position-absolute"
                style={{ bottom: "-15px", right: "-15px", opacity: 0.05 }}
              >
                <i
                  className="bi bi-cash-stack"
                  style={{ fontSize: "100px" }}
                ></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden">
            <div className="card-body p-4 position-relative">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle me-3">
                  <i className="bi bi-cart-check fs-4"></i>
                </div>
                <h6 className="text-muted fw-bold mb-0 text-uppercase">
                  Tổng Đơn Hàng
                </h6>
              </div>
              <h3 className="fw-bold text-dark mb-0">
                {data.summary.totalOrdersCount}{" "}
                <span className="fs-6 text-muted fw-normal">đơn</span>
              </h3>
              <div
                className="position-absolute"
                style={{ bottom: "-15px", right: "-15px", opacity: 0.05 }}
              >
                <i
                  className="bi bi-cart-check"
                  style={{ fontSize: "100px" }}
                ></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden">
            <div className="card-body p-4 position-relative">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle me-3">
                  <i className="bi bi-hourglass-split fs-4"></i>
                </div>
                <h6 className="text-muted fw-bold mb-0 text-uppercase">
                  Đơn Chờ Xử Lý
                </h6>
              </div>
              <h3 className="fw-bold text-dark mb-0">
                {data.summary.pendingOrdersCount}{" "}
                <span className="fs-6 text-muted fw-normal">đơn</span>
              </h3>
              <div
                className="position-absolute"
                style={{ bottom: "-15px", right: "-15px", opacity: 0.05 }}
              >
                <i
                  className="bi bi-hourglass-split"
                  style={{ fontSize: "100px" }}
                ></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden">
            <div className="card-body p-4 position-relative">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle me-3">
                  <i className="bi bi-box-seam fs-4"></i>
                </div>
                <h6 className="text-muted fw-bold mb-0 text-uppercase">
                  Tổng Sản Phẩm
                </h6>
              </div>
              <h3 className="fw-bold text-dark mb-0">
                {data.summary.totalProductsCount}{" "}
                <span className="fs-6 text-muted fw-normal">sản phẩm</span>
              </h3>
              <div
                className="position-absolute"
                style={{ bottom: "-15px", right: "-15px", opacity: 0.05 }}
              >
                <i className="bi bi-box-seam" style={{ fontSize: "100px" }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* BIỂU ĐỒ DOANH THU */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 p-4">
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-graph-up-arrow me-2 text-primary"></i>Biến
              Động Doanh Thu
            </h5>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString("vi-VN")} đ`,
                      "Doanh Thu",
                    ]}
                    cursor={{ fill: "#f8f9fa" }}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="DoanhThu"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TOP SẢN PHẨM BÁN CHẠY */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 p-4">
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-star-fill me-2 text-warning"></i>Top Bán Chạy
            </h5>

            {topProductsList.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {topProductsList.map((prod, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center p-3 rounded-3 bg-light border"
                  >
                    <div
                      className="bg-white rounded-circle d-flex justify-content-center align-items-center fw-bold shadow-sm me-3 text-primary"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "1.1rem",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-grow-1">
                      <h6
                        className="mb-1 fw-bold text-dark"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {prod.name}
                      </h6>
                      <div className="small text-danger fw-bold">
                        <i className="bi bi-cart-check me-1"></i>Đã bán:{" "}
                        {prod.sold}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted mt-5">
                <i className="bi bi-box-seam fs-1 opacity-25 d-block mb-3"></i>
                Chưa có dữ liệu bán hàng.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
