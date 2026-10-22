"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { signOut } from "@/app/actions/auth";
import { isStaff, roleLabel } from "@/lib/roles";
import type { Profile, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = (staff: boolean, teacher: boolean) => [
  { href: "/my", label: "Dashboard", icon: "home" as const },
  { href: "/my/courses", label: "My courses", icon: "book" as const },
  { href: "/course", label: "Course catalogue", icon: "grid" as const },
  { href: "/calendar", label: "Calendar", icon: "calendar" as const },
  { href: "/my/grades", label: "Grades", icon: "award" as const },
  ...(teacher ? [{ href: "/my/teaching", label: "My teaching", icon: "users" as const }] : []),
  ...(staff ? [{ href: "/admin", label: "Site admin", icon: "shield" as const }] : []),
];

export function Topbar({
  user,
  settings,
  unread,
}: {
  user: Profile;
  settings: SiteSettings;
  unread: number;
}) {
  const items = navItems(isStaff(user), user.role === "teacher" || isStaff(user));
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/my" && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line-soft)] bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Link href="/my" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/img/logo_bg_white.png" alt={settings.site_name} className="h-8 w-auto" />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[15px] font-bold text-brand">{settings.site_name}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-ink-3">
              {settings.site_tagline}
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 xl:flex">
          {items.slice(0, 6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-link whitespace-nowrap", isActive(item.href) && "nav-link-active")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <form action="/course" className="hidden items-center gap-1.5 rounded-lg bg-soft px-2.5 py-1.5 md:flex">
            <Icon name="search" size={15} className="text-ink-3" />
            <input
              type="search"
              name="q"
              placeholder="Search courses"
              className="w-36 bg-transparent text-[13px] outline-none placeholder:text-ink-4 lg:w-48"
            />
          </form>

          <Link
            href="/message"
            className="rounded-lg p-2 text-ink-2 hover:bg-soft"
            aria-label="Messages"
          >
            <Icon name="message" size={18} />
          </Link>

          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-ink-2 hover:bg-soft"
            aria-label="Notifications"
          >
            <Icon name="bell" size={18} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-soft">
              <Avatar
                name={user.full_name}
                src={
                  user.avatar_path
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.avatar_path}`
                    : null
                }
                size={30}
              />
              <span className="hidden max-w-[120px] truncate text-[13px] font-semibold text-ink sm:block">
                {user.full_name}
              </span>
              <Icon name="chevronDown" size={14} className="text-ink-3" />
            </summary>
            <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-[var(--color-line-soft)] bg-white py-1 shadow-lg">
              <div className="border-b border-[var(--color-line-soft)] px-3 py-2">
                <p className="truncate text-[13px] font-semibold text-ink">{user.full_name}</p>
                <p className="text-[11px] text-ink-3">{roleLabel(user.role)}</p>
              </div>
              <Link href="/user/profile" className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-soft">
                Profile
              </Link>
              <Link href="/my/grades" className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-soft">
                Grades
              </Link>
              <Link href="/message" className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-soft">
                Messages
              </Link>
              <Link href="/my/timeline" className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-soft">
                Timeline
              </Link>
              {isStaff(user) && (
                <Link href="/admin" className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-soft">
                  Site administration
                </Link>
              )}
              <Link href="/" className="block px-3 py-2 text-[13px] text-ink-2 hover:bg-soft">
                Front page
              </Link>
              <form action={signOut} className="border-t border-[var(--color-line-soft)]">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <Icon name="logout" size={14} />
                  Log out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-[var(--color-line-soft)] px-3 py-1.5 xl:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-ink-2",
              isActive(item.href) && "bg-brand-soft text-brand"
            )}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
