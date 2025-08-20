import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import AuthProvider from "@/components/providers/auth-provider";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GreekDash",
  description: "All-in-one chapter management, made easy.",
  keywords: ["GreekDash", "chapter management", "Greek community", "chapter operations"],
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "GreekDash",
    url: "https://greekdash.com",
    images: [
      {
        url: "https://greekdash.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "GreekDash - Complete Greek Life Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GreekDash - Run Your Chapter Like a Pro",
    description: "All-in-one chapter management, made easy.",
    images: ["https://greekdash.com/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png" }
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
