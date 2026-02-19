import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/interface/ui/providers";

export const metadata: Metadata = {
  title: "RSS Reader",
  description: "RSS Reader MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
