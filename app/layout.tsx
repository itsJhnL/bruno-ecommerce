import type { Metadata, Viewport } from "next";
import { Inter_Tight, Jost } from "next/font/google";

import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/json-ld";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { defaultOgImage, OG_DEFAULT } from "@/lib/utils/og";
import { SITE, siteUrl } from "@/lib/utils/site";

import "./globals.css";

/**
 * Self-hosted at build time by next/font — no render-blocking request to
 * fonts.googleapis.com, no FOUT, and no third-party connection on first paint.
 * The CSS variables are consumed by --font-display / --font-sans in globals.css.
 */
const display = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: siteUrl(),
    images: [defaultOgImage(`${SITE.name} — ${SITE.tagline}`)],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [OG_DEFAULT],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // No `icons` entry on purpose. Next.js picks up app/icon.svg,
  // app/favicon.ico and app/apple-icon.png by convention and emits the right
  // tags in the right order. Declaring one here as well produced a second
  // <link rel="icon"> pointing at the old seal, which sets `font-family` to a
  // face this project stopped using — so it rendered differently per machine.
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08070a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Server-rendered default. The inline script below overwrites it before
      // paint if the visitor has chosen otherwise.
      data-theme="dark"
      suppressHydrationWarning
      className={`no-js ${display.variable} ${sans.variable}`}
    >
      <head>
        {/* Both of these MUST run before first paint. The first removes .no-js
            so reveal animations do not flash; the second stamps data-theme so a
            light-mode visitor never sees a black frame. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('no-js')`,
          }}
        />
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
      </body>
    </html>
  );
}
