import Link from "next/link";
import { conversationStore } from "@/app/actions/messaging";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { excerpt, timeAgo } from "@/lib/utils";
import type { Message, Profile } from "@/lib/types";

export const metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireUser();

  const { data: myParticipants } = await db()
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const ids = (myParticipants ?? []).map((p) => p.conversation_id as number);

  const [{ data: conversations }, { data: people }] = await Promise.all([
    ids.length
      ? db()
          .from("conversations")
          .select("*, participants:conversation_participants(user_id, profile:profiles(full_name, username))")
          .in("id", ids)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    db().from("profiles").select("id, full_name, username, role").neq("id", user.id).order("full_name"),
  ]);

  const lastMessages = new Map<number, Message>();
  if (ids.length) {
    const { data: messages } = await db()
      .from("messages")
      .select("*")
      .in("conversation_id", ids)
      .order("created_at", { ascending: true });
    for (const m of (messages ?? []) as Message[]) {
      lastMessages.set(m.conversation_id, m);
    }
  }

  const list = (conversations ?? []) as {
    id: number;
    subject: string | null;
    updated_at: string;
    participants: { user_id: string; profile: { full_name: string; username: string } | null }[];
  }[];

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Messages</h1>
        <p className="text-sm text-ink-3">Direct conversations with lecturers and classmates.</p>
      </div>

      {error === "empty" && (
        <div className="alert-error mb-4">Penerima dan isi pesan wajib diisi.</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
        <div className="card overflow-hidden">
          <div className="card-head">
            <h2 className="text-[14px] font-bold text-ink">Inbox</h2>
            <span className="badge-neutral">{list.length}</span>
          </div>
          <div className="divide-y divide-[var(--color-line-soft)]">
            {list.length === 0 && (
              <p className="px-4 py-4 text-sm text-ink-3">No conversations yet.</p>
            )}
            {list.map((c) => {
              const others = c.participants.filter((p) => p.user_id !== user.id);
              const title = others.map((o) => o.profile?.full_name ?? "User").join(", ") || "You";
              const last = lastMessages.get(c.id);
              return (
                <Link
                  key={c.id}
                  href={`/message/${c.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-soft/60"
                >
                  <Avatar name={title} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
                    <p className="truncate text-[12px] text-ink-2">
                      {c.subject ? `${c.subject} — ` : ""}
                      {excerpt(last?.body, 60)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10.5px] text-ink-4">
                    {timeAgo(last?.created_at ?? c.updated_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside>
          <details className="card overflow-hidden" open>
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[14px] font-bold text-ink">
              <Icon name="plus" size={15} className="text-brand" />
              New message
            </summary>
            <form action={conversationStore} className="grid gap-2.5 border-t border-[var(--color-line-soft)] p-4">
              <div className="field">
                <label className="label">To</label>
                <select name="recipient_id" required className="select">
                  <option value="">Select recipient…</option>
                  {((people ?? []) as Pick<Profile, "id" | "full_name" | "username" | "role">[]).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Subject</label>
                <input name="subject" className="input" placeholder="Optional" />
              </div>
              <div className="field">
                <label className="label">Message</label>
                <textarea name="body" required className="textarea min-h-[100px]" />
              </div>
              <SubmitButton className="btn-brand btn-sm" pendingLabel="Mengirim…">
                Send
              </SubmitButton>
            </form>
          </details>
        </aside>
      </div>
    </div>
  );
}
