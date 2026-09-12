import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "off r39'x 決済モック",
  description: "決済システムの画面遷移確認用モック（実決済処理は含みません）",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muted/30">
        <StoreProvider>
          <Header />
          <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
            {children}
          </main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
