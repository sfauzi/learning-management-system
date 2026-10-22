import Link from "next/link";
import { notFound } from "next/navigation";
import { discussionStore } from "@/app/actions/learning";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { getDiscussions } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Forum" };

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const forumId = Number(id);
  await requireUser();

  const { data } = await db()
    .from("forums")
    .select("*, course:courses(id, fullname, shortname, color)")
    .eq("id", forumId)
    .maybeSingle();
  if (!data) notFound();

  const forum = data as {
    id: number;
    name: string;
    intro: string | null;
    type: string;
    locked: boolean;
    course_id: number | null;
    course: { id: number; fullname: string; shortname: string; color: string } | null;
  };

  const discussions = await getDiscussions(forumId);

  return (
    <div className="mx-auto max-w-[1000px]">
      {forum.course && (
        <Link
          href={`/course/${forum.course.id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
        >
          <Icon name="arrowLeft" size={15} />
          {forum.course.fullname}
        </Link>
      )}

      <div className="card mb-5 overflow-hidden">
        <div className="h-1.5" style={{ background: forum.course?.color ?? "#a12520" }} />
        <div className="card-pad">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="badge-brand mb-2">Forum · {forum.type}</span>
              <h1 className="text-2xl font-bold text-ink">{forum.name}</h1>
              {forum.intro && <p className="mt-1 text-[13.5px] text-ink-2">{forum.intro}</p>}
            </div>
            <span className="badge-neutral">{discussions.length} discussions</span>
          </div>
        </div>
      </div>

      {error === "empty" && (
        <div className="alert-error mb-4">Judul dan isi diskusi wajib diisi.</div>
      )}

      <details className="card mb-5 overflow-hidden" open={discussions.length === 0}>
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[14px] font-bold text-ink">
          <Icon name="plus" size={15} className="text-brand" />
          Start a new discussion
        </summary>
        <form action={discussionStore} className="grid gap-3 border-t border-[var(--color-line-soft)] p-4">
          <input type="hidden" name="forum_id" value={forumId} />
          <div className="field">
            <label className="label">Subject</label>
            <input name="name" required className="input" placeholder="Topik diskusi" />
          </div>
          <div className="field">
            <label className="label">Message</label>
            <textarea name="message" required className="textarea min-h-[110px]" />
          </div>
          <div>
            <SubmitButton className="btn-brand" pendingLabel="Mengirim…">
              Post discussion
            </SubmitButton>
          </div>
        </form>
      </details>

      <div className="card overflow-hidden">
        <div className="card-head">
          <h2 className="text-[14px] font-bold text-ink">Discussions</h2>
        </div>
        <div className="divide-y divide-[var(--color-line-soft)]">
          {discussions.length === 0 && (
            <p className="px-4 py-4 text-sm text-ink-3">No discussions yet.</p>
          )}
          {discussions.map((d) => (
            <Link
              key={d.id}
              href={`/mod/forum/discuss/${d.id}`}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-soft/50"
            >
              <Avatar name={d.profile?.full_name} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {d.pinned && <span className="badge-brand">Pinned</span>}
                  {d.locked && <span className="badge-warn">Locked</span>}
                  <p className="text-[13.5px] font-semibold text-ink">{d.name}</p>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-2">{d.message}</p>
                <p className="mt-0.5 text-[11px] text-ink-3">
                  {d.profile?.full_name ?? "—"} · {timeAgo(d.last_post_at ?? d.created_at)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[13px] font-bold text-ink">{d.post_count}</p>
                <p className="text-[10.5px] uppercase tracking-wide text-ink-3">replies</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
