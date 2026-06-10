import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { AppMotionRoot } from "@/components/AppMotionRoot";
import "./globals.css";
import "@/styles/pillars-2026.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const uiFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
  preload: true,
});

const stampFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-stamp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Barefeast",
  description: "Barefeast: scan your fridge, cook a feast, waste nothing.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Barefeast",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4EFE6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${uiFont.variable} ${stampFont.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <AppMotionRoot>{children}</AppMotionRoot>
      </body>
    </html>
  );
}
