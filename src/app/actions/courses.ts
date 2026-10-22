"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageCourse, isStaff, requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { notify } from "@/lib/data";

async function guardManage(courseId: number) {
  const user = await requireUser();
  const ok = await canManageCourse(user, courseId);
  if (!ok) redirect(`/course/${courseId}`);
  return user;
}

function num(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

/* ------------------------------------------------------------------ enrolment */

export async function enrolCourse(formData: FormData) {
  const user = await requireUser();
  const courseId = num(formData.get("course_id"));
  const key = str(formData.get("enrol_key"));
  const back = str(formData.get("back")) || "/course";

  const { data: course } = await db()
    .from("courses")
    .select("id, fullname, self_enrol, enrol_key, visible")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) redirect(back);
  if (!course.self_enrol) redirect(`${back}?error=enrol_disabled`);
  if (course.enrol_key && course.enrol_key !== key) {
    redirect(`${back}?error=enrol_key`);
  }

  await db()
    .from("enrollments")
    .upsert(
      { course_id: courseId, user_id: user.id, role: "student", status: "active" },
      { onConflict: "course_id,user_id" }
    );

  revalidatePath("/my");
  revalidatePath(`/course/${courseId}`);
  redirect(`/course/${courseId}`);
}

export async function unenrolCourse(formData: FormData) {
  const user = await requireUser();
  const courseId = num(formData.get("course_id"));

  await db()
    .from("enrollments")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", user.id);

  revalidatePath("/my");
  redirect("/my/courses");
}

/* ------------------------------------------------------- activity completion */

export async function toggleModuleComplete(formData: FormData) {
  const user = await requireUser();
  const moduleId = num(formData.get("module_id"));

  const { data: mod } = await db()
    .from("course_modules")
    .select("id, course_id")
    .eq("id", moduleId)
    .maybeSingle();
  if (!mod) return;

  const { data: existing } = await db()
    .from("module_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    await db().from("module_completions").delete().eq("id", existing.id);
  } else {
    await db().from("module_completions").insert({
      user_id: user.id,
      course_id: mod.course_id,
      module_id: moduleId,
    });
  }

  revalidatePath(`/course/${mod.course_id}`);
  revalidatePath("/my");
}

/* ------------------------------------------------------------ course sections */

export async function sectionStore(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);

  const { data: last } = await db()
    .from("course_sections")
    .select("section")
    .eq("course_id", courseId)
    .order("section", { ascending: false })
    .limit(1)
    .maybeSingle();

  await db().from("course_sections").insert({
    course_id: courseId,
    section: (last?.section ?? -1) + 1,
    name: str(formData.get("name")) || "New section",
    summary: str(formData.get("summary")) || null,
    visible: true,
  });

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

