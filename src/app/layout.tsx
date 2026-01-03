import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import PWAInstall from "@/components/PWAInstall";

export const metadata: Metadata = {
  title: "Record 365 - 렌탈 분쟁 해결",
  description: "렌터카, 월세 계약 시 사진 기록으로 분쟁 예방",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Record 365",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Record 365",
    title: "Record 365 - 렌탈 분쟁 해결",
    description: "렌터카, 월세 계약 시 사진 기록으로 분쟁 예방",
  },
  twitter: {
    card: "summary",
    title: "Record 365 - 렌탈 분쟁 해결",
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
        <meta name="naver-site-verification" content="7468b8d5368e139e785aec481aead82bc6e45a8e" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Record 365" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script
          src="https://developers.kakao.com/sdk/js/kakao.min.js"
          async
        ></script>
      </head>
      <body className="antialiased">
      <Script id="kakao-init" strategy="afterInteractive">
          {`
            function initKakao() {
              try {
                if (typeof window !== 'undefined' && window.Kakao) {
                  if (!window.Kakao.isInitialized()) {
                    window.Kakao.init('f2bc10f532d5ea14883a44ce3fe509ea');
                    console.log('✅ Kakao SDK initialized');
                  }
                } else if (typeof window !== 'undefined') {
                  setTimeout(initKakao, 100);
                }
              } catch (error) {
                console.error('❌ Kakao SDK init error:', error);
              }
            }
            
            if (typeof window !== 'undefined') {
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initKakao);
              } else {
                initKakao();
              }
            }
          `}
        </Script>
        {children}
        <PWAInstall />
      </body>
    </html>
  );
}