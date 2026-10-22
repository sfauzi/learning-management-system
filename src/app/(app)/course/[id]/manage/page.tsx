import Link from "next/link";
import { notFound } from "next/navigation";
import {
  gradeItemDestroy,
  gradeItemStore,
  moduleDestroy,
  moduleMove,
  moduleStore,
  moduleUpdate,
  participantDestroy,
  participantStore,
  reorderModules,
  reorderSections,
  sectionDestroy,
  sectionMove,
  sectionUpdate,
  courseUpdate,
} from "@/app/actions/courses";
import { ManagePanels } from "@/components/course/ManagePanels";
import { Reorderable } from "@/components/course/Reorderable";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { canManageCourse, requireUser } from "@/lib/auth";
import { getCourseContent, getParticipants } from "@/lib/data";
import { db } from "@/lib/supabase/admin";
import { formatDateTime, isoToWibInput } from "@/lib/utils";
import type { GradeItem, Profile } from "@/lib/types";

export const metadata = { title: "Manage content" };

/** datetime-local value in WIB, whatever timezone the server runs in. */
const toLocalInput = (value: string | null) => isoToWibInput(value);

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const courseId = Number(id);
  const user = await requireUser();

  if (!(await canManageCourse(user, courseId))) {
    return (
      <div className="card card-pad text-sm text-ink-2">
        Anda tidak memiliki akses untuk mengelola mata kuliah ini.
      </div>
    );
  }

  const content = await getCourseContent(courseId);
  if (!content) notFound();
  const { course, sections, modules, instances } = content;

  const [{ data: gradeItems }, participants, { data: people }, { data: cats }] =
    await Promise.all([
      db().from("grade_items").select("*").eq("course_id", courseId).order("sortorder"),
      getParticipants(courseId),
      db().from("profiles").select("*").order("full_name"),
      db().from("course_categories").select("*").order("sortorder"),
    ]);

  const items = (gradeItems ?? []) as GradeItem[];
  const enrolledIds = new Set(participants.map((p) => p.profile.id));
  const candidates = ((people ?? []) as Profile[]).filter((p) => !enrolledIds.has(p.id));
  const lecturers = ((people ?? []) as Profile[]).filter((p) => p.role !== "student");

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link
        href={`/course/${courseId}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {course.fullname}
      </Link>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Manage content
          </p>
          <h1 className="text-2xl font-bold text-ink">{course.fullname}</h1>
          <p className="text-sm text-ink-3">
            {sections.length} sections · {modules.length} activities · {items.length} grade items
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/course/${courseId}`} className="btn-neutral btn-sm">
            <Icon name="eye" size={15} />
            View course
          </Link>
          <Link href={`/course/${courseId}/participants`} className="btn-outline btn-sm">
            <Icon name="users" size={15} />
            Participants
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert-error mb-4">
          {error === "file" ? "Pilih berkas terlebih dahulu." : decodeURIComponent(error)}
        </div>
      )}

      {/* ---------------------------------------------------------- settings */}
      <details className="card mb-5 overflow-hidden">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-[14px] font-bold text-ink">
            <Icon name="settings" size={16} className="text-ink-3" />
            Course settings
          </span>
          <Icon name="chevronDown" size={15} className="text-ink-3" />
        </summary>
        <form action={courseUpdate} className="grid gap-4 border-t border-[var(--color-line-soft)] p-4 sm:grid-cols-2">
          <input type="hidden" name="course_id" value={courseId} />
          <div className="field sm:col-span-2">
            <label className="label">Full name</label>
            <input name="fullname" defaultValue={course.fullname} className="input" required />
          </div>
          <div className="field">
            <label className="label">Short name</label>
            <input name="shortname" defaultValue={course.shortname} className="input" required />
          </div>
          <div className="field">
            <label className="label">Category</label>
            <select name="category_id" defaultValue={course.category_id ?? ""} className="select">
              <option value="">—</option>
              {(cats ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field sm:col-span-2">
            <label className="label">Summary</label>
            <textarea name="summary" defaultValue={course.summary ?? ""} className="textarea" />
          </div>
          <div className="field">
            <label className="label">Lecturer</label>
            <select name="teacher_id" defaultValue={course.teacher_id ?? ""} className="select">
              <option value="">—</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Colour</label>
            <input type="color" name="color" defaultValue={course.color} className="input h-11 p-1" />
          </div>
          <div className="field">
            <label className="label">Credits (SKS)</label>
            <input type="number" name="credits" defaultValue={course.credits} min={1} max={8} className="input" />
          </div>
          <div className="field">
            <label className="label">Semester</label>
            <input type="number" name="semester" defaultValue={course.semester} min={1} max={14} className="input" />
          </div>
          <div className="field">
            <label className="label">Academic year</label>
            <input name="academic_year" defaultValue={course.academic_year ?? ""} className="input" />
          </div>
          <div className="field">
            <label className="label">Enrolment key</label>
            <input name="enrol_key" defaultValue={course.enrol_key ?? ""} className="input" placeholder="optional" />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-2">
            <input type="checkbox" name="visible" defaultChecked={course.visible} className="h-4 w-4 accent-[#a12520]" />
            Visible in catalogue
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-2">
            <input type="checkbox" name="self_enrol" defaultChecked={course.self_enrol} className="h-4 w-4 accent-[#a12520]" />
            Allow self-enrolment
          </label>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-brand">Save settings</SubmitButton>
          </div>
        </form>
      </details>

      {/* ---------------------------------------------------------- sections */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-bold text-ink">Sections &amp; activities</h2>
            <span className="text-[11.5px] text-ink-3">
              {sections.length} section · {modules.length} aktivitas
            </span>
          </div>

      <Reorderable
        courseId={courseId}
        kind="sections"
        action={reorderSections}
        label="Urutan bagian"
        items={sections.map((section) => {
          const sectionModules = modules.filter((m) => m.section_id === section.id);
          return {
            id: section.id,
            content: (
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line-soft)] bg-soft/60 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="badge-brand">{section.section + 1}</span>
                  <h3 className="text-[14px] font-bold text-ink">
                    {section.name ?? `Section ${section.section + 1}`}
                  </h3>
                  {!section.visible && <span className="badge-warn">Hidden</span>}
                </div>
                <div className="flex items-center gap-1">
                  <form action={sectionMove}>
                    <input type="hidden" name="course_id" value={courseId} />
                    <input type="hidden" name="section_id" value={section.id} />
                    <input type="hidden" name="direction" value="up" />
                    <SubmitButton className="btn-ghost btn-xs" pendingLabel="…">↑</SubmitButton>
                  </form>
                  <form action={sectionMove}>
                    <input type="hidden" name="course_id" value={courseId} />
                    <input type="hidden" name="section_id" value={section.id} />
                    <input type="hidden" name="direction" value="down" />
                    <SubmitButton className="btn-ghost btn-xs" pendingLabel="…">↓</SubmitButton>
                  </form>
                  <form action={sectionDestroy}>
                    <input type="hidden" name="course_id" value={courseId} />
                    <input type="hidden" name="section_id" value={section.id} />
                    <SubmitButton
                      className="btn-danger btn-xs"
                      confirm="Hapus bagian ini beserta seluruh aktivitas di dalamnya?"
                      pendingLabel="…"
                    >
                      <Icon name="trash" size={13} />
                    </SubmitButton>
                  </form>
                </div>
              </div>

              {sectionModules.length === 0 ? (
                <p className="px-4 py-3 text-[12.5px] text-ink-3">No activities yet.</p>
              ) : (
                <Reorderable
                  courseId={courseId}
                  kind="modules"
                  sectionId={section.id}
                  action={reorderModules}
                  label="Urutan aktivitas"
                  handleInside
                  listClassName="divide-y divide-[var(--color-line-soft)]"
                  items={sectionModules.map((mod) => {
                  const assignment =
                    mod.type === "assign" && mod.instance_id ? instances.assignments[mod.instance_id] : null;
                  const quiz = mod.type === "quiz" && mod.instance_id ? instances.quizzes[mod.instance_id] : null;
                  const resource =
                    mod.type === "resource" && mod.instance_id ? instances.resources[mod.instance_id] : null;

                  return {
                    id: mod.id,
                    content: (
                    <div className="px-4 py-3 pl-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <Icon
                            name={
                              mod.type === "assign"
                                ? "file"
                                : mod.type === "quiz"
                                  ? "help"
                                  : mod.type === "forum"
                                    ? "message"
                                    : "link"
                            }
                            size={14}
                          />
                        </span>
                        <span className="text-[13.5px] font-semibold text-ink">{mod.name}</span>
                        <span className="badge-neutral capitalize">{mod.type}</span>
                        {!mod.visible && <span className="badge-warn">Hidden</span>}
                        <span className="ml-auto flex items-center gap-1">
                          {mod.type === "quiz" && mod.instance_id && (
                            <Link
                              href={`/mod/quiz/${mod.instance_id}/build`}
                              className="btn-outline btn-xs"
                              title="Kelola bank soal kuis ini"
                            >
                              <Icon name="list" size={12} />
                              Bank soal
                            </Link>
                          )}
                          <form action={moduleMove}>
                            <input type="hidden" name="course_id" value={courseId} />
                            <input type="hidden" name="module_id" value={mod.id} />
                            <input type="hidden" name="direction" value="up" />
                            <SubmitButton className="btn-ghost btn-xs" pendingLabel="…">↑</SubmitButton>
                          </form>
                          <form action={moduleMove}>
                            <input type="hidden" name="course_id" value={courseId} />
                            <input type="hidden" name="module_id" value={mod.id} />
                            <input type="hidden" name="direction" value="down" />
                            <SubmitButton className="btn-ghost btn-xs" pendingLabel="…">↓</SubmitButton>
                          </form>
                          <form action={moduleDestroy}>
                            <input type="hidden" name="course_id" value={courseId} />
                            <input type="hidden" name="module_id" value={mod.id} />
                            <SubmitButton
                              className="btn-danger btn-xs"
                              confirm={`Hapus "${mod.name}"?`}
                              pendingLabel="…"
                            >
                              <Icon name="trash" size={13} />
                            </SubmitButton>
                          </form>
                        </span>
                      </div>

                      <p className="mt-1 pl-9 text-[11.5px] text-ink-3">
                        {assignment?.duedate ? `Due ${formatDateTime(assignment.duedate)} WIB` : null}
                        {quiz
                          ? `${quiz.max_attempts} attempts · ${quiz.time_limit ?? "no"} min · max ${Number(quiz.grade_max)}`
                          : null}
                        {resource?.kind ? `Resource (${resource.kind})` : null}
                      </p>

                      <details className="mt-2 pl-9">
                        <summary className="cursor-pointer text-[12px] font-semibold text-brand">
                          Edit activity
                        </summary>
                        <form action={moduleUpdate} className="mt-2 grid gap-2.5 rounded-xl bg-soft p-3 sm:grid-cols-2">
                          <input type="hidden" name="course_id" value={courseId} />
                          <input type="hidden" name="module_id" value={mod.id} />
                          <div className="field sm:col-span-2">
                            <label className="label">Name</label>
                            <input name="name" defaultValue={mod.name} className="input" />
                          </div>
                          <div className="field sm:col-span-2">
                            <label className="label">Intro / description</label>
                            <textarea
                              name="intro"
                              defaultValue={mod.intro ?? ""}
                              className="textarea min-h-[70px]"
                            />
                          </div>

                          {mod.type === "assign" && (
                            <>
                              <div className="field">
                                <label className="label">Due date (WIB)</label>
                                <input
                                  type="datetime-local"
                                  name="duedate"
                                  defaultValue={toLocalInput(assignment?.duedate ?? null)}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Max grade</label>
                                <input
                                  type="number"
                                  name="grade_max"
                                  defaultValue={assignment?.grade_max ?? 100}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Weight (%)</label>
                                <input
                                  type="number"
                                  name="weight"
                                  min={0}
                                  step="0.01"
                                  defaultValue={10}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Submission type</label>
                                <select
                                  name="submission_type"
                                  defaultValue={assignment?.submission_type ?? "file"}
                                  className="select"
                                >
                                  <option value="file">File</option>
                                  <option value="online">Online text</option>
                                  <option value="both">File + online text</option>
                                </select>
                              </div>
                              <label className="flex items-end gap-2 pb-2 text-[13px] text-ink-2">
                                <input
                                  type="checkbox"
                                  name="allow_late"
                                  defaultChecked={assignment?.allow_late ?? true}
                                  className="h-4 w-4 accent-[#a12520]"
                                />
                                Allow late submission
                              </label>
                            </>
                          )}

                          {mod.type === "quiz" && (
                            <>
                              <div className="field">
                                <label className="label">Opens</label>
                                <input
                                  type="datetime-local"
                                  name="open_at"
                                  defaultValue={toLocalInput(quiz?.open_at ?? null)}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Closes</label>
                                <input
                                  type="datetime-local"
                                  name="close_at"
                                  defaultValue={toLocalInput(quiz?.close_at ?? null)}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Time limit (minutes)</label>
                                <input
                                  type="number"
                                  name="time_limit"
                                  defaultValue={quiz?.time_limit ?? 0}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Max attempts</label>
                                <input
                                  type="number"
                                  name="max_attempts"
                                  defaultValue={quiz?.max_attempts ?? 1}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Max grade</label>
                                <input
                                  type="number"
                                  name="grade_max"
                                  min={1}
                                  step="0.01"
                                  defaultValue={Number(quiz?.grade_max ?? 100)}
                                  className="input"
                                />
                              </div>
                              <div className="field">
                                <label className="label">Weight (%)</label>
                                <input
                                  type="number"
                                  name="weight"
                                  min={0}
                                  step="0.01"
                                  defaultValue={1}
                                  className="input"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Link
                                  href={`/mod/quiz/${mod.instance_id}/build`}
                                  className="text-[12px] font-semibold text-brand hover:underline"
                                >
                                  Kelola bank soal kuis ini →
                                </Link>
                              </div>
                            </>
                          )}

                          {mod.type === "resource" && (
                            <>
                              <div className="field">
                                <label className="label">URL</label>
                                <input name="url" defaultValue={resource?.url ?? ""} className="input" />
                              </div>
                              <div className="field">
                                <label className="label">Page content</label>
                                <input name="content" className="input" placeholder="Optional HTML/text" />
                              </div>
                            </>
                          )}

                          <label className="flex items-center gap-2 text-[13px] text-ink-2">
                            <input
                              type="checkbox"
                              name="visible"
                              defaultChecked={mod.visible}
                              className="h-4 w-4 accent-[#a12520]"
                            />
                            Visible to students
                          </label>
                          <div className="sm:col-span-2">
                            <SubmitButton className="btn-brand btn-sm">Update activity</SubmitButton>
                          </div>
                        </form>
                      </details>
                    </div>
                    ),
                  };
                })}
                />
              )}

            </section>
            ),
          };
        })}
      />

        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <ManagePanels
            courseId={courseId}
            sections={sections.map((s) => ({ id: s.id, name: s.name, section: s.section }))}
          />

      {/* -------------------------------------------------------- grade items */}
      <section className="card overflow-hidden">
        <div className="card-head">
          <h2 className="text-[14px] font-bold text-ink">Grade items</h2>
          <span className="badge-neutral">{items.length}</span>
        </div>
        <div className="divide-y divide-[var(--color-line-soft)]">
          {items.length === 0 && (
            <p className="px-4 py-3 text-[12.5px] text-ink-3">No grade items yet.</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-ink">{item.name}</p>
                <p className="text-[11px] text-ink-3">
                  <span className="capitalize">{item.item_type}</span> · bobot {Number(item.weight)}% · maks{" "}
                  {Number(item.max_grade)}
                </p>
              </div>
              <form action={gradeItemDestroy}>
                <input type="hidden" name="course_id" value={courseId} />
                <input type="hidden" name="item_id" value={item.id} />
                <SubmitButton className="btn-danger btn-xs" confirm="Hapus item penilaian?" pendingLabel="…">
                  <Icon name="trash" size={12} />
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
        <form
          action={gradeItemStore}
          className="grid gap-2 border-t border-[var(--color-line-soft)] bg-soft/40 p-4"
        >
          <input type="hidden" name="course_id" value={courseId} />
          <div className="field">
            <label className="label">Nama item</label>
            <input name="name" placeholder="mis. Ujian Akhir Semester" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="field">
              <label className="label">Bobot %</label>
              <input name="weight" type="number" min={0} defaultValue={10} className="input" />
            </div>
            <div className="field">
              <label className="label">Nilai maks</label>
              <input name="max_grade" type="number" min={1} defaultValue={100} className="input" />
            </div>
          </div>
          <SubmitButton className="btn-outline w-full" pendingLabel="…">
            <Icon name="plus" size={13} />
            Tambah item
          </SubmitButton>
        </form>
      </section>

      {/* -------------------------------------------------------- participants */}
      <section className="card overflow-hidden">
        <div className="card-head">
          <h2 className="text-[14px] font-bold text-ink">Peserta</h2>
          <span className="badge-neutral">{participants.length}</span>
        </div>
        <div className="max-h-[320px] divide-y divide-[var(--color-line-soft)] overflow-y-auto">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-2.5">
              <Avatar name={p.profile?.full_name} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-ink">
                  {p.profile?.full_name}
                </p>
                <p className="truncate text-[11px] capitalize text-ink-3">{p.role}</p>
              </div>
              {p.role === "student" && (
                <form action={participantDestroy}>
                  <input type="hidden" name="course_id" value={courseId} />
                  <input type="hidden" name="user_id" value={p.profile.id} />
                  <SubmitButton className="btn-danger btn-xs" confirm="Keluarkan peserta ini?" pendingLabel="…">
                    <Icon name="trash" size={12} />
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
        <form
          action={participantStore}
          className="grid gap-2 border-t border-[var(--color-line-soft)] bg-soft/40 p-4"
        >
          <input type="hidden" name="course_id" value={courseId} />
          <div className="field">
            <label className="label">Daftarkan peserta</label>
            <select name="user_id" required className="select">
              <option value="">Pilih pengguna…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.username})
                </option>
              ))}
            </select>
          </div>
          <SubmitButton className="btn-outline w-full" pendingLabel="…">
            <Icon name="plus" size={13} />
            Daftarkan
          </SubmitButton>
        </form>
      </section>
        </aside>
      </div>
    </div>
  );
}
