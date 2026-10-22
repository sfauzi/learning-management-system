"use client";

import { Drawer } from "@/components/app/Drawer";
import type { Profile } from "@/lib/types";

/**
 * Sidebar + content shell.
 *
 * The collapse state is rendered by the server (from the lms_sidebar cookie) and
 * handed down as the initial value, so the first paint already has the right
 * width; the Drawer then flips it locally and writes the cookie itself.
 */
export function SidebarShell({
  user,
  courses,
  collapsed,
  children,
}: {
  user: Profile;
  courses: { id: number; fullname: string; shortname: string; color: string }[];
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start">
      <div className="sticky top-16 hidden max-h-[calc(100vh-4rem)] overflow-y-auto lg:block">
        <Drawer user={user} courses={courses} collapsed={collapsed} />
      </div>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
