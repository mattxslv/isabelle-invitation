import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Pinyon_Script } from "next/font/google";
import "./globals.css";
import "./finishing.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const script = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Khloe Isabelle's First Birthday & Christening",
  description: "You're invited to celebrate Isabelle's christening and first birthday on Tuesday, November 17, 2026.",
  // Private family invitation: keep it out of search engines.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#FBF8F2",
  colorScheme: "light",
};

// Marks the page as JS-capable before first paint so scroll reveals can
// start hidden. Without JS, everything stays visible.
const JS_FLAG = `
document.documentElement.classList.add('js');
if ((location.pathname === '/' || location.pathname.startsWith('/godparents')) &&
    performance.getEntriesByType('navigation')[0]?.type === 'reload') {
  document.documentElement.dataset.previousScrollRestoration = history.scrollRestoration;
  document.documentElement.dataset.reloadTop = 'true';
  history.scrollRestoration = 'manual';
  history.replaceState(history.state, '', location.pathname + location.search);
  window.scrollTo({top: 0, left: 0, behavior: 'instant'});
}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${script.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
