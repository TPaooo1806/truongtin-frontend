"use client";
import { useRouter } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();

  if (totalPages <= 1) return null;

  const handlePageChange = (newPage: number) => {
    // Sử dụng scroll: false để khi đổi trang không bị giật lên đầu trang làm mất bối cảnh
    router.push(`/san-pham?page=${newPage}`, { scroll: false });
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <nav>
        <ul className="pagination shadow-sm">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link text-danger fw-bold shadow-none" onClick={() => handlePageChange(currentPage - 1)}>
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          
          {Array.from({ length: totalPages }, (_, i) => (
            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
              <button 
                className={`page-link fw-bold shadow-none ${currentPage === i + 1 ? 'bg-danger border-danger text-white' : 'text-dark'}`} 
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link text-danger fw-bold shadow-none" onClick={() => handlePageChange(currentPage + 1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
