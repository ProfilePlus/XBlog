import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, Playfair_Display } from "next/font/google";
import { AdminFeedbackProvider } from "@/components/admin-feedback";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-sc",
});

export const metadata: Metadata = {
  title: "XBlog Admin",
  description: "Editorial Core management console.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${playfairDisplay.variable} ${inter.variable} ${notoSansSC.variable}`}>
        <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
      </body>
    </html>
  );
}
