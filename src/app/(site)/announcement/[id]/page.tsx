import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { db } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Announcement } from "@/lib/types";

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await db()
    .from("announcements")
    .select(
      "*, author:profiles!announcements_user_id_fkey(id,full_name,username), course:courses(id,fullname,shortname)"
    )
    .eq("id", Number(id))
    .eq("published", true)
    .maybeSingle();

  if (!data) notFound();
  const a = data as Announcement;

  return (
    <main className="container-page py-8">
      <Link
        href="/announcements"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        All announcements
      </Link>

      <article className="card mx-auto max-w-3xl p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {a.course && <span className="badge-neutral">{a.course.fullname}</span>}
          {a.pinned && <span className="badge-brand">Pinned</span>}
        </div>
        <h1 className="text-2xl font-bold leading-tight text-ink">{a.subject}</h1>
        <p className="mt-2 text-[13px] text-ink-3">
          {formatDateTime(a.created_at)} · {a.author?.full_name ?? "Administrator"}
        </p>
        <div className="mt-6 whitespace-pre-line border-t border-[var(--color-line-soft)] pt-6 text-[15px] leading-relaxed text-ink-2">
          {a.message}
        </div>
      </article>
    </main>
  );
}
