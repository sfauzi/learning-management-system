import Link from "next/link";
import { formatDate, excerpt } from "@/lib/utils";
import type { Announcement } from "@/lib/types";

export function AnnouncementCard({
  announcement,
  locale = "en",
  compact = false,
}: {
  announcement: Announcement;
  locale?: string;
  compact?: boolean;
}) {
  const date = new Date(announcement.created_at);
  const month = formatDate(date, { locale, short: true }).split(" ")[1];

  return (
    <article className="rounded-xl border border-[var(--color-line-soft)] bg-white p-4 shadow-[0_1px_8px_rgb(47_56_71/0.05)]">
      <div className="flex gap-3.5">
        <div className="flex w-[76px] shrink-0 flex-col items-start border-r border-[var(--color-line-soft)] pr-3">
          <span className="text-[15px] font-bold leading-tight text-ink">
            {date.getDate()} {month}
          </span>
          <span className="text-[11px] font-medium text-ink-3">{date.getFullYear()}</span>
          <span className="mt-1 line-clamp-2 text-[9px] font-semibold uppercase leading-tight tracking-wide text-brand">
            {announcement.author?.full_name ?? "ADMIN"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {announcement.pinned && (
              <span className="badge-brand text-[9px]">Pinned</span>
            )}
            {announcement.course && (
              <span className="badge-neutral text-[9px]">{announcement.course.shortname}</span>
            )}
          </div>
          <h3 className="text-[14px] font-semibold leading-snug text-ink">
            {announcement.subject}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
            {excerpt(announcement.message, compact ? 110 : 180)}
          </p>
          <Link
            href={`/announcement/${announcement.id}`}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
