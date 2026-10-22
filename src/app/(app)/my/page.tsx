import Link from "next/link";
import { CourseCard } from "@/components/course/CourseCard";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth";
import {
  courseCards,
  enrolledCourseIds,
  getAnnouncements,
  getPendingAssignments,
  getUpcomingEvents,
} from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { excerpt, formatDate, formatTime, timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const cards = await courseCards(user);
  const ids = cards.map((c) => c.id);

  const [events, pending, announcements] = await Promise.all([
    getUpcomingEvents(ids, user.id, 6),
    getPendingAssignments(ids, user.id, 5),
    getAnnouncements({ courseIds: ids, limit: 4 }),
  ]);

  const totalModules = cards.reduce((s, c) => s + c.moduleCount, 0);
  const doneModules = cards.reduce((s, c) => s + c.completedCount, 0);
  const overall = totalModules ? Math.round((doneModules / totalModules) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            {locale === "id" ? "Dasbor" : "Dashboard"}
          </p>
          <h1 className="text-2xl font-bold text-ink">
            {locale === "id" ? "Selamat datang," : "Welcome back,"} {user.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-ink-3">
            {locale === "id"
              ? "Ringkasan perkuliahan Anda semester ini."
              : "Here is what is happening in your courses this semester."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/course" className="btn-neutral btn-sm">
            <Icon name="grid" size={15} />
            {locale === "id" ? "Katalog" : "Catalogue"}
          </Link>
          <Link href="/my/grades" className="btn-outline btn-sm">
            <Icon name="award" size={15} />
            {locale === "id" ? "Lihat nilai" : "View grades"}
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: locale === "id" ? "Mata kuliah" : "Courses", value: cards.length, icon: "book" as const },
          { label: locale === "id" ? "Progres keseluruhan" : "Overall progress", value: `${overall}%`, icon: "chart" as const },
          { label: locale === "id" ? "Tugas tertunda" : "Pending tasks", value: pending.length, icon: "checkCircle" as const },
          { label: locale === "id" ? "Agenda mendatang" : "Upcoming events", value: events.length, icon: "calendar" as const },
        ].map((k) => (
          <div key={k.label} className="kpi flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon name={k.icon} size={19} />
            </span>
            <div>
              <p className="kpi-value">{k.value}</p>
              <p className="kpi-label">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">
              {locale === "id" ? "Mata kuliah saya" : "My courses"}
            </h2>
            <Link href="/my/courses" className="text-[12px] font-semibold text-brand hover:underline">
              {locale === "id" ? "Lihat semua" : "View all"}
            </Link>
          </div>

          {cards.length === 0 ? (
            <div className="card card-pad text-sm text-ink-2">
              {locale === "id"
                ? "Anda belum mengikuti mata kuliah apa pun."
                : "You are not enrolled in any course yet."}{" "}
              <Link href="/course" className="font-semibold text-brand hover:underline">
                {locale === "id" ? "Jelajahi katalog" : "Browse the catalogue"}
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.slice(0, 4).map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}

          <div className="mt-5 card">
            <div className="card-head">
              <h2 className="text-[15px] font-bold text-ink">
                {locale === "id" ? "Tugas mendatang" : "Pending assignments"}
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-line-soft)]">
              {pending.length === 0 && (
                <p className="px-5 py-4 text-sm text-ink-3">
                  {locale === "id" ? "Tidak ada tugas tertunda." : "No pending assignments."}
                </p>
              )}
              {pending.map((a) => (
                <Link
                  key={a.id}
                  href={`/mod/assign/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-soft"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <Icon name="file" size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{a.name}</p>
                    <p className="text-[11.5px] text-ink-3">
                      {(a as { course?: { fullname: string } }).course?.fullname} ·{" "}
                      {locale === "id" ? "tenggat" : "due"} {formatDate(a.duedate, { locale })}
                    </p>
                  </div>
                  <span className="badge-warn">Due</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="card">
            <div className="card-head">
              <h2 className="text-[15px] font-bold text-ink">
                {locale === "id" ? "Agenda" : "Upcoming"}
              </h2>
              <Link href="/calendar" className="text-[12px] font-semibold text-brand hover:underline">
                {locale === "id" ? "Kalender" : "Calendar"}
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-line-soft)]">
              {events.length === 0 && (
                <p className="px-5 py-4 text-sm text-ink-3">
                  {locale === "id" ? "Belum ada agenda." : "No events scheduled."}
                </p>
              )}
              {events.map((e) => (
                <div key={e.id} className="flex gap-3 px-5 py-3">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: e.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{e.name}</p>
                    <p className="text-[11.5px] text-ink-3">
                      {formatDate(e.start_at, { locale })} · {formatTime(e.start_at)}
                      {e.course ? ` · ${e.course.shortname}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2 className="text-[15px] font-bold text-ink">
                {locale === "id" ? "Pengumuman" : "Announcements"}
              </h2>
            </div>
            <div className="divide-y divide-[var(--color-line-soft)]">
              {announcements.length === 0 && (
                <p className="px-5 py-4 text-sm text-ink-3">
                  {locale === "id" ? "Belum ada pengumuman." : "No announcements."}
                </p>
              )}
              {announcements.map((a) => (
                <Link
                  key={a.id}
                  href={`/announcement/${a.id}`}
                  className="flex gap-3 px-5 py-3 hover:bg-soft"
                >
                  <Avatar name={a.author?.full_name} size={30} />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[13px] font-semibold text-ink">{a.subject}</p>
                    <p className="line-clamp-2 text-[11.5px] text-ink-3">
                      {excerpt(a.message, 80)}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-ink-4">{timeAgo(a.created_at, locale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
