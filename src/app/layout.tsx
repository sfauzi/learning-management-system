import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { RouteProgress } from "@/components/ui/RouteProgress";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "LMS | Learning Management System",
    template: "%s | LMS",
  },
  description:
    "Learning Management System — Telkom University. Course delivery, assignments, quizzes, forums and gradebook.",
  icons: { icon: "/assets/img/favicon.png" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
