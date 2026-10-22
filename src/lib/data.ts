import { db } from "@/lib/supabase/admin";
import { isStaff, isTeacherLike } from "@/lib/auth";
import type {
  Announcement,
  Assignment,
  CalendarEvent,
  Category,
  Course,
  CourseModule,
  Discussion,
  Forum,
  GradeItem,
  GradeRow,
  Profile,
  Quiz,
  Section,
  Submission,
} from "@/lib/types";
import { pct } from "@/lib/utils";

export type CourseCardData = Course & {
  moduleCount: number;
  completedCount: number;
  progress: number;
  enrolled: boolean;
  studentCount: number;
};

const COURSE_SELECT =
  "*, teacher:profiles!courses_teacher_id_fkey(id,full_name,email), category:course_categories(id,name)";

export async function getCategories(): Promise<Category[]> {
  const { data } = await db()
    .from("course_categories")
    .select("*")
    .order("sortorder", { ascending: true });
  return (data ?? []) as Category[];
}

export async function enrolledCourseIds(userId: string): Promise<number[]> {
  const { data } = await db()
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.course_id as number);
}

/** Courses shown on the dashboard: enrolled ones, or everything for staff. */
export async function courseCards(user: Profile): Promise<CourseCardData[]> {
  const ids = await enrolledCourseIds(user.id);

  let query = db().from("courses").select(COURSE_SELECT).order("fullname");
  if (!isStaff(user)) {
    if (!ids.length) return [];
    query = query.in("id", ids);
  }

  const { data: courses } = await query;
  const list = (courses ?? []) as Course[];
  if (!list.length) return [];

  const courseIds = list.map((c) => c.id);

  const [{ data: modules }, { data: completions }, { data: enrollments }] =
    await Promise.all([
      db().from("course_modules").select("id,course_id").in("course_id", courseIds),
      db()
        .from("module_completions")
        .select("module_id,course_id")
        .eq("user_id", user.id)
        .in("course_id", courseIds),
      db()
        .from("enrollments")
        .select("course_id,role")
        .eq("role", "student")
        .in("course_id", courseIds),
    ]);

  const moduleCount = new Map<number, number>();
  for (const m of modules ?? []) {
    moduleCount.set(m.course_id, (moduleCount.get(m.course_id) ?? 0) + 1);
  }
  const doneCount = new Map<number, number>();
  for (const c of completions ?? []) {
    doneCount.set(c.course_id, (doneCount.get(c.course_id) ?? 0) + 1);
  }
  const students = new Map<number, number>();
  for (const e of enrollments ?? []) {
    students.set(e.course_id, (students.get(e.course_id) ?? 0) + 1);
  }

  return list.map((course) => {
    const total = moduleCount.get(course.id) ?? 0;
    const done = doneCount.get(course.id) ?? 0;
    return {
      ...course,
      moduleCount: total,
      completedCount: done,
      progress: pct(done, total),
      enrolled: ids.includes(course.id),
      studentCount: students.get(course.id) ?? 0,
    };
  });
}

export type CourseContent = {
  course: Course;
  sections: Section[];
  modules: CourseModule[];
  instances: {
    assignments: Record<number, Assignment>;
    quizzes: Record<number, Quiz>;
    forums: Record<number, Forum>;
    resources: Record<number, { id: number; name: string; kind: string; url: string | null; content: string | null; file_name: string | null }>;
  };
  completed: Set<number>;
  gradeItemCount: number;
};

export async function getCourseContent(
  courseId: number,
  userId?: string
): Promise<CourseContent | null> {
  const { data: course } = await db()
    .from("courses")
    .select(COURSE_SELECT)
    .eq("id", courseId)
    .maybeSingle();
  if (!course) return null;

  const [{ data: sections }, { data: modules }] = await Promise.all([
    db()
      .from("course_sections")
      .select("*")
      .eq("course_id", courseId)
      .order("section", { ascending: true }),
    db()
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("sortorder", { ascending: true }),
  ]);

  const mods = (modules ?? []) as CourseModule[];
  const idsBy = (type: string) =>
    mods.filter((m) => m.type === type && m.instance_id).map((m) => m.instance_id!);

  const [{ data: assignments }, { data: quizzes }, { data: forums }, { data: resources }, { data: items }] =
    await Promise.all([
      idsBy("assign").length
        ? db().from("assignments").select("*").in("id", idsBy("assign"))
        : Promise.resolve({ data: [] }),
      idsBy("quiz").length
        ? db().from("quizzes").select("*").in("id", idsBy("quiz"))
        : Promise.resolve({ data: [] }),
      idsBy("forum").length
        ? db().from("forums").select("*").in("id", idsBy("forum"))
        : Promise.resolve({ data: [] }),
      idsBy("resource").length
        ? db().from("resources").select("id,name,kind,url,content,file_name").in("id", idsBy("resource"))
        : Promise.resolve({ data: [] }),
      db().from("grade_items").select("id").eq("course_id", courseId),
    ]);

  let completed = new Set<number>();
  if (userId) {
    const { data } = await db()
      .from("module_completions")
      .select("module_id")
      .eq("course_id", courseId)
      .eq("user_id", userId);
    completed = new Set((data ?? []).map((r) => r.module_id as number));
  }

  const key = <T extends { id: number }>(rows: T[] | null) =>
    Object.fromEntries((rows ?? []).map((r) => [r.id, r])) as Record<number, T>;

  return {
    course: course as Course,
    sections: (sections ?? []) as Section[],
    modules: mods,
    instances: {
      assignments: key(assignments as Assignment[] | null),
      quizzes: key(quizzes as Quiz[] | null),
      forums: key(forums as Forum[] | null),
      resources: key(
        resources as {
          id: number;
          name: string;
          kind: string;
          url: string | null;
          content: string | null;
          file_name: string | null;
        }[] | null
      ),
    },
    completed,
    gradeItemCount: (items ?? []).length,
  };
}

