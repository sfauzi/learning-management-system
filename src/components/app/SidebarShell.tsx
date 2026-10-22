"use client";

import { Drawer } from "@/components/app/Drawer";
import { toggleSidebar } from "@/app/actions/prefs";
import type { Profile } from "@/lib/types";

/**
 * Client shell for the sidebar + content area.
 *
 * The collapse state is rendered by the server (from a cookie) and passed down,
 * so the first paint already has the right width; this component only supplies
 * the toggle handler, which flips the cookie through a server action.
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
        <Drawer
          user={user}
          courses={courses}
          collapsed={collapsed}
          onToggle={() => {
            void toggleSidebar();
          }}
        />
      </div>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
