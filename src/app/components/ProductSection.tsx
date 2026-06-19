"use client";
import { useEffect, useState, useRef } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "../type";

export default function ProductSection({
  title,
  products,
  link,
}: {
  title: string;
  products: Product[];
  link?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 0);
        setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
      }
    };
    
    if (products.length > 6 && scrollRef.current) {
      handleScroll();
      scrollRef.current.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      if (scrollRef.current) scrollRef.current.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const isSlider = products.length > 6;

  return (
    <section className="mb-5 position-relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="d-flex justify-content-between align-items-end mb-3">
        <h4
          className="fw-bold mb-0 d-flex align-items-center gap-2 fs-5 fs-md-4"
          style={{ color: "#1a3a5c" }}
        >
          <span
            style={{
              width: "5px",
              height: "20px",
              display: "inline-block",
              backgroundColor: "#0078D4",
            }}
          ></span>
          {title}
        </h4>
        {link && (
          <a
            href={link}
            className="fw-bold text-decoration-none small hover-underline"
            style={{ color: "#0078D4" }}
          >
            Xem tất cả <i className="bi bi-chevron-right" style={{ fontSize: "0.7rem" }}></i>
          </a>
        )}
      </div>

      <div className="position-relative">
        {isSlider && showLeft && (
          <button
            className="btn btn-white shadow rounded-circle position-absolute top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center border slider-btn-prev d-none d-md-flex"
            style={{
              width: "42px",
              height: "42px",
              left: "-15px",
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
            onClick={() => scroll('left')}
          >
            <i className="bi bi-chevron-left fs-5"></i>
          </button>
        )}

        {isSlider && showRight && (
          <button
            className="btn btn-white shadow rounded-circle position-absolute top-50 translate-middle-y z-3 d-flex align-items-center justify-content-center border slider-btn-next d-none d-md-flex"
            style={{
              width: "42px",
              height: "42px",
              right: "-15px",
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
            onClick={() => scroll('right')}
          >
            <i className="bi bi-chevron-right fs-5"></i>
          </button>
        )}

        {isSlider ? (
          <div 
            ref={scrollRef}
            className="row flex-nowrap overflow-x-auto g-2 g-md-3 hide-scrollbar pb-2"
            style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
          >
            {products.map((p) => (
              <div key={p.id} className="col-6 col-md-4 col-lg-2 d-flex align-items-stretch" style={{ scrollSnapAlign: 'start' }}>
                <ProductCard item={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-2 g-md-3">
            {products.map((p) => (
              <div className="col d-flex align-items-stretch" key={p.id}>
                <ProductCard item={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