export async function getAnnouncements(opts: {
  courseIds?: number[];
  limit?: number;
  publishedOnly?: boolean;
  siteOnly?: boolean;
}): Promise<Announcement[]> {
  let query = db()
    .from("announcements")
    .select(
      "*, author:profiles!announcements_user_id_fkey(id,full_name,username), course:courses(id,fullname,shortname)"
    )
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts.publishedOnly !== false) query = query.eq("published", true);
  if (opts.siteOnly) query = query.is("course_id", null);
  if (opts.courseIds) {
    if (!opts.courseIds.length) query = query.is("course_id", null);
    else query = query.or(`course_id.is.null,course_id.in.(${opts.courseIds.join(",")})`);
  }
  if (opts.limit) query = query.limit(opts.limit);

  const { data } = await query;
  return (data ?? []) as Announcement[];
}

export async function getUpcomingEvents(
  courseIds: number[],
  userId: string,
  limit = 8
): Promise<CalendarEvent[]> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  const filter = courseIds.length
    ? `course_id.in.(${courseIds.join(",")}),user_id.eq.${userId}`
    : `user_id.eq.${userId}`;

  const { data } = await db()
    .from("calendar_events")
    .select("*, course:courses(id,fullname,shortname)")
    .or(filter)
    .gte("start_at", from.toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);

  return (data ?? []) as CalendarEvent[];
}

export async function getPendingAssignments(
  courseIds: number[],
  userId: string,
  limit = 5
) {
  if (!courseIds.length) return [];
  const { data: assignments } = await db()
    .from("assignments")
    .select("*, course:courses(id,fullname,shortname)")
    .in("course_id", courseIds)
    .gte("duedate", new Date().toISOString())
    .order("duedate", { ascending: true })
    .limit(20);

  const list = (assignments ?? []) as (Assignment & { course: Course })[];
  if (!list.length) return [];

  const { data: submissions } = await db()
    .from("assignment_submissions")
    .select("assignment_id")
    .eq("user_id", userId)
    .in("assignment_id", list.map((a) => a.id));

  const done = new Set((submissions ?? []).map((s) => s.assignment_id as number));
  return list.filter((a) => !done.has(a.id)).slice(0, limit);
}

export type GradebookRow = {
  course: Course;
  items: GradeItem[];
  grades: GradeRow[];
};

export async function getGradebook(courseIds: number[]): Promise<GradebookRow[]> {
  if (!courseIds.length) return [];
  const [{ data: courses }, { data: items }] = await Promise.all([
    db().from("courses").select(COURSE_SELECT).in("id", courseIds).order("fullname"),
    db()
      .from("grade_items")
      .select("*")
      .in("course_id", courseIds)
      .order("sortorder", { ascending: true }),
  ]);

  const itemList = (items ?? []) as GradeItem[];
  const { data: grades } = itemList.length
    ? await db()
        .from("grade_grades")
        .select("*")
        .in(
          "grade_item_id",
          itemList.map((i) => i.id)
        )
    : { data: [] };

  const gradeList = (grades ?? []) as GradeRow[];

  return ((courses ?? []) as Course[]).map((course) => ({
    course,
    items: itemList.filter((i) => i.course_id === course.id),
    grades: gradeList,
  }));
}

export async function getParticipants(courseId: number) {
  const { data } = await db()
    .from("enrollments")
    .select("*, profile:profiles!enrollments_user_id_fkey(*)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as {
    id: number;
    role: string;
    status: string;
    timestart: string | null;
    profile: Profile;
  }[];
}

export async function getTeachingCourses(userId: string) {
  const { data } = await db()
    .from("courses")
    .select(COURSE_SELECT)
    .eq("teacher_id", userId)
    .order("fullname");

  const courses = (data ?? []) as Course[];
  if (!courses.length) return [];

  const ids = courses.map((c) => c.id);
  const [{ data: enrollments }, { data: modules }] = await Promise.all([
    db().from("enrollments").select("course_id,role").in("course_id", ids),
    db().from("course_modules").select("id,course_id").in("course_id", ids),
  ]);

  return courses.map((course) => ({
    course,
    studentCount: (enrollments ?? []).filter(
      (e) => e.course_id === course.id && e.role === "student"
    ).length,
    moduleCount: (modules ?? []).filter((m) => m.course_id === course.id).length,
  }));
}

export async function getDiscussions(forumId: number): Promise<Discussion[]> {
  const { data } = await db()
    .from("forum_discussions")
    .select(
      "*, profile:profiles!forum_discussions_user_id_fkey(full_name,username,role,avatar_path)"
    )
    .eq("forum_id", forumId)
    .order("pinned", { ascending: false })
    .order("last_post_at", { ascending: false });
  return (data ?? []) as Discussion[];
}

export async function getSubmissionsFor(assignmentId: number): Promise<Submission[]> {
  const { data } = await db()
    .from("assignment_submissions")
    .select("*, profile:profiles!assignment_submissions_user_id_fkey(full_name,username)")
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: true });
  return (data ?? []) as Submission[];
}

export async function unreadNotificationCount(userId: string) {
  const { count } = await db()
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function notify(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  await db().from("app_notifications").insert({
    user_id: userId,
    title,
    body,
    url: url ?? null,
  });
}

export async function isTeacherUser(user: Profile | null) {
  return isTeacherLike(user);
}
