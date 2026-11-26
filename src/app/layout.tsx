import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "An Sao Tử Vi Nam Phái",
  description:
    "Lập lá số Tử Vi Đẩu Số Nam phái, địa bàn cố định, xem Đại hạn và lưu niên.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f3f3f0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" style={{ colorScheme: "only light" }}>
      <body>{children}</body>
    </html>
  );
}
