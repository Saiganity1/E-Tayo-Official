import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

import { PermitProvider } from "../context/PermitContext";

export const metadata: Metadata = {
  title: "e-Tayo | Government Permit Portal",
  description: "Secure and fast application for building, locational, and occupancy permits.",
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
        <PermitProvider>
          {children}
        </PermitProvider>
      </body>
    </html>
  );
}
