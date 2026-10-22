import Link from "next/link";
import { notFound } from "next/navigation";
import { postStore } from "@/app/actions/learning";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Discussion, ForumPost } from "@/lib/types";

export const metadata = { title: "Discussion" };

export default async function DiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const discussionId = Number(id);
  await requireUser();

  const { data } = await db()
    .from("forum_discussions")
    .select(
      "*, profile:profiles!forum_discussions_user_id_fkey(full_name, username, role, avatar_path), forum:forums(id, name, course_id, course:courses(id, fullname))"
    )
    .eq("id", discussionId)
    .maybeSingle();
  if (!data) notFound();

  const discussion = data as Discussion & {
    forum: { id: number; name: string; course_id: number | null; course: { id: number; fullname: string } | null };
  };

  const { data: posts } = await db()
    .from("forum_posts")
    .select("*, profile:profiles!forum_posts_user_id_fkey(full_name, username, role, avatar_path)")
    .eq("discussion_id", discussionId)
    .order("created_at");

  const list = (posts ?? []) as ForumPost[];

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px] font-semibold text-ink-2">
        <Link href={`/mod/forum/${discussion.forum_id}`} className="inline-flex items-center gap-1.5 hover:text-brand">
          <Icon name="arrowLeft" size={15} />
          {discussion.forum?.name}
        </Link>
        {discussion.forum?.course && (
          <Link href={`/course/${discussion.forum.course.id}`} className="text-ink-3 hover:text-brand">
            {discussion.forum.course.fullname}
          </Link>
        )}
      </div>

      <div className="card card-pad mb-4">
        <div className="flex items-start gap-3">
          <Avatar name={discussion.profile?.full_name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {discussion.pinned && <span className="badge-brand">Pinned</span>}
              {discussion.locked && <span className="badge-warn">Locked</span>}
              <h1 className="text-lg font-bold leading-tight text-ink">{discussion.name}</h1>
            </div>
            <p className="text-[11.5px] text-ink-3">
              {discussion.profile?.full_name} · {formatDateTime(discussion.created_at)}
            </p>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">
              {discussion.message}
            </p>
          </div>
        </div>
      </div>

      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-widest text-ink-4">
        {list.length} {list.length === 1 ? "reply" : "replies"}
      </h2>

      <div className="space-y-2.5">
        {list.map((post) => (
          <article key={post.id} className="card flex gap-3 p-4">
            <Avatar name={post.profile?.full_name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink">
                {post.profile?.full_name}
                <span className="ml-2 font-normal text-ink-3">
                  {post.profile?.role === "student" ? "Student" : "Lecturer"}
                </span>
              </p>
              <p className="text-[10.5px] text-ink-4">{formatDateTime(post.created_at)}</p>
              <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-2">
                {post.message}
              </p>
            </div>
          </article>
        ))}
        {list.length === 0 && (
          <p className="card card-pad text-sm text-ink-3">No replies yet — be the first.</p>
        )}
      </div>

      {error === "empty" && <div className="alert-error mt-4">Balasan tidak boleh kosong.</div>}

      {!discussion.locked ? (
        <form action={postStore} className="card mt-4 p-4">
          <input type="hidden" name="discussion_id" value={discussionId} />
          <div className="field">
            <label className="label">Reply</label>
            <textarea name="message" required className="textarea min-h-[100px]" placeholder="Tulis balasan…" />
          </div>
          <div className="mt-3">
            <SubmitButton className="btn-brand" pendingLabel="Mengirim…">
              Post reply
            </SubmitButton>
          </div>
        </form>
      ) : (
        <p className="card card-pad mt-4 text-sm text-ink-3">
          Diskusi ini dikunci; balasan baru tidak dapat ditambahkan.
        </p>
      )}
    </div>
  );
}
