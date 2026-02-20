'use client';

import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast'; // Thêm dòng này

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
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

  return (
    <html lang="vi" suppressHydrationWarning={true}>
      <head>
        <title>Điện Nước Trường Tín | Vật Tư Chính Hãng</title>
        <meta name="description" content="Chuyên cung cấp vật tư điện nước chuyên nghiệp" />
      </head>
      <body className="bg-light" suppressHydrationWarning={true}>
        {/* Thêm thùng chứa thông báo ở đây */}
        <Toaster position="top-right" reverseOrder={false} />
        
        <Header />
        <main style={{ minHeight: '80vh' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}