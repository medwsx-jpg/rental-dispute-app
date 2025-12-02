import type { Metadata } from "next";
import "./globals.css";
import PWAInstall from "@/components/PWAInstall";

export const metadata: Metadata = {
  title: "렌탈체크 - 렌탈 분쟁 해결",
  description: "렌터카, 월세 계약 시 사진 기록으로 분쟁 예방",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "렌탈체크",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "렌탈체크",
    title: "렌탈체크 - 렌탈 분쟁 해결",
    description: "렌터카, 월세 계약 시 사진 기록으로 분쟁 예방",
  },
  twitter: {
    card: "summary",
    title: "렌탈체크 - 렌탈 분쟁 해결",
    description: "렌터카, 월세 계약 시 사진 기록으로 분쟁 예방",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="렌탈체크" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="antialiased">
        {children}
        <PWAInstall />
      </body>
    </html>
  );
}