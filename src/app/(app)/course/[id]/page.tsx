import Link from "next/link";
import { notFound } from "next/navigation";
import { enrolCourse, toggleModuleComplete, unenrolCourse } from "@/app/actions/courses";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { getCourseContent, getParticipants } from "@/lib/data";
import { computeCourseGrade, letterTone } from "@/lib/grades";
import { getLocale } from "@/lib/i18n";
import { db } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, pct } from "@/lib/utils";
import type { GradeItem, GradeRow, Profile } from "@/lib/types";

export const metadata = { title: "Course" };

const TYPE_ICON = {
  assign: "file",
  quiz: "help",
  forum: "message",
  resource: "link",
} as const;

const TYPE_LABEL = {
  assign: "Assignment",
  quiz: "Quiz",
  forum: "Forum",
  resource: "Resource",
} as const;

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "course" } = await searchParams;
  const courseId = Number(id);
  const user = await requireUser();
  const locale = await getLocale();

  const content = await getCourseContent(courseId, user.id);
  if (!content) notFound();
  const { course, sections, modules, instances, completed } = content;

  const { data: enrolment } = await db()
    .from("enrollments")
    .select("id, role")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();

  const manage = user.role === "admin" || user.role === "manager" || course.teacher_id === user.id;
  const enrolled = !!enrolment || manage;
  const progress = pct(completed.size, modules.length);

  const tabs = [
    { key: "course", label: "Course", href: `/course/${courseId}` },
    { key: "participants", label: "Participants", href: `/course/${courseId}/participants` },
    { key: "grades", label: "Grades", href: `/course/${courseId}?tab=grades` },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* hero */}
      <div
        className="overflow-hidden rounded-2xl text-white"
        style={{ background: `linear-gradient(135deg, ${course.color}, ${course.color}dd)` }}
      >
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/75">
                <span>{course.shortname}</span>
                {course.category?.name && <span>· {course.category.name}</span>}
                {course.academic_year && <span>· {course.academic_year}</span>}
              </div>
              <h1 className="text-2xl font-bold leading-tight">{course.fullname}</h1>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-white/85">
                {course.summary}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="user" size={14} />
                  {course.teacher?.full_name ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="book" size={14} />
                  {course.credits} SKS · Semester {course.semester}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="chart" size={14} />
                  {progress}% complete
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {manage && (
                <Link href={`/course/${courseId}/manage`} className="btn bg-white text-brand hover:bg-white/90 btn-sm">
                  <Icon name="settings" size={15} />
                  Manage content
                </Link>
              )}
              {!enrolled && course.self_enrol && (
                <form action={enrolCourse} className="flex gap-1.5">
                  <input type="hidden" name="course_id" value={courseId} />
                  <input type="hidden" name="back" value={`/course/${courseId}`} />
                  {course.enrol_key && (
                    <input name="enrol_key" placeholder="Key" required className="input w-24 px-2 py-1.5 text-xs" />
                  )}
                  <SubmitButton className="btn bg-white text-brand btn-sm" pendingLabel="…">
                    Enrol me
                  </SubmitButton>
                </form>
              )}
              {enrolment && user.role === "student" && (
                <form action={unenrolCourse}>
                  <input type="hidden" name="course_id" value={courseId} />
                  <SubmitButton
                    className="btn border-white/40 bg-transparent text-white btn-sm"
                    confirm="Keluar dari mata kuliah ini?"
                    pendingLabel="…"
                  >
                    Unenrol
                  </SubmitButton>
                </form>
              )}
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-4 flex gap-1 border-b border-[var(--color-line)]">
        {tabs.map((t) => {
          const active = t.key === "course" ? tab === "course" : tab === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13.5px] font-semibold transition ${
                active
                  ? "border-brand text-brand"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "grades" ? (
        <GradesTab courseId={courseId} user={user} manage={manage} locale={locale} />
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            {sections.map((section) => {
              const sectionModules = modules.filter(
                (m) => m.section_id === section.id && (m.visible || manage)
              );
              const sectionDone = sectionModules.filter((m) => completed.has(m.id)).length;

              return (
                <details key={section.id} className="card overflow-hidden" open>
                  <summary className="flex cursor-pointer items-center justify-between gap-3 bg-soft/70 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon name="chevronDown" size={15} className="text-ink-3" />
                      <h2 className="text-[14px] font-bold text-ink">
                        {section.name ?? `Section ${section.section + 1}`}
                      </h2>
                      {!section.visible && <span className="badge-warn">Hidden</span>}
                    </div>
                    <span className="text-[11px] font-semibold text-ink-3">
                      {sectionDone}/{sectionModules.length} done
                    </span>
                  </summary>

                  {section.summary && (
                    <p className="border-t border-[var(--color-line-soft)] px-4 py-2 text-[12.5px] text-ink-2">
                      {section.summary}
                    </p>
                  )}

                  <div className="divide-y divide-[var(--color-line-soft)]">
                    {sectionModules.length === 0 && (
                      <p className="px-4 py-3 text-[12.5px] text-ink-3">No activities in this section.</p>
                    )}

                    {sectionModules.map((mod) => {
                      const done = completed.has(mod.id);
                      const href =
                        mod.type === "assign"
                          ? `/mod/assign/${mod.instance_id}`
                          : mod.type === "quiz"
                            ? `/mod/quiz/${mod.instance_id}`
                            : mod.type === "forum"
                              ? `/mod/forum/${mod.instance_id}`
                              : `/mod/resource/${mod.instance_id}`;
                      const assignment =
                        mod.type === "assign" && mod.instance_id
                          ? instances.assignments[mod.instance_id]
                          : null;
                      const quiz =
                        mod.type === "quiz" && mod.instance_id
                          ? instances.quizzes[mod.instance_id]
                          : null;

                      return (
                        <div key={mod.id} className="flex items-start gap-3 px-4 py-3 hover:bg-soft/40">
                          <span
                            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              done ? "bg-emerald-50 text-emerald-700" : "bg-brand-soft text-brand"
                            }`}
                          >
                            <Icon name={done ? "check" : TYPE_ICON[mod.type]} size={15} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Link
                                href={href}
                                className="text-[13.5px] font-semibold text-ink hover:text-brand"
                              >
                                {mod.name}
                              </Link>
                              <span className="badge-neutral">{TYPE_LABEL[mod.type]}</span>
                              {!mod.visible && <span className="badge-warn">Hidden</span>}
                            </div>
                            {mod.intro && (
                              <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-2">{mod.intro}</p>
                            )}
                            <p className="mt-0.5 text-[11px] text-ink-3">
                              {assignment?.duedate
                                ? `Due ${formatDateTime(assignment.duedate, locale)}`
                                : quiz?.close_at
                                  ? `Closes ${formatDateTime(quiz.close_at, locale)}`
                                  : mod.type === "forum"
                                    ? "Discussion forum"
                                    : mod.type === "resource"
                                      ? "Learning resource"
                                      : ""}
                            </p>
                          </div>

                          <form action={toggleModuleComplete} className="shrink-0">
                            <input type="hidden" name="module_id" value={mod.id} />
                            <SubmitButton
                              className={`btn-xs ${done ? "bg-emerald-50 text-emerald-700" : "bg-soft text-ink-3 hover:bg-brand-soft hover:text-brand"}`}
                              pendingLabel="…"
                            >
                              {done ? "Done" : "Mark done"}
                            </SubmitButton>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>

          <aside className="space-y-4">
            <div className="card card-pad">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink-3">
                Course details
              </h2>
              <dl className="space-y-2.5 text-[12.5px]">
                {[
                  ["Short name", course.shortname],
                  ["ID number", course.idnumber ?? "—"],
                  ["Credits", `${course.credits} SKS`],
                  ["Semester", String(course.semester)],
                  ["Academic year", course.academic_year ?? "—"],
                  ["Start", formatDate(course.start_date, { locale })],
                  ["End", formatDate(course.end_date, { locale })],
                  ["Participants", String((await getParticipants(courseId)).length)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-3">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card card-pad">
              <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink-3">
                Completion
              </h2>
              <p className="text-2xl font-bold text-ink">{progress}%</p>
              <p className="text-[12px] text-ink-3">
                {completed.size} of {modules.length} activities marked done
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

async function GradesTab({
  courseId,
  user,
  manage,
  locale,
}: {
  courseId: number;
  user: Profile;
  manage: boolean;
  locale: string;
}) {
  const [{ data: items }, { data: grades }, participants] = await Promise.all([
    db().from("grade_items").select("*").eq("course_id", courseId).order("sortorder"),
    db()
      .from("grade_grades")
      .select("*, item:grade_items!inner(course_id)")
      .eq("item.course_id", courseId),
    getParticipants(courseId),
  ]);

  const itemList = (items ?? []) as GradeItem[];
  const gradeList = (grades ?? []) as (GradeRow & { item?: unknown })[];

  if (itemList.length === 0) {
    return (
      <div className="card card-pad mt-5 text-sm text-ink-2">
        No grade items yet. {manage ? "Add them from Manage content." : ""}
      </div>
    );
  }

  if (!manage) {
    const own = gradeList.filter((g) => g.user_id === user.id);
    const result = computeCourseGrade(itemList, own);
    return (
      <div className="mt-5 space-y-4">
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-center">Weight</th>
                <th className="text-center">Grade</th>
                <th className="text-center">Max</th>
              </tr>
            </thead>
            <tbody>
              {result.cells.map((c) => (
                <tr key={c.item.id}>
                  <td className="font-medium text-ink">{c.item.name}</td>
                  <td className="text-center">{Number(c.weight)}%</td>
                  <td className="text-center font-semibold">{c.grade ?? "—"}</td>
                  <td className="text-center text-ink-3">{c.max}</td>
                </tr>
              ))}
              <tr className="bg-soft/60">
                <td className="font-bold">Final</td>
                <td className="text-center">{result.totalWeight}%</td>
                <td className="text-center font-bold">{result.final}</td>
                <td className="text-center">
                  <span className={`badge-${letterTone(result.letter)}`}>{result.letter}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const students = participants.filter((p) => p.role === "student");

  return (
    <div className="mt-5 card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white">Student</th>
            {itemList.map((i) => (
              <th key={i.id} className="text-center">
                {i.name}
                <span className="block text-[10px] font-medium normal-case text-ink-4">
                  {Number(i.weight)}%
                </span>
              </th>
            ))}
            <th className="text-center">Final</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const own = gradeList.filter((g) => g.user_id === s.profile.id);
            const result = computeCourseGrade(itemList, own);
            return (
              <tr key={s.id}>
                <td className="sticky left-0 bg-white">
                  <p className="font-medium text-ink">{s.profile.full_name}</p>
                  <p className="text-[11px] text-ink-3">{s.profile.username}</p>
                </td>
                {itemList.map((i) => {
                  const cell = result.cells.find((c) => c.item.id === i.id);
                  return (
                    <td key={i.id} className="text-center">
                      {cell?.grade ?? "—"}
                    </td>
                  );
                })}
                <td className="text-center">
                  <span className="font-semibold text-ink">{result.final}</span>
                  <span className={`ml-1.5 badge-${letterTone(result.letter)}`}>
                    {result.letter}
                  </span>
                </td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={itemList.length + 2} className="text-center text-ink-3">
                No students enrolled.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
