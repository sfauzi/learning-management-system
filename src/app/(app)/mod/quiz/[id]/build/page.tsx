import Link from "next/link";
import { notFound } from "next/navigation";
import {
  gradeQuizAttempt,
  questionDestroy,
  questionDuplicate,
  questionMove,
  questionStore,
  questionUpdate,
} from "@/app/actions/learning";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { canManageCourse, requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Attempt, Question, Quiz } from "@/lib/types";

export const metadata = { title: "Question bank" };

export default async function QuizBuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quizId = Number(id);
  const user = await requireUser();

  const { data } = await db()
    .from("quizzes")
    .select("*, course:courses(id, fullname, shortname)")
    .eq("id", quizId)
    .maybeSingle();
  if (!data) notFound();
  const quiz = data as Quiz & { course: { id: number; fullname: string } };

  if (!(await canManageCourse(user, quiz.course_id))) {
    return <div className="card card-pad text-sm text-ink-2">Anda tidak dapat mengelola kuis ini.</div>;
  }

  const [{ data: questions }, { data: attempts }] = await Promise.all([
    db()
      .from("quiz_questions")
      .select("*, options:quiz_options(*)")
      .eq("quiz_id", quizId)
      .order("sortorder"),
    db()
      .from("quiz_attempts")
      .select("*, profile:profiles!quiz_attempts_user_id_fkey(full_name, username)")
      .eq("quiz_id", quizId)
      .eq("state", "finished")
      .order("finished_at", { ascending: false }),
  ]);

  const list = (questions ?? []) as Question[];
  const pending = ((attempts ?? []) as (Attempt & { profile?: { full_name: string } })[]).filter(
    (a) => a.needs_grading
  );
  const totalPoints = list.reduce((s, q) => s + Number(q.points), 0);

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link
        href={`/mod/quiz/${quizId}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {quiz.name}
      </Link>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Question bank</p>
          <h1 className="text-2xl font-bold text-ink">{quiz.name}</h1>
          <p className="text-sm text-ink-3">
            {list.length} questions · {totalPoints} total points · {quiz.course.fullname}
          </p>
        </div>
        <Link href={`/mod/quiz/${quizId}`} className="btn-neutral btn-sm">
          <Icon name="eye" size={15} />
          Quiz page
        </Link>
      </div>

      {pending.length > 0 && (
        <section className="card mb-5 overflow-hidden border-amber-200">
          <div className="card-head bg-amber-50">
            <h2 className="text-[14px] font-bold text-amber-900">
              Attempts waiting for manual grading ({pending.length})
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-line-soft)]">
            {pending.map((a) => (
              <div key={a.id} className="flex flex-wrap items-end gap-3 px-4 py-3">
                <div className="min-w-[160px] flex-1">
                  <p className="text-[13px] font-semibold text-ink">
                    {a.profile?.full_name ?? "Student"} · attempt {a.attempt_no}
                  </p>
                  <p className="text-[11px] text-ink-3">
                    {a.finished_at ? formatDateTime(a.finished_at) : "—"} ·{" "}
                    <Link
                      href={`/mod/quiz/attempt/${a.id}/review`}
                      className="font-semibold text-brand hover:underline"
                    >
                      view answers
                    </Link>
                  </p>
                </div>
                <form action={gradeQuizAttempt} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="attempt_id" value={a.id} />
                  <div className="field w-24">
                    <label className="label text-[11px]">Score</label>
                    <input
                      type="number"
                      name="score"
                      min={0}
                      max={Number(quiz.grade_max)}
                      step="0.01"
                      required
                      className="input px-2 py-1.5 text-[12.5px]"
                    />
                  </div>
                  <div className="field min-w-[180px]">
                    <label className="label text-[11px]">Note</label>
                    <input name="grading_note" className="input px-2 py-1.5 text-[12.5px]" />
                  </div>
                  <SubmitButton className="btn-brand btn-sm" pendingLabel="…">
                    Save
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {list.length === 0 && (
          <div className="card card-pad text-sm text-ink-2">
            Belum ada soal. Tambahkan soal pertama di bawah.
          </div>
        )}

        {list.map((q, index) => (
          <section key={q.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-start gap-3 p-4">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line text-[14px] font-medium leading-relaxed text-ink">
                  {q.question}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="badge-neutral capitalize">{q.type}</span>
                  <span className="badge-neutral">{Number(q.points)} pt</span>
                  {q.type === "multichoice" || q.type === "truefalse" ? (
                    <span className="badge-success">
                      {(q.options ?? []).find((o) => o.is_correct)?.label ?? "no answer key"}
                    </span>
                  ) : null}
                </div>

                {(q.options ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {(q.options ?? [])
                      .slice()
                      .sort((a, b) => a.sortorder - b.sortorder)
                      .map((o) => (
                        <li
                          key={o.id}
                          className={`flex items-center gap-1.5 text-[12.5px] ${
                            o.is_correct ? "font-semibold text-emerald-700" : "text-ink-2"
                          }`}
                        >
                          {o.is_correct ? (
                            <Icon name="check" size={13} />
                          ) : (
                            <span className="inline-block h-1 w-1 rounded-full bg-ink-4" />
                          )}
                          {o.label}
                        </li>
                      ))}
                  </ul>
                )}

                {q.explanation && (
                  <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-[12px] text-sky-900">
                    <span className="font-semibold">Pembahasan: </span>
                    {q.explanation}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <form action={questionMove}>
                  <input type="hidden" name="quiz_id" value={quizId} />
                  <input type="hidden" name="question_id" value={q.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton className="btn-ghost btn-xs" pendingLabel="…">↑</SubmitButton>
                </form>
                <form action={questionMove}>
                  <input type="hidden" name="quiz_id" value={quizId} />
                  <input type="hidden" name="question_id" value={q.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton className="btn-ghost btn-xs" pendingLabel="…">↓</SubmitButton>
                </form>
                <form action={questionDuplicate}>
                  <input type="hidden" name="quiz_id" value={quizId} />
                  <input type="hidden" name="question_id" value={q.id} />
                  <SubmitButton className="btn-neutral btn-xs" pendingLabel="…">
                    Duplicate
                  </SubmitButton>
                </form>
                <form action={questionDestroy}>
                  <input type="hidden" name="quiz_id" value={quizId} />
                  <input type="hidden" name="question_id" value={q.id} />
                  <SubmitButton
                    className="btn-danger btn-xs"
                    confirm="Hapus soal ini?"
                    pendingLabel="…"
                  >
                    <Icon name="trash" size={12} />
                  </SubmitButton>
                </form>
              </div>
            </div>

            <details className="border-t border-[var(--color-line-soft)]">
              <summary className="cursor-pointer px-4 py-2 text-[12px] font-semibold text-brand">
                Edit question
              </summary>
              <QuestionForm
                action={questionUpdate}
                quizId={quizId}
                question={q}
                submitLabel="Update question"
              />
            </details>
          </section>
        ))}
      </div>

      <details className="card mt-5 overflow-hidden" open={list.length === 0}>
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[14px] font-bold text-ink">
          <Icon name="plus" size={15} className="text-brand" />
          Add question
        </summary>
        <QuestionForm action={questionStore} quizId={quizId} submitLabel="Add question" />
      </details>
    </div>
  );
}

function QuestionForm({
  action,
  quizId,
  question,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  quizId: number;
  question?: Question;
  submitLabel: string;
}) {
  const correct = (question?.options ?? []).find((o) => o.is_correct);
  const optionIndex = (question?.options ?? []).findIndex((o) => o.is_correct);
  const accepted = (question?.options ?? []).map((o) => o.label).join("\n");

  return (
    <form
      action={action}
      className="grid gap-3 border-t border-[var(--color-line-soft)] bg-soft/50 p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="quiz_id" value={quizId} />
      {question && <input type="hidden" name="question_id" value={question.id} />}

      <div className="field sm:col-span-2">
        <label className="label">Question</label>
        <textarea
          name="question"
          required
          defaultValue={question?.question ?? ""}
          className="textarea min-h-[80px]"
        />
      </div>

      <div className="field">
        <label className="label">Type</label>
        <select name="type" defaultValue={question?.type ?? "multichoice"} className="select">
          <option value="multichoice">Multiple choice</option>
          <option value="truefalse">True / False</option>
          <option value="shortanswer">Short answer</option>
          <option value="essay">Essay</option>
        </select>
      </div>

      <div className="field">
        <label className="label">Points</label>
        <input
          type="number"
          name="points"
          step="0.01"
          min="0.01"
          defaultValue={question?.points ?? 1}
          className="input"
        />
      </div>

      <div className="field sm:col-span-2">
        <label className="label">Options (multiple choice — leave blank to ignore)</label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <input
              key={i}
              name={`option_${i}`}
              defaultValue={question?.options?.[i]?.label ?? ""}
              placeholder={`Option ${i + 1}`}
              className="input py-1.5 text-[12.5px]"
            />
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label">Correct option</label>
        <select
          name="correct"
          defaultValue={optionIndex >= 0 ? String(optionIndex) : "0"}
          className="select"
        >
          <option value="0">Option 1</option>
          <option value="1">Option 2</option>
          <option value="2">Option 3</option>
          <option value="3">Option 4</option>
          <option value="4">Option 5</option>
          <option value="5">Option 6</option>
          <option value="6">Option 7</option>
          <option value="7">Option 8</option>
        </select>
        <p className="hint">
          True/False uses option 1 = Benar, option 2 = Salah.
          {correct ? ` Current: ${correct.label}` : ""}
        </p>
      </div>

      <div className="field">
        <label className="label">Accepted answers (short answer, one per line)</label>
        <textarea
          name="accepted"
          defaultValue={accepted}
          className="textarea min-h-[70px] text-[12.5px]"
          placeholder={"Model View Controller\nMVC"}
        />
      </div>

      <div className="field sm:col-span-2">
        <label className="label">Explanation (shown on review)</label>
        <textarea
          name="explanation"
          defaultValue={question?.explanation ?? ""}
          className="textarea min-h-[60px]"
        />
      </div>

      <div className="sm:col-span-2">
        <SubmitButton className="btn-brand btn-sm" pendingLabel="Menyimpan…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
