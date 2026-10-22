import Link from "next/link";
import { notFound } from "next/navigation";
import { messageStore } from "@/app/actions/messaging";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversationId = Number(id);
  const user = await requireUser();

  const { data: participant } = await db()
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) notFound();

  const [{ data: conversation }, { data: messages }, { data: participants }] = await Promise.all([
    db().from("conversations").select("*").eq("id", conversationId).maybeSingle(),
    db()
      .from("messages")
      .select("*, profile:profiles!messages_user_id_fkey(full_name, username, avatar_path)")
      .eq("conversation_id", conversationId)
      .order("created_at"),
    db()
      .from("conversation_participants")
      .select("user_id, profile:profiles(full_name, username)")
      .eq("conversation_id", conversationId),
  ]);

  if (!conversation) notFound();

  await db()
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("id", participant.id);

  const list = (messages ?? []) as Message[];
  const others = (participants ?? []).filter((p) => p.user_id !== user.id);

  return (
    <div className="mx-auto max-w-[820px]">
      <Link
        href="/message"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Inbox
      </Link>

      <div className="card mb-4 p-4">
        <h1 className="text-lg font-bold text-ink">{conversation.subject ?? "(no subject)"}</h1>
        <p className="text-[12px] text-ink-3">
          With{" "}
          {others
            .map((o) => (o.profile as { full_name?: string } | null)?.full_name ?? "User")
            .join(", ") || "—"}
        </p>
      </div>

      <div className="space-y-2.5">
        {list.map((m) => {
          const mine = m.user_id === user.id;
          return (
            <div key={m.id} className={`flex gap-2.5 ${mine ? "justify-end" : ""}`}>
              {!mine && <Avatar name={m.profile?.full_name} size={30} />}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                  mine ? "bg-brand text-white" : "card text-ink-2"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-[11px] font-semibold text-ink">
                    {m.profile?.full_name}
                  </p>
                )}
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-ink-4"}`}>
                  {formatDateTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form action={messageStore} className="card mt-4 p-4">
        <input type="hidden" name="conversation_id" value={conversationId} />
        <div className="field">
          <label className="label">Reply</label>
          <textarea name="body" required className="textarea min-h-[90px]" placeholder="Tulis pesan…" />
        </div>
        <div className="mt-3">
          <SubmitButton className="btn-brand" pendingLabel="Mengirim…">
            Send reply
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
