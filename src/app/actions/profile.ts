"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/admin";

export async function profileUpdate(formData: FormData) {
  const user = await requireUser();

  const lang = String(formData.get("lang") ?? "en") === "id" ? "id" : "en";

  await db()
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim() || user.full_name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      institution: String(formData.get("institution") ?? "").trim() || null,
      study_program: String(formData.get("study_program") ?? "").trim() || null,
      lang,
    })
    .eq("id", user.id);

  revalidatePath("/user/profile");
  revalidatePath("/my");
  redirect("/user/profile?saved=1");
}

export async function passwordUpdate(formData: FormData) {
  const user = await requireUser();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (next.length < 6) redirect("/user/profile?error=short");
  if (next !== confirm) redirect("/user/profile?error=mismatch");

  // verify the current password before changing it
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });

  if (signInError) redirect("/user/profile?error=current");

  const { error } = await db().auth.admin.updateUserById(user.id, { password: next });
  if (error) redirect(`/user/profile?error=${encodeURIComponent(error.message)}`);

  redirect("/user/profile?saved=password");
}

export async function profileLanguage(formData: FormData) {
  const user = await requireUser();
  const lang = String(formData.get("lang") ?? "en") === "id" ? "id" : "en";

  await db().from("profiles").update({ lang }).eq("id", user.id);
  revalidatePath("/user/profile");
}
