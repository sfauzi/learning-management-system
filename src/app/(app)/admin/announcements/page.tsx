import Link from "next/link";
import { announcementDestroy, announcementStore } from "@/app/actions/admin";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Announcement, Course } from "@/lib/types";

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireStaff();

  const [{ data: announcements }, { data: courses }] = await Promise.all([
    db()
      .from("announcements")
      .select("*, author:profiles!announcements_user_id_fkey(full_name), course:courses(shortname)")
      .order("created_at", { ascending: false }),
    db().from("courses").select("id, fullname, shortname").order("fullname"),
  ]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Site administration
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Announcements</h1>
        <p className="text-sm text-ink-3">
          Site-wide notices and per-course announcements.
        </p>
      </div>

      {error === "required" && (
        <div className="alert-error mb-4">Subjek dan isi pengumuman wajib diisi.</div>
      )}

      <details className="card mb-5 overflow-hidden" open>
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[14px] font-bold text-ink">
          <Icon name="plus" size={15} className="text-brand" />
          New announcement
        </summary>
        <form action={announcementStore} className="grid gap-3 border-t border-[var(--color-line-soft)] p-4 sm:grid-cols-2">
          <div className="field sm:col-span-2">
            <label className="label">Subject</label>
            <input name="subject" required className="input" />
          </div>
          <div className="field sm:col-span-2">
            <label className="label">Message</label>
            <textarea name="message" required className="textarea min-h-[120px]" />
          </div>
          <div className="field">
            <label className="label">Course (optional)</label>
            <select name="course_id" className="select">
              <option value="">Site-wide</option>
              {((courses ?? []) as Pick<Course, "id" | "fullname">[]).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullname}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <input type="checkbox" name="pinned" className="h-4 w-4 accent-[#a12520]" />
              Pinned
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <input type="checkbox" name="published" defaultChecked className="h-4 w-4 accent-[#a12520]" />
              Published
            </label>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-brand" pendingLabel="Mempublikasikan…">
              Publish announcement
            </SubmitButton>
          </div>
        </form>
      </details>

      <div className="card overflow-hidden">
        <div className="divide-y divide-[var(--color-line-soft)]">
          {((announcements ?? []) as (Announcement & { course: { shortname: string } | null })[]).map((a) => (
            <div key={a.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {a.pinned && <span className="badge-brand">Pinned</span>}
                  {a.course ? (
                    <span className="badge-neutral">{a.course.shortname}</span>
                  ) : (
                    <span className="badge-info">Site</span>
                  )}
                  {!a.published && <span className="badge-warn">Draft</span>}
                  <p className="text-[13.5px] font-semibold text-ink">{a.subject}</p>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-2">{a.message}</p>
                <p className="mt-0.5 text-[11px] text-ink-4">
                  {a.author?.full_name ?? "—"} · {formatDateTime(a.created_at)}
                </p>
              </div>
              <form action={announcementDestroy}>
                <input type="hidden" name="announcement_id" value={a.id} />
                <SubmitButton
                  className="btn-danger btn-xs"
                  confirm="Hapus pengumuman ini?"
                  pendingLabel="…"
                >
                  <Icon name="trash" size={12} />
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
