import type { Metadata } from "next";
import { PageProgress } from "@/components/shared/PageProgress";
import "./globals.css";

export const metadata: Metadata = {
  title: "启航 · 思政智能体",
  description:
    "面向空乘专业思政课的「人工智能+」教学智能体——智能学伴 · 教师工作台 · 研讨社区",
};

/**
 * 不用 next/font/google：扣子构建沙箱拉不到 Google Fonts，
 * 会在 Noto_Serif_SC 等处报 Cannot read properties of null。
 * 字体走 globals.css 系统栈 / 本地回退。
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <PageProgress />
        {children}
      </body>
    </html>
  );
}
