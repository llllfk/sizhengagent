import type { Metadata } from "next";
import { Ma_Shan_Zheng, Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import { PageProgress } from "@/components/shared/PageProgress";
import "./globals.css";

const brand = Ma_Shan_Zheng({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

const display = Noto_Serif_SC({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Noto_Sans_SC({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "启航 · 思政智能体",
  description:
    "面向空乘专业思政课的「人工智能+」教学智能体——智能学伴 · 教师工作台 · 研讨社区",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        className={`${brand.variable} ${display.variable} ${body.variable} min-h-screen antialiased`}
      >
        <PageProgress />
        {children}
      </body>
    </html>
  );
}
