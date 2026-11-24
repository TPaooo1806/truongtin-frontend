'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import FloatingContact from '@/components/FloatingContact';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isAdminSubdomain, setIsAdminSubdomain] = useState(false);

  useEffect(() => {
    const loadBootstrap = async (): Promise<void> => {
      try {
        await import('bootstrap' + '/dist/js/bootstrap.bundle.min.js');
      } catch (error) {
        console.error("Lỗi nạp Bootstrap:", error);
      }
    };
    loadBootstrap();

    if (typeof window !== 'undefined') {
      const host = window.location.hostname.toLowerCase();
      if (host === 'admin.diennuoctruongtin.com' || host === 'admin.localhost' || host.startsWith('admin.')) {
        setIsAdminSubdomain(true);
      }
    }
  }, []);

  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/dang-nhap';
  const isStandaloneAdmin = isAdminRoute || isAuthRoute || isAdminSubdomain;

  const isFullWidthRoute = pathname === '/gioi-thieu' || pathname === '/lien-he';
  const isHomePage = pathname === '/';

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      
      {!isStandaloneAdmin && <Header />}
      
      {isStandaloneAdmin ? (
        children
      ) : isFullWidthRoute ? (
        <main style={{ minHeight: '80vh' }} className="p-0 m-0">
          {children}
        </main>
      ) : isHomePage ? (
        <main 
          className="container bg-white shadow-sm rounded-4 mb-4 px-2 px-md-3 pb-3" 
          style={{ minHeight: '80vh', marginTop: '6px', paddingTop: '4px' }}
        >
          {children}
        </main>
      ) : (
        <main 
          className="container bg-white shadow-sm rounded-4 my-4 p-3 p-md-4" 
          style={{ minHeight: '80vh' }}
        >
          {children}
        </main>
      )}

      {!isStandaloneAdmin && <Footer />}
      {!isStandaloneAdmin && <FloatingContact />}
    </>
  );
}
