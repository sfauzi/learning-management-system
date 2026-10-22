import { SidebarShell } from "@/components/app/SidebarShell";
import { Topbar } from "@/components/app/Topbar";
import { requireUser } from "@/lib/auth";
import { courseCards, unreadNotificationCount } from "@/lib/data";
import { isSidebarCollapsed } from "@/lib/prefs";
import { getSettings } from "@/lib/settings";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [settings, unread, cards, collapsed] = await Promise.all([
    getSettings(),
    unreadNotificationCount(user.id),
    courseCards(user),
    isSidebarCollapsed(),
  ]);

  const courses = cards.map((c) => ({
    id: c.id,
    fullname: c.fullname,
    shortname: c.shortname,
    color: c.color,
  }));

  return (
    <div className="min-h-screen bg-canvas">
      <Topbar user={user} settings={settings} unread={unread} />
      <SidebarShell user={user} courses={courses} collapsed={collapsed}>
        {children}
      </SidebarShell>
    </div>
  );
}
