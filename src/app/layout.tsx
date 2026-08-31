import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pay-Flow",
  description: "Personal finance and salary allocation tracker.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Pay-Flow",
    statusBarStyle: "black-translucent",
    startupImage: [
      "/allo_logo_v4.png",
    ],
  },
  icons: {
    icon: "/allo_logo_v4.png",
    apple: "/allo_logo_v4.png",
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen pb-safe">
        {children}
      </body>
    </html>
  );
}
