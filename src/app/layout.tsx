import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Tử Vi - Lập Lá Số Tử Vi Đẩu Số Nam Phái";

const description =
  "Lập lá số Tử Vi Đẩu Số Nam Phái trực tuyến. " +
  "An sao tử vi, xem cung mệnh, đại hạn, lưu niên, " +
  "tam hợp và xung chiếu theo ngày giờ sinh.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tuvi.softsama.com"),

  title,
  description,

  applicationName: "Tử Vi Softsama",

  alternates: {
    canonical: "https://tuvi.softsama.com",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  openGraph: {
    title,
    description,
    url: "https://tuvi.softsama.com",
    siteName: "Tử Vi Softsama",
    locale: "vi_VN",
    type: "website",
  },

  twitter: {
    card: "summary",
    title,
    description,
  },
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
