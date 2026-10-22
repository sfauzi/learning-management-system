"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { isStaff } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type CourseLink = { id: number; fullname: string; shortname: string; color: string };

export function Drawer({
  user,
  courses,
}: {
  user: Profile;
  courses: CourseLink[];
}) {
  const pathname = usePathname();
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
    <aside className="hidden w-[250px] shrink-0 flex-col gap-5 border-r border-[var(--color-line-soft)] bg-white px-3 py-4 lg:flex">
      <div>
        <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-widest text-ink-4">
          Navigation
        </p>
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("drawer-link", isActive(item.href) && "drawer-link-active")}
            >
              <Icon name={item.icon} size={16} className="opacity-70" />
              {item.label}
            </Link>
          ))}
          {isStaff(user) && (
            <Link
              href="/admin"
              className={cn("drawer-link", isActive("/admin") && "drawer-link-active")}
            >
              <Icon name="shield" size={16} className="opacity-70" />
              Site administration
            </Link>
          )}
        </nav>
      </div>

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

      <div className="mt-auto rounded-xl bg-soft p-3 text-[11.5px] leading-relaxed text-ink-3">
        <p className="mb-1 font-bold text-ink-2">Need help?</p>
        <p>CeLOE helpdesk · clove@telkomuniversity.ac.id</p>
        <Link href="/support" className="mt-1 inline-block font-semibold text-brand">
          Contact site support
        </Link>
      </div>
    </aside>
  );
}
