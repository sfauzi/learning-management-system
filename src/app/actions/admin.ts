"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isStaff, requireStaff } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { saveSettings } from "@/lib/settings";

function str(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
function num(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/* ------------------------------------------------------------------- users */

export async function userStore(formData: FormData) {
  await requireStaff();

  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password")) || "password";
  const fullName = str(formData.get("full_name")) || email.split("@")[0];
  const username = str(formData.get("username")) || email.split("@")[0];
  const role = str(formData.get("role")) || "student";

  if (!email) redirect("/admin/users?error=email");

  const { data, error } = await db().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username, role },
  });

  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);

  if (data.user) {
    await db()
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        role,
        idnumber: str(formData.get("idnumber")) || null,
        institution: str(formData.get("institution")) || "Telkom University",
        study_program: str(formData.get("study_program")) || null,
      })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?saved=1");
}

export async function userUpdate(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("user_id"));
  if (!id) return;

  await db()
    .from("profiles")
    .update({
      full_name: str(formData.get("full_name")),
      username: str(formData.get("username")) || null,
      role: str(formData.get("role")) || "student",
      idnumber: str(formData.get("idnumber")) || null,
      institution: str(formData.get("institution")) || null,
      study_program: str(formData.get("study_program")) || null,
      suspended: formData.get("suspended") === "on",
    })
    .eq("id", id);

  revalidatePath("/admin/users");
}

export async function userDestroy(formData: FormData) {
  const staff = await requireStaff();
  const id = str(formData.get("user_id"));
  if (!id || id === staff.id) redirect("/admin/users?error=self");

  await db().auth.admin.deleteUser(id);
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=deleted");
}

/* ----------------------------------------------------------------- courses */

export async function courseStore(formData: FormData) {
  await requireStaff();

  const fullname = str(formData.get("fullname"));
  const shortname = str(formData.get("shortname"));
  if (!fullname || !shortname) redirect("/admin/courses?error=required");

  const { data: course, error } = await db()
    .from("courses")
    .insert({
      fullname,
      shortname,
      summary: str(formData.get("summary")) || null,
      category_id: num(formData.get("category_id")) || null,
      teacher_id: str(formData.get("teacher_id")) || null,
      color: str(formData.get("color")) || "#a12520",
      credits: num(formData.get("credits"), 3),
      semester: num(formData.get("semester"), 1),
      academic_year: str(formData.get("academic_year")) || "2026/2027",
      self_enrol: formData.get("self_enrol") === "on",
      enrol_key: str(formData.get("enrol_key")) || null,
      visible: true,
    })
    .select("id")
    .single();

  if (error || !course) {
    redirect(`/admin/courses?error=${encodeURIComponent(error?.message ?? "gagal")}`);
  }

  // seed the default sections so the course is immediately usable
  const titles = ["Pendahuluan & Kontrak Kuliah", "Materi Pertemuan 1-4", "Materi Pertemuan 5-8", "Evaluasi Akhir"];
  await db().from("course_sections").insert(
    titles.map((name, i) => ({ course_id: course.id, section: i, name, visible: true }))
  );

  if (str(formData.get("teacher_id"))) {
    await db()
      .from("enrollments")
      .upsert(
        {
          course_id: course.id,
          user_id: str(formData.get("teacher_id")),
          role: "teacher",
          status: "active",
        },
        { onConflict: "course_id,user_id" }
      );
  }

  revalidatePath("/admin/courses");
  revalidatePath("/course");
  redirect(`/course/${course.id}/manage`);
}

export async function courseDestroy(formData: FormData) {
  await requireStaff();
  await db().from("courses").delete().eq("id", num(formData.get("course_id")));
  revalidatePath("/admin/courses");
  revalidatePath("/course");
}

/* ----------------------------------------------------------- announcements */

export async function announcementStore(formData: FormData) {
  const staff = await requireStaff();

  const subject = str(formData.get("subject"));
  const message = str(formData.get("message"));
  if (!subject || !message) redirect("/admin/announcements?error=required");

  await db().from("announcements").insert({
    subject,
    message,
    user_id: staff.id,
    course_id: num(formData.get("course_id")) || null,
    pinned: formData.get("pinned") === "on",
    published: formData.get("published") !== "off",
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
}

export async function announcementDestroy(formData: FormData) {
  await requireStaff();
  await db().from("announcements").delete().eq("id", num(formData.get("announcement_id")));
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/");
}

/* ---------------------------------------------------------------- settings */

export async function settingsUpdate(formData: FormData) {
  const staff = await requireStaff();
  if (!isStaff(staff)) redirect("/my");

  const keys = [
    "site_name",
    "site_tagline",
    "site_short_name",
    "brand_color",
    "support_email",
    "support_wa_lecturer",
    "support_wa_student",
    "footer_address",
    "academic_year",
    "semester",
  ];

  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (value !== null) values[key] = String(value);
  }
  values.sso_enabled = formData.get("sso_enabled") === "on" ? "1" : "0";
  values.registration_enabled = formData.get("registration_enabled") === "on" ? "1" : "0";

  await saveSettings(values);

  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect("/admin/settings?saved=1");
}
