import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Player",
  description: "Player de vídeos MP4 local",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="m-0 p-0 bg-gray-50">{children}</body>
    </html>
  );
}
