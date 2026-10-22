"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageCourse, requireUser } from "@/lib/auth";
import { BUCKETS, db } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const MAX_BYTES = 20 * 1024 * 1024;

async function storeFile(
  bucket: string,
  folder: string,
  file: File
): Promise<{ path: string; name: string }> {
  if (file.size > MAX_BYTES) {
    throw new Error("Ukuran berkas melebihi 20 MB.");
  }
  const safe = `${Date.now()}-${slugify(file.name) || "file"}${file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ""}`;
  const path = `${folder}/${safe}`;

  const { error } = await db()
    .storage.from(bucket)
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });

  if (error) throw new Error(error.message);
  return { path, name: file.name };
}

/** Lecturer uploads a course material and it becomes a Resource activity. */
export async function uploadMaterial(formData: FormData) {
  const user = await requireUser();
  const courseId = Number(formData.get("course_id"));
  const sectionId = Number(formData.get("section_id"));

  if (!(await canManageCourse(user, courseId))) redirect(`/course/${courseId}`);

  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/course/${courseId}/manage?error=file`);
  }

  let stored: { path: string; name: string };
  try {
    stored = await storeFile(BUCKETS.materials, String(courseId), file);
  } catch (err) {
    redirect(`/course/${courseId}/manage?error=${encodeURIComponent((err as Error).message)}`);
  }

  const { data: resource } = await db()
    .from("resources")
    .insert({
      course_id: courseId,
      name: name || file.name,
      intro: String(formData.get("intro") ?? "") || null,
      kind: "file",
      file_path: stored.path,
      file_name: stored.name,
    })
    .select("id")
    .single();

  const { data: last } = await db()
    .from("course_modules")
    .select("sortorder")
    .eq("course_id", courseId)
    .order("sortorder", { ascending: false })
    .limit(1)
    .maybeSingle();

  await db().from("course_modules").insert({
    course_id: courseId,
    section_id: sectionId,
    type: "resource",
    instance_id: resource?.id ?? null,
    name: name || file.name,
    intro: String(formData.get("intro") ?? "") || null,
    sortorder: (last?.sortorder ?? 0) + 1,
  });

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

/** Student uploads an assignment file. */
export async function uploadSubmission(formData: FormData) {
  const user = await requireUser();
  const assignmentId = Number(formData.get("assignment_id"));
  const text = String(formData.get("online_text") ?? "").trim();

  const { data: assignment } = await db()
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment) redirect("/my");

  const file = formData.get("file");
  let stored: { path: string; name: string } | null = null;

  if (file instanceof File && file.size > 0) {
    try {
      stored = await storeFile(BUCKETS.submissions, String(assignmentId), file);
    } catch (err) {
      redirect(
        `/mod/assign/${assignmentId}?error=${encodeURIComponent((err as Error).message)}`
      );
    }
  }

  if (!stored && !text) {
    redirect(`/mod/assign/${assignmentId}?error=empty`);
  }

  const late = assignment.duedate && new Date(assignment.duedate) < new Date();
  if (late && !assignment.allow_late) {
    redirect(`/mod/assign/${assignmentId}?error=late`);
  }

  const { data: existing } = await db()
    .from("assignment_submissions")
    .select("id, file_path")
    .eq("assignment_id", assignmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  const payload = {
    assignment_id: assignmentId,
    user_id: user.id,
    online_text: text || null,
    file_path: stored?.path ?? existing?.file_path ?? null,
    file_name: stored?.name ?? null,
    submitted_at: new Date().toISOString(),
    status: late ? "submitted_late" : "submitted",
  };

  if (existing) {
    await db().from("assignment_submissions").update(payload).eq("id", existing.id);
  } else {
    await db().from("assignment_submissions").insert(payload);
  }

  revalidatePath(`/mod/assign/${assignmentId}`);
  redirect(`/mod/assign/${assignmentId}?saved=1`);
}

/** Profile avatar (public bucket). */
export async function uploadAvatar(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/user/profile?error=file");
  }
  if (!file.type.startsWith("image/")) {
    redirect("/user/profile?error=type");
  }

  let stored: { path: string; name: string };
  try {
    stored = await storeFile(BUCKETS.avatars, user.id, file);
  } catch (err) {
    redirect(`/user/profile?error=${encodeURIComponent((err as Error).message)}`);
  }

  await db().from("profiles").update({ avatar_path: stored.path }).eq("id", user.id);

  revalidatePath("/user/profile");
  revalidatePath("/my");
  redirect("/user/profile?saved=1");
}
