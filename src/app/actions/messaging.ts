"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { notify } from "@/lib/data";

export async function conversationStore(formData: FormData) {
  const user = await requireUser();
  const recipientId = String(formData.get("recipient_id") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!recipientId || !body) redirect("/message?error=empty");

  const { data: conversation } = await db()
    .from("conversations")
    .insert({ subject: subject || "(no subject)" })
    .select("id")
    .single();
  if (!conversation) redirect("/message?error=empty");

  await db().from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: user.id, last_read_at: new Date().toISOString() },
    { conversation_id: conversation.id, user_id: recipientId },
  ]);

  await db().from("messages").insert({
    conversation_id: conversation.id,
    user_id: user.id,
    body,
  });

  await notify(
    recipientId,
    "Pesan baru",
    `${user.full_name}: ${subject || body.slice(0, 60)}`,
    `/message/${conversation.id}`
  );

  revalidatePath("/message");
  redirect(`/message/${conversation.id}`);
}

export async function messageStore(formData: FormData) {
  const user = await requireUser();
  const conversationId = Number(formData.get("conversation_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/message/${conversationId}?error=empty`);

  const { data: participant } = await db()
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) redirect("/message");

  await db().from("messages").insert({
    conversation_id: conversationId,
    user_id: user.id,
    body,
  });

  await db()
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("id", participant.id);

  const { data: others } = await db()
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id);

  for (const other of others ?? []) {
    await notify(other.user_id, "Pesan baru", body.slice(0, 80), `/message/${conversationId}`);
  }

  revalidatePath(`/message/${conversationId}`);
  revalidatePath("/message");
}

export async function notificationsRead() {
  const user = await requireUser();
  await db()
    .from("app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/notifications");
  revalidatePath("/my");
}
