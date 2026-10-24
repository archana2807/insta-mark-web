import localFont from "next/font/local";
import "@/styles/globals.scss";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/seo";

// Self-hosted fonts (OFL-1.1, Fontsource) — no build-time dependency on Google Fonts, which
// made builds fail on flaky networks. Client choice (24 Oct 2026): Merriweather for headings,
// Lato for body text and the interface (menu, buttons, labels).
const body = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/lato/files/lato-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/@fontsource/lato/files/lato-latin-700-normal.woff2",
      weight: "700",
    },
  ],
  variable: "--font-body",
  display: "swap",
});
const heading = localFont({
  src: "../../node_modules/@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2",
  weight: "300 900",
  variable: "--font-heading",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | Architectural Signage & Road Safety Solutions`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={`${body.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
