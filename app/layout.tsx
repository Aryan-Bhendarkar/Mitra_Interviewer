import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";

import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mitra AI - Your AI Interview Companion",
  description: "Your trusted AI companion for mastering interviews through intelligent practice, real-time guidance, and personalized feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  return (
    <html lang="en" className="dark" suppressHydrationWarning={true}>
      <body className={`${monaSans.className} antialiased pattern`}>
        {children}

        <Toaster />
      </body>
    </html>
  );
}
