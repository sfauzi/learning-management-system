"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isStaff } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type CourseLink = { id: number; fullname: string; shortname: string; color: string };

export function Drawer({
  user,
  courses,
  collapsed: initialCollapsed = false,
}: {
  user: Profile;
  courses: CourseLink[];
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  /**
   * Collapse is applied locally for instant feedback and mirrored into a cookie
   * for the next server render. A server action would round-trip and the router
   * cache can serve the old layout, which made the toggle look broken until a
   * manual reload.
   */
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    setCollapsed(initialCollapsed);
  }, [initialCollapsed]);

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      document.cookie = `lms_sidebar=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  };
  const isActive = (href: string) =>
    pathname === href || (href !== "/my" && pathname.startsWith(`${href}/`));
  const teacher = user.role === "teacher" || isStaff(user);

  const nav = [
    { href: "/my", label: "Dashboard", icon: "home" as const },
    { href: "/my/courses", label: "My courses", icon: "book" as const },
    { href: "/course", label: "Course catalogue", icon: "grid" as const },
    ...(teacher ? [{ href: "/my/teaching", label: "My teaching", icon: "users" as const }] : []),
    { href: "/my/timeline", label: "Timeline", icon: "clock" as const },
    { href: "/my/grades", label: "Grades", icon: "award" as const },
    { href: "/calendar", label: "Calendar", icon: "calendar" as const },
    { href: "/message", label: "Messages", icon: "message" as const },
    { href: "/notifications", label: "Notifications", icon: "bell" as const },
    { href: "/user/profile", label: "Profile", icon: "user" as const },
  ];

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "hidden shrink-0 flex-col gap-4 border-r border-[var(--color-line-soft)] bg-white py-3 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px] px-2" : "w-[250px] px-3"
      )}
    >
      <div className={cn("flex items-center gap-1", collapsed ? "justify-center" : "justify-between px-1")}>
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink-4">
            Navigation
          </p>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}
          className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-soft hover:text-brand"
        >
          <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={16} />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "drawer-link",
              isActive(item.href) && "drawer-link-active",
              collapsed && "justify-center px-0"
            )}
          >
            <Icon name={item.icon} size={16} className="shrink-0 opacity-70" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}

        {isStaff(user) && (
          <Link
            href="/admin"
            title={collapsed ? "Site administration" : undefined}
            aria-label={collapsed ? "Site administration" : undefined}
            className={cn(
              "drawer-link",
              isActive("/admin") && "drawer-link-active",
              collapsed && "justify-center px-0"
            )}
          >
            <Icon name="shield" size={16} className="shrink-0 opacity-70" />
            {!collapsed && <span className="truncate">Site administration</span>}
          </Link>
        )}
      </nav>

      {!collapsed && (
        <div>
          <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-widest text-ink-4">
            {courses.length > 8 ? "Courses" : "My courses"}
          </p>
          <div className="flex flex-col gap-0.5">
            {courses.length === 0 && (
              <p className="px-2.5 py-1 text-[12px] text-ink-3">No courses yet.</p>
            )}
            {courses.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.id}`}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-2 hover:bg-soft"
                title={c.fullname}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="truncate">{c.fullname}</span>
              </Link>
            ))}
            <Link
              href="/my/courses"
              className="mt-1 px-2.5 text-[11.5px] font-semibold text-brand hover:underline"
            >
              All courses →
            </Link>
          </div>
        </div>
      )}

      {collapsed ? (
        <div className="mt-auto flex flex-col items-center gap-1.5 pb-1">
          {courses.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/course/${c.id}`}
              title={c.fullname}
              aria-label={c.fullname}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-soft"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
            </Link>
          ))}
          <Link
            href="/support"
            title="Contact site support"
            aria-label="Contact site support"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-soft hover:text-brand"
          >
            <Icon name="help" size={15} />
          </Link>
        </div>
      ) : (
        <div className="mt-auto rounded-xl bg-soft p-3 text-[11.5px] leading-relaxed text-ink-3">
          <p className="mb-1 font-bold text-ink-2">Need help?</p>
          <p>CeLOE helpdesk · clove@telkomuniversity.ac.id</p>
          <Link href="/support" className="mt-1 inline-block font-semibold text-brand">
            Contact site support
          </Link>
        </div>
      )}
    </aside>
  );
}
