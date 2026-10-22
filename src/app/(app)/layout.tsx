import { Drawer } from "@/components/app/Drawer";
import { Topbar } from "@/components/app/Topbar";
import { requireUser } from "@/lib/auth";
import { courseCards, unreadNotificationCount } from "@/lib/data";
import { getSettings } from "@/lib/settings";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [settings, unread, cards] = await Promise.all([
    getSettings(),
    unreadNotificationCount(user.id),
    courseCards(user),
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
      <div className="flex items-start">
        <div className="sticky top-16 hidden max-h-[calc(100vh-4rem)] overflow-y-auto lg:block">
          <Drawer user={user} courses={courses} />
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
