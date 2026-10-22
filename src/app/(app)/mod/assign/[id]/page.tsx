import Link from "next/link";
import { notFound } from "next/navigation";
import { gradeSubmission } from "@/app/actions/learning";
import { uploadSubmission } from "@/app/actions/files";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { canManageCourse, isEnrolled, requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { getLocale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import type { Assignment } from "@/lib/types";

export const metadata = { title: "Assignment" };

export default async function AssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const assignmentId = Number(id);
  const user = await requireUser();
  const locale = await getLocale();

  const { data } = await db()
    .from("assignments")
    .select("*, course:courses(id, fullname, shortname, color, teacher_id)")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!data) notFound();
  const assignment = data as Assignment & {
    course: { id: number; fullname: string; shortname: string; color: string; teacher_id: string | null };
  };

  const manage = await canManageCourse(user, assignment.course_id);
  const enrolled = await isEnrolled(user.id, assignment.course_id);
  if (!manage && !enrolled) {
    return (
      <div className="card card-pad text-sm text-ink-2">
        Anda tidak terdaftar pada mata kuliah ini.
      </div>
    );
  }

  const { data: submission } = await db()
    .from("assignment_submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: submissions } = manage
    ? await db()
        .from("assignment_submissions")
        .select("*, profile:profiles!assignment_submissions_user_id_fkey(full_name, username)")
        .eq("assignment_id", assignmentId)
        .order("submitted_at")
    : { data: [] };

  const late = assignment.duedate && new Date(assignment.duedate) < new Date();
  const closed = late && !assignment.allow_late;
  const canSubmit = !manage && !closed && (!submission || submission.status !== "graded");
  const allowFile = assignment.submission_type !== "online";
  const allowText = assignment.submission_type !== "file";

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link
        href={`/course/${assignment.course_id}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {assignment.course.fullname}
      </Link>

      <div className="card mb-5 overflow-hidden">
        <div className="h-1.5" style={{ background: assignment.course.color }} />
        <div className="card-pad">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="badge-brand mb-2">Assignment</span>
              <h1 className="text-2xl font-bold text-ink">{assignment.name}</h1>
              <p className="mt-1 text-[13px] text-ink-3">
                {assignment.course.fullname} · {assignment.course.shortname}
              </p>
            </div>
            {manage && (
              <Link href={`/course/${assignment.course_id}/manage`} className="btn-neutral btn-sm">
                <Icon name="settings" size={14} />
                Manage
              </Link>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Due date", assignment.duedate ? formatDateTime(assignment.duedate, locale) : "—"],
              ["Max grade", String(Number(assignment.grade_max))],
              ["Submission", assignment.submission_type],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-soft px-3.5 py-2.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3">{k}</p>
                <p className="text-[13px] font-semibold capitalize text-ink">{v}</p>
              </div>
            ))}
          </div>

          {assignment.description && (
            <div className="mt-4 whitespace-pre-line border-t border-[var(--color-line-soft)] pt-4 text-[14px] leading-relaxed text-ink-2">
              {assignment.description}
            </div>
          )}
        </div>
      </div>

      {saved && <div className="alert-success mb-4">Tugas berhasil dikumpulkan.</div>}
      {error && (
        <div className="alert-error mb-4">
          {error === "empty"
            ? "Isi teks atau lampirkan berkas sebelum mengumpulkan."
            : error === "late"
              ? "Tenggat sudah lewat dan pengumpulan terlambat tidak diizinkan."
              : decodeURIComponent(error)}
        </div>
      )}

      {!manage && (
        <section className="card mb-5">
          <div className="card-head">
            <h2 className="text-[15px] font-bold text-ink">Your submission</h2>
            {submission ? (
              <span
                className={
                  submission.status === "graded"
                    ? "badge-success"
                    : submission.status === "submitted_late"
                      ? "badge-warn"
                      : "badge-info"
                }
              >
                {submission.status.replace("_", " ")}
              </span>
            ) : (
              <span className="badge-danger">Not submitted</span>
            )}
          </div>

          {submission && (
            <div className="border-b border-[var(--color-line-soft)] px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
                    Submitted
                  </p>
                  <p className="text-[13px] text-ink">
                    {formatDateTime(submission.submitted_at, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Grade</p>
                  <p className="text-[13px] font-semibold text-ink">
                    {submission.grade ?? "—"} / {Number(assignment.grade_max)}
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3">File</p>
                  {submission.file_path ? (
                    <a
                      href={`/api/files/submission/${submission.id}`}
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline"
                    >
                      <Icon name="download" size={14} />
                      {submission.file_name}
                    </a>
                  ) : (
                    <p className="text-[13px] text-ink-3">—</p>
                  )}
                </div>
              </div>

              {submission.online_text && (
                <div className="mt-3 rounded-xl bg-soft p-3 text-[13px] leading-relaxed text-ink-2">
                  {submission.online_text}
                </div>
              )}
              {submission.feedback && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[13px] leading-relaxed text-emerald-900">
                  <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider">
                    Lecturer feedback
                  </p>
                  {submission.feedback}
                </div>
              )}
            </div>
          )}

          <div className="p-5">
            {canSubmit ? (
              <form action={uploadSubmission} className="space-y-4">
                <input type="hidden" name="assignment_id" value={assignmentId} />
                {allowText && (
                  <div className="field">
                    <label className="label">Online text</label>
                    <textarea
                      name="online_text"
                      defaultValue={submission?.online_text ?? ""}
                      className="textarea min-h-[140px]"
                      placeholder="Tulis jawaban Anda di sini…"
                    />
                  </div>
                )}
                {allowFile && (
                  <div className="field">
                    <label className="label">File (max 20 MB)</label>
                    <input
                      type="file"
                      name="file"
                      className="input py-2 text-[13px]"
                      accept=".pdf,.doc,.docx,.zip,.txt,.png,.jpg,.jpeg,.xlsx,.pptx"
                    />
                    <p className="hint">PDF, DOC/DOCX, ZIP, gambar, teks. Berkas lama tetap tersimpan bila tidak diganti.</p>
                  </div>
                )}
                <SubmitButton className="btn-brand" pendingLabel="Mengunggah…">
                  <Icon name="upload" size={15} />
                  {submission ? "Resubmit" : "Submit assignment"}
                </SubmitButton>
              </form>
            ) : (
              <p className="text-[13px] text-ink-3">
                {closed
                  ? "Pengumpulan ditutup karena tenggat telah lewat."
                  : submission?.status === "graded"
                    ? "Tugas sudah dinilai. Hubungi dosen bila perlu revisi."
                    : "Anda tidak dapat mengumpulkan tugas ini."}
              </p>
            )}
          </div>
        </section>
      )}

      {manage && (
        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="text-[15px] font-bold text-ink">Submissions</h2>
            <span className="badge-neutral">{(submissions ?? []).length} submitted</span>
          </div>
          <div className="divide-y divide-[var(--color-line-soft)]">
            {(submissions ?? []).length === 0 && (
              <p className="px-5 py-4 text-sm text-ink-3">No submissions yet.</p>
            )}
            {(submissions ?? []).map((s) => (
              <div key={s.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar
                    name={(s.profile as { full_name?: string } | null)?.full_name}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {(s.profile as { full_name?: string } | null)?.full_name ?? "Student"}
                    </p>
                    <p className="text-[11.5px] text-ink-3">
                      {formatDateTime(s.submitted_at, locale)}
                    </p>
                  </div>
                  {s.file_path && (
                    <a
                      href={`/api/files/submission/${s.id}`}
                      className="btn-neutral btn-xs"
                    >
                      <Icon name="download" size={13} />
                      {s.file_name}
                    </a>
                  )}
                  <span
                    className={
                      s.grade === null
                        ? "badge-warn"
                        : "badge-success"
                    }
                  >
                    {s.grade === null ? "Ungraded" : `${s.grade} / ${Number(assignment.grade_max)}`}
                  </span>
                </div>

                {s.online_text && (
                  <p className="mt-2 rounded-lg bg-soft p-3 text-[12.5px] leading-relaxed text-ink-2">
                    {s.online_text}
                  </p>
                )}

                <form action={gradeSubmission} className="mt-2.5 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="submission_id" value={s.id} />
                  <div className="field w-24">
                    <label className="label text-[11px]">Grade</label>
                    <input
                      type="number"
                      name="grade"
                      step="0.01"
                      min={0}
                      max={Number(assignment.grade_max)}
                      defaultValue={s.grade ?? ""}
                      required
                      className="input px-2 py-1.5 text-[12.5px]"
                    />
                  </div>
                  <div className="field min-w-[200px] flex-1">
                    <label className="label text-[11px]">Feedback</label>
                    <input
                      name="feedback"
                      defaultValue={s.feedback ?? ""}
                      className="input px-2 py-1.5 text-[12.5px]"
                    />
                  </div>
                  <SubmitButton className="btn-brand btn-sm" pendingLabel="…">
                    Save grade
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