export async function sectionUpdate(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  const id = num(formData.get("section_id"));

  await db()
    .from("course_sections")
    .update({
      name: str(formData.get("name")) || "Section",
      summary: str(formData.get("summary")) || null,
      visible: formData.get("visible") === "on",
    })
    .eq("id", id)
    .eq("course_id", courseId);

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

export async function sectionDestroy(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  const id = num(formData.get("section_id"));

  await db().from("course_sections").delete().eq("id", id).eq("course_id", courseId);

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

export async function sectionMove(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  const id = num(formData.get("section_id"));
  const dir = str(formData.get("direction")) === "up" ? -1 : 1;

  const { data: current } = await db()
    .from("course_sections")
    .select("id, section")
    .eq("id", id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!current) return;

  const { data: neighbour } = await db()
    .from("course_sections")
    .select("id, section")
    .eq("course_id", courseId)
    .eq("section", current.section + dir)
    .maybeSingle();
  if (!neighbour) return;

  await db().from("course_sections").update({ section: neighbour.section }).eq("id", current.id);
  await db().from("course_sections").update({ section: current.section }).eq("id", neighbour.id);

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

/* --------------------------------------------------------------- activities */

const TYPES = ["assign", "quiz", "forum", "resource"] as const;
type ModuleType = (typeof TYPES)[number];

export async function moduleStore(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  const user = await guardManage(courseId);

  const sectionId = num(formData.get("section_id"));
  const type = str(formData.get("type")) as ModuleType;
  const name = str(formData.get("name")) || "New activity";
  const intro = str(formData.get("intro")) || null;
  if (!TYPES.includes(type)) return;

  let instanceId: number | null = null;

  if (type === "assign") {
    const { data } = await db()
      .from("assignments")
      .insert({
        course_id: courseId,
        name,
        description: intro,
        duedate: str(formData.get("duedate")) || null,
        grade_max: num(formData.get("grade_max"), 100),
        submission_type: (str(formData.get("submission_type")) || "file") as string,
        allow_late: formData.get("allow_late") === "on",
      })
      .select("id")
      .single();
    instanceId = data?.id ?? null;
  } else if (type === "quiz") {
    const { data } = await db()
      .from("quizzes")
      .insert({
        course_id: courseId,
        name,
        intro,
        open_at: str(formData.get("open_at")) || null,
        close_at: str(formData.get("close_at")) || null,
        time_limit: num(formData.get("time_limit"), 0) || null,
        max_attempts: num(formData.get("max_attempts"), 1),
        grade_max: num(formData.get("grade_max"), 100),
      })
      .select("id")
      .single();
    instanceId = data?.id ?? null;
  } else if (type === "forum") {
    const { data } = await db()
      .from("forums")
      .insert({
        course_id: courseId,
        name,
        intro,
        type: str(formData.get("forum_type")) || "general",
      })
      .select("id")
      .single();
    instanceId = data?.id ?? null;
  } else {
    const kind = str(formData.get("kind")) || "url";
    const { data } = await db()
      .from("resources")
      .insert({
        course_id: courseId,
        name,
        intro,
        kind: kind === "page" ? "page" : kind === "file" ? "file" : "url",
        url: kind === "url" ? str(formData.get("url")) || "https://telkomuniversity.ac.id" : null,
        content: kind === "page" ? str(formData.get("content")) || null : null,
      })
      .select("id")
      .single();
    instanceId = data?.id ?? null;
  }

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
    type,
    instance_id: instanceId,
    name,
    intro,
    sortorder: (last?.sortorder ?? 0) + 1,
  });

  // keep the gradebook in sync with new graded activities
  if (type === "assign" && instanceId) {
    await db().from("grade_items").insert({
      course_id: courseId,
      item_type: "assign",
      item_id: instanceId,
      name,
      max_grade: num(formData.get("grade_max"), 100),
      weight: 1,
      sortorder: 90,
    });
  }

  await notify(
    user.id,
    "Aktivitas ditambahkan",
    `${name} berhasil ditambahkan ke mata kuliah.`,
    `/course/${courseId}/manage`
  );

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

export async function moduleUpdate(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  const id = num(formData.get("module_id"));

  const { data: mod } = await db()
    .from("course_modules")
    .select("*")
    .eq("id", id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!mod) return;

  const name = str(formData.get("name")) || mod.name;
  const intro = str(formData.get("intro")) || null;

  await db()
    .from("course_modules")
    .update({ name, intro, visible: formData.get("visible") === "on" })
    .eq("id", id);

  if (mod.instance_id) {
    if (mod.type === "assign") {
      await db()
        .from("assignments")
        .update({
          name,
          description: intro,
          duedate: str(formData.get("duedate")) || null,
          grade_max: num(formData.get("grade_max"), 100),
          submission_type: str(formData.get("submission_type")) || "file",
          allow_late: formData.get("allow_late") === "on",
        })
        .eq("id", mod.instance_id);
    } else if (mod.type === "quiz") {
      await db()
        .from("quizzes")
        .update({
          name,
          intro,
          open_at: str(formData.get("open_at")) || null,
          close_at: str(formData.get("close_at")) || null,
          time_limit: num(formData.get("time_limit"), 0) || null,
          max_attempts: num(formData.get("max_attempts"), 1),
          grade_max: num(formData.get("grade_max"), 100),
        })
        .eq("id", mod.instance_id);
    } else if (mod.type === "forum") {
      await db().from("forums").update({ name, intro }).eq("id", mod.instance_id);
    } else {
      await db()
        .from("resources")
        .update({
          name,
          intro,
          url: str(formData.get("url")) || null,
          content: str(formData.get("content")) || null,
        })
        .eq("id", mod.instance_id);
    }
  }

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

export async function moduleDestroy(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  const id = num(formData.get("module_id"));

  const { data: mod } = await db()
    .from("course_modules")
    .select("*")
    .eq("id", id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (!mod) return;

  if (mod.instance_id) {
    const table =
      mod.type === "assign"
        ? "assignments"
        : mod.type === "quiz"
          ? "quizzes"
          : mod.type === "forum"
            ? "forums"
            : "resources";
    await db().from(table).delete().eq("id", mod.instance_id);
  }

  await db().from("course_modules").delete().eq("id", id);

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

export async function moduleMove(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  const id = num(formData.get("module_id"));
  const dir = str(formData.get("direction")) === "up" ? -1 : 1;

  const { data: current } = await db()
    .from("course_modules")
    .select("id, sortorder, section_id")
    .eq("id", id)
    .maybeSingle();
  if (!current) return;

  const { data: siblings } = await db()
    .from("course_modules")
    .select("id, sortorder")
    .eq("course_id", courseId)
    .eq("section_id", current.section_id)
    .order("sortorder", { ascending: true });

  const list = siblings ?? [];
  const index = list.findIndex((m) => m.id === current.id);
  const target = list[index + dir];
  if (!target) return;

  await db().from("course_modules").update({ sortorder: target.sortorder }).eq("id", current.id);
  await db().from("course_modules").update({ sortorder: current.sortorder }).eq("id", target.id);

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
}

/* --------------------------------------------------------------- grade items */

export async function gradeItemStore(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);

  await db().from("grade_items").insert({
    course_id: courseId,
    item_type: "manual",
    name: str(formData.get("name")) || "Manual item",
    max_grade: num(formData.get("max_grade"), 100),
    weight: num(formData.get("weight"), 10),
    sortorder: num(formData.get("sortorder"), 50),
  });

  revalidatePath(`/course/${courseId}/manage`);
}

export async function gradeItemDestroy(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  await db()
    .from("grade_items")
    .delete()
    .eq("id", num(formData.get("item_id")))
    .eq("course_id", courseId);

  revalidatePath(`/course/${courseId}/manage`);
}

/* -------------------------------------------------------------- participants */

export async function participantStore(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);
  const userId = str(formData.get("user_id"));
  if (!userId) return;

  await db()
    .from("enrollments")
    .upsert(
      { course_id: courseId, user_id: userId, role: "student", status: "active" },
      { onConflict: "course_id,user_id" }
    );

  await notify(userId, "Enrolment baru", "Anda didaftarkan pada sebuah mata kuliah.", `/course/${courseId}`);

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}/participants`);
}

export async function participantDestroy(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);

  await db()
    .from("enrollments")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", str(formData.get("user_id")));

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}/participants`);
}

/* ------------------------------------------------------------ course settings */

export async function courseUpdate(formData: FormData) {
  const courseId = num(formData.get("course_id"));
  await guardManage(courseId);

  const { data: existing } = await db()
    .from("courses")
    .select("fullname, shortname")
    .eq("id", courseId)
    .maybeSingle();

  const shortname = str(formData.get("shortname")) || existing?.shortname;

  await db()
    .from("courses")
    .update({
      fullname: str(formData.get("fullname")) || existing?.fullname,
      shortname,
      summary: str(formData.get("summary")) || null,
      color: str(formData.get("color")) || "#a12520",
      visible: formData.get("visible") === "on",
      self_enrol: formData.get("self_enrol") === "on",
      enrol_key: str(formData.get("enrol_key")) || null,
      credits: num(formData.get("credits"), 3),
      semester: num(formData.get("semester"), 1),
      academic_year: str(formData.get("academic_year")) || null,
      teacher_id: str(formData.get("teacher_id")) || null,
      category_id: num(formData.get("category_id")) || null,
    })
    .eq("id", courseId);

  revalidatePath(`/course/${courseId}/manage`);
  revalidatePath(`/course/${courseId}`);
  revalidatePath("/course");
}

export async function ensureSelfEnrolStaff(formData: FormData) {
  const user = await requireUser();
  if (!isStaff(user)) return;
  await enrolCourse(formData);
}
