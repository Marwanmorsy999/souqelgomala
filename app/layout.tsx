import type { Metadata, Viewport } from "next";
import { Cairo, Inter } from "next/font/google";
import { AppProviders } from "./providers";
import StructuredDataDefault from "@/components/home/StructuredData";
const StructuredData = StructuredDataDefault;
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "900"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: "سوق الجملة | Souk El Gomla — بقالة جملة وقطاعي في كفر شكر",
  description:
    "سوق الجملة: بقالة جملة وقطاعي بأسعار مناسبة للبيت والمحل. توصيل في كفر شكر والقليوبية، دفع كاش عند الاستلام.",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  keywords: [
    "سوق الجملة",
    "Souk Elgomla",
    "بقالة جملة",
    "أسعار جملة",
    "توصيل كفر شكر",
    "سوبرماركت",
    "مواد غذائية",
  ],
  openGraph: {
    title: "سوق الجملة | Souk El Gomla — بقالة جملة وقطاعي في كفر شكر",
    description:
      "بقالة جملة وقطاعي بأسعار مناسبة للبيت والمحل. توصيل في كفر شكر والقليوبية، دفع كاش عند الاستلام.",
    url: "/",
    siteName: "سوق الجملة",
    locale: "ar_EG",
    type: "website",
    images: [{ url: "/og-image.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "سوق الجملة | Souk El Gomla",
    description:
      "بقالة جملة وقطاعي في كفر شكر، توصيل سريع ودفع كاش عند الاستلام.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
    colorScheme: "dark",
  themeColor: "#0f0f0f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <StructuredData />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
