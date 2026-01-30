import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VLM 商品标签器 | AI 视觉智能打标",
  description: "上传商品 Excel 文件，通过 AI 视觉模型自动生成搜索友好的特征标签",
  keywords: ["VLM", "商品标签", "AI标签", "视觉识别", "电商"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
