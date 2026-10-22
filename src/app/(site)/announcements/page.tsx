import { AnnouncementCard } from "@/components/site/AnnouncementCard";
import { PageHeader } from "@/components/site/PageHeader";
import { getCurrentUser } from "@/lib/auth";
import { enrolledCourseIds, getAnnouncements } from "@/lib/data";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const courseIds = user ? await enrolledCourseIds(user.id) : [];
  const announcements = await getAnnouncements({ courseIds: user ? courseIds : undefined });

  const site = announcements.filter((a) => !a.course_id);
  const course = announcements.filter((a) => a.course_id);

  return (
    <>
      <PageHeader
        eyebrow="LMS"
        title="Announcements"
        subtitle="Site-wide notices and updates from your course lecturers."
        icon="bell"
      />
      <main className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-3">
              Site announcements
            </h2>
            <div className="space-y-3">
              {site.length === 0 && <p className="text-sm text-ink-3">Belum ada pengumuman.</p>}
              {site.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} locale={locale} />
              ))}
            </div>
          </section>

          <aside>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-3">
              Course announcements
            </h2>
            <div className="space-y-3">
              {!user && (
                <p className="card card-pad text-sm text-ink-2">
                  Login to see announcements from your courses.
                </p>
              )}
              {user && course.length === 0 && (
                <p className="text-sm text-ink-3">No course announcements yet.</p>
              )}
              {course.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} locale={locale} compact />
              ))}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
