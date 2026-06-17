import { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'), // Replace with actual domain when deployed
  title: 'Điện Nước Trường Tín | Chuyên cung cấp vật tư điện nước chính hãng giá sỉ Nơ Trang Long, quận Bình Thạnh',
  description: 'Chuyên cung cấp vật tư điện nước chuyên nghiệp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning={true}>
      <body className="bg-white" suppressHydrationWarning={true}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}