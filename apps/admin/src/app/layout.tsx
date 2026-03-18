import type { Metadata } from "next";
import { Noto_Sans_SC, Space_Grotesk } from "next/font/google";
import { AdminFeedbackProvider } from "@/components/admin-feedback";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-noto-sans-sc",
});

export const metadata: Metadata = {
  title: "XBlog Admin",
  description: "Editorial Core management console.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${spaceGrotesk.variable} ${notoSansSC.variable}`}>
        <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
      </body>
    </html>
  );
}
