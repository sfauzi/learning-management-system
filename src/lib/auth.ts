import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/admin";
import { isStaff, isTeacherLike, roleLabel } from "@/lib/roles";
import type { Profile } from "@/lib/types";

export { isStaff, isTeacherLike, roleLabel };

/** Auth user + profile row for the current request (null when signed out). */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  if (profile.suspended) return null;
  return profile as Profile;
});

export async function requireUser(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff(): Promise<Profile> {
  const user = await requireUser();
  if (!isStaff(user)) redirect("/my");
  return user;
}

export async function requireTeacher(): Promise<Profile> {
  const user = await requireUser();
  if (!isTeacherLike(user)) redirect("/my");
  return user;
}

/** A lecturer may manage a course when they own it; staff may manage any. */
export async function canManageCourse(
  user: Profile | null,
  courseId: number
): Promise<boolean> {
  if (!user) return false;
  if (isStaff(user)) return true;
  if (user.role !== "teacher") return false;
  const { data } = await db()
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function isEnrolled(userId: string, courseId: number): Promise<boolean> {
  const { data } = await db()
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/** Throws a redirect/404 when the visitor may not open a course page. */
export async function requireCourseAccess(user: Profile, courseId: number) {
  const { data: course } = await db()
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) redirect("/course");

  const manage = await canManageCourse(user, courseId);
  const enrolled = await isEnrolled(user.id, courseId);

  if (!manage && !enrolled && !course.visible) redirect("/course");

  return { course, manage, enrolled };
}

export async function requireManage(user: Profile, courseId: number) {
  const ok = await canManageCourse(user, courseId);
  if (!ok) redirect(`/course/${courseId}`);
}
