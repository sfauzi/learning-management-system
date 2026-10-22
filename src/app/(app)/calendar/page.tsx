import Link from "next/link";
import { eventDestroy, eventStore } from "@/app/actions/learning";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { courseCards } from "@/lib/data";
import { db } from "@/lib/supabase/admin";
import { getLocale } from "@/lib/i18n";
import { days, formatDate, formatTime, months } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; error?: string }>;
}) {
  const { m, error } = await searchParams;
  const user = await requireUser();
  const locale = await getLocale();

  const now = new Date();
  const [yearStr, monthStr] = (m ?? `${now.getFullYear()}-${now.getMonth() + 1}`).split("-");
  const year = Number(yearStr) || now.getFullYear();
  const month = Math.min(Math.max((Number(monthStr) || 1) - 1, 0), 11);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const cards = await courseCards(user);
  const courseIds = cards.map((c) => c.id);

  let query = db()
    .from("calendar_events")
    .select("*, course:courses(id,fullname,shortname)")
    .gte("start_at", gridStart.toISOString())
    .lte("start_at", new Date(monthEnd.getTime() + 7 * 864e5).toISOString())
    .order("start_at");

  query = courseIds.length
    ? query.or(`course_id.in.(${courseIds.join(",")}),user_id.eq.${user.id}`)
    : query.eq("user_id", user.id);

  const { data } = await query;
  const events = (data ?? []) as CalendarEvent[];

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = new Date(e.start_at).toDateString();
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  }

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const monthEvents = events.filter((e) => {
    const d = new Date(e.start_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Calendar</h1>
          <p className="text-sm text-ink-3">
            {months(locale)[month]} {year} · {monthEvents.length} events
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/calendar?m=${prev.getFullYear()}-${prev.getMonth() + 1}`}
            className="btn-neutral btn-sm"
          >
            <Icon name="chevronLeft" size={14} />
          </Link>
          <Link href="/calendar" className="btn-neutral btn-sm">
            Today
          </Link>
          <Link
            href={`/calendar?m=${next.getFullYear()}-${next.getMonth() + 1}`}
            className="btn-neutral btn-sm"
          >
            <Icon name="chevronRight" size={14} />
          </Link>
        </div>
      </div>

      {error === "empty" && (
        <div className="alert-error mb-4">Nama dan waktu agenda wajib diisi.</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[var(--color-line-soft)] bg-soft/60">
            {days(locale).map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[10.5px] font-bold uppercase tracking-wider text-ink-3"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const inMonth = day.getMonth() === month;
              const isToday = day.toDateString() === new Date().toDateString();
              const dayEvents = byDay.get(day.toDateString()) ?? [];

              return (
                <div
                  key={i}
                  className={`min-h-[92px] border-b border-r border-[var(--color-line-soft)] p-1.5 ${
                    inMonth ? "bg-white" : "bg-soft/40"
                  }`}
                >
                  <div
                    className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isToday ? "bg-brand text-white" : inMonth ? "text-ink" : "text-ink-4"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                        style={{ background: e.color }}
                        title={`${e.name} · ${formatTime(e.start_at)}`}
                      >
                        {formatTime(e.start_at)} {e.name}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[9.5px] text-ink-3">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <details className="card overflow-hidden" open>
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[14px] font-bold text-ink">
              <Icon name="plus" size={15} className="text-brand" />
              Add event
            </summary>
            <form action={eventStore} className="grid gap-2.5 border-t border-[var(--color-line-soft)] p-4">
              <div className="field">
                <label className="label">Name</label>
                <input name="name" required className="input" />
              </div>
              <div className="field">
                <label className="label">Start</label>
                <input type="datetime-local" name="start_at" required className="input" />
              </div>
              <div className="field">
                <label className="label">End (optional)</label>
                <input type="datetime-local" name="end_at" className="input" />
              </div>
              <div className="field">
                <label className="label">Course (optional)</label>
                <select name="course_id" className="select">
                  <option value="">Personal</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullname}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Type</label>
                <select name="type" className="select">
                  <option value="event">Event</option>
                  <option value="assignment">Assignment</option>
                  <option value="course">Course</option>
                  <option value="exam">Exam</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Colour</label>
                <input type="color" name="color" defaultValue="#a12520" className="input h-10 p-1" />
              </div>
              <div className="field">
                <label className="label">Description</label>
                <textarea name="description" className="textarea min-h-[60px]" />
              </div>
              <SubmitButton className="btn-brand btn-sm" pendingLabel="Menyimpan…">
                Save event
              </SubmitButton>
            </form>
          </details>

          <div className="card">
            <div className="card-head">
              <h2 className="text-[14px] font-bold text-ink">This month</h2>
            </div>
            <div className="divide-y divide-[var(--color-line-soft)]">
              {monthEvents.length === 0 && (
                <p className="px-4 py-3 text-[12.5px] text-ink-3">No events this month.</p>
              )}
              {monthEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: e.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">{e.name}</p>
                    <p className="text-[11px] text-ink-3">
                      {formatDate(e.start_at, { locale })} · {formatTime(e.start_at)}
                      {e.course ? ` · ${e.course.shortname}` : ""}
                    </p>
                  </div>
                  {e.user_id === user.id && (
                    <form action={eventDestroy}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <SubmitButton
                        className="btn-ghost btn-xs text-red-600"
                        confirm="Hapus agenda ini?"
                        pendingLabel="…"
                      >
                        <Icon name="trash" size={12} />
                      </SubmitButton>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
