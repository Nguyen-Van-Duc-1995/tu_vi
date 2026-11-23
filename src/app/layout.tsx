import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "An Sao Tử Vi Nam Phái | 12 địa chi cố định",
  description: "Lập lá số Tử Vi Đẩu Số Nam phái, địa bàn cố định, xem Đại hạn và lưu niên.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
