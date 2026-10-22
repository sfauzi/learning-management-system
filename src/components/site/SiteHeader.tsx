"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Props = {
  siteName: string;
  tagline: string;
  isAuthed: boolean;
  locale: string;
};

const links = (locale: string) => [
  { href: "/about", label: locale === "id" ? "Tentang" : "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/tutorial", label: locale === "id" ? "Tutorial" : "Tutorial" },
  { href: "/announcements", label: locale === "id" ? "Pengumuman" : "Announcements" },
];

export function SiteHeader({ siteName, tagline, isAuthed, locale }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const other = locale === "id" ? "en" : "id";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line-soft)] bg-white/95 backdrop-blur">
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/img/logo_bg_white.png" alt={siteName} className="h-9 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-[17px] font-bold text-brand">{siteName}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
              {tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links(locale).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "nav-link",
                pathname === l.href && "nav-link-active"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={isAuthed ? "/my" : "/login"}
            className="nav-link font-semibold text-brand"
          >
            {isAuthed
              ? locale === "id"
                ? "Dasbor"
                : "Dashboard"
              : locale === "id"
                ? "Masuk"
                : "Login"}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/lang/${other}?next=${encodeURIComponent(pathname)}`}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-soft"
            title="Change language"
          >
            <Icon name="globe" size={15} />
            {locale.toUpperCase()}
          </Link>
          <Link href={isAuthed ? "/my" : "/login"} className="btn-brand btn-sm hidden sm:inline-flex">
            {isAuthed
              ? locale === "id"
                ? "Buka Dasbor"
                : "Dashboard"
              : locale === "id"
                ? "Masuk ke LMS"
                : "Login to LMS"}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-ghost px-2 md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            <Icon name={open ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--color-line-soft)] bg-white md:hidden">
          <div className="container-page flex flex-col py-2">
            {links(locale).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-ink-2 hover:bg-soft"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={isAuthed ? "/my" : "/login"}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-semibold text-brand"
            >
              {isAuthed ? "Dashboard" : "Login"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
