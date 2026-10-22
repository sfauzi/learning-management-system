import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { enrolledCourseIds } from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { formatDate, formatTime } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

export const metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const ids = await enrolledCourseIds(user.id);

  const from = new Date();
  from.setMonth(from.getMonth() - 1);

  let query = db()
    .from("calendar_events")
    .select("*, course:courses(id,fullname,shortname)")
    .gte("start_at", from.toISOString())
    .order("start_at", { ascending: true })
    .limit(60);

  if (ids.length) query = query.or(`course_id.in.(${ids.join(",")}),user_id.eq.${user.id}`);
  else query = query.eq("user_id", user.id);

  const { data } = await query;
  const events = (data ?? []) as CalendarEvent[];

  const groups = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    const key = new Date(e.start_at).toISOString().slice(0, 10);
    (acc[key] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Timeline</h1>
          <p className="text-sm text-ink-3">
            {locale === "id"
              ? "Agenda dan tenggat dari mata kuliah Anda."
              : "Deadlines and events across your courses."}
          </p>
        </div>
        <Link href="/calendar" className="btn-outline btn-sm">
          <Icon name="calendar" size={15} />
          Calendar
        </Link>
      </div>

      {events.length === 0 && (
        <div className="card card-pad text-sm text-ink-2">
          {locale === "id" ? "Belum ada agenda." : "Nothing scheduled yet."}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groups).map(([day, list]) => (
          <section key={day}>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ink-4">
              {formatDate(day, { locale, withYear: true })}
            </h2>
            <div className="card divide-y divide-[var(--color-line-soft)]">
              {list.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: e.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">{e.name}</p>
                    <p className="text-[11.5px] text-ink-3">
                      {formatTime(e.start_at)}
                      {e.end_at ? ` – ${formatTime(e.end_at)}` : ""}
                      {e.course ? ` · ${e.course.fullname}` : ""}
                    </p>
                    {e.description && (
                      <p className="mt-0.5 text-[12px] text-ink-2">{e.description}</p>
                    )}
                  </div>
                  <span className="badge-neutral capitalize">{e.type}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
