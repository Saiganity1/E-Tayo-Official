import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

import { PermitProvider } from "../context/PermitContext";
import { LanguageProvider } from "../context/LanguageContext";

import { Viewport } from "next";

export const metadata: Metadata = {
  title: "eTAYO | Government Permit Portal",
  description: "Secure and fast application for building, locational, and occupancy permits.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-mark.png",
    shortcut: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "eTAYO Sto. Tomas",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0038A8",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={jakarta.variable}
    >
      <body>
        <LanguageProvider>
          <PermitProvider>
            {children}
          </PermitProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
