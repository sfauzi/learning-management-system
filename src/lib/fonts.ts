import localFont from "next/font/local";

/**
 * Inter, self-hosted from src/fonts so the build never depends on a network
 * request to Google Fonts and there is no runtime third-party request.
 * `variable` exposes it as --font-inter for the Tailwind theme.
 */
export const inter = localFont({
  src: [
    {
      path: "../fonts/Inter-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  preload: true,
});
