import type { Metadata } from "next";
import { IBM_Plex_Sans, Noto_Sans_SC } from "next/font/google";
import { AdminFeedbackProvider } from "@/components/admin-feedback";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
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
      <body className={`${ibmPlexSans.variable} ${notoSansSC.variable}`}>
        <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
      </body>
    </html>
  );
}
