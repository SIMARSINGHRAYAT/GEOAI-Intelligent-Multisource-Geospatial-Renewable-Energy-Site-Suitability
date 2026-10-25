import type { Metadata } from "next";
import type { ReactNode } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoRenew AI",
  description:
    "Intelligent multisource geospatial renewable energy site suitability and decision support platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">{children}</body>
    </html>
  );
}
