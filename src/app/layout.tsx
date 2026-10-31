import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "USTR SUITS | Premium Streetwear",
  description: "Premium streetwear storefront and owner dashboard for USTR SUITS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#fffdfc] text-[#29221d]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
