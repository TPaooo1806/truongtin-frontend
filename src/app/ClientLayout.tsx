'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import FloatingContact from '@/components/FloatingContact';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const loadBootstrap = async (): Promise<void> => {
      try {
        await import('bootstrap' + '/dist/js/bootstrap.bundle.min.js');
      } catch (error) {
        console.error("Lỗi nạp Bootstrap:", error);
      }
    };
    loadBootstrap();
  }, []);

  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      
      {!isAdminRoute && <Header />}
      
      {isAdminRoute ? (
        children
      ) : (
        <main 
          className="container bg-white shadow-sm rounded-4 my-4 p-3 p-md-4" 
          style={{ minHeight: '80vh' }}
        >
          {children}
        </main>
      )}

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingContact />}
    </>
  );
}
