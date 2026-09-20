import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `${SITE_NAME}: get your number saved on hundreds of phones`,
  description:
    "Join the list. When it fills, every member gets one contact file that saves everyone's number, so your WhatsApp Status reaches more people.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1330" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
