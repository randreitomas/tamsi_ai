import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tamsi",
  description: "AI academic co-pilot for FEU Tech students"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
