import Link from "next/link";
import { notFound } from "next/navigation";
import { startQuiz } from "@/app/actions/learning";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { canManageCourse, requireUser } from "@/lib/auth";
import { bestScore, quizStatus, statusHint } from "@/lib/quiz";
import { db } from "@/lib/supabase/admin";
import { getLocale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import type { Attempt, Quiz } from "@/lib/types";

export const metadata = { title: "Quiz" };

const ERROR_TEXT: Record<string, string> = {
  upcoming: "Kuis belum dibuka.",
  closed: "Kuis sudah ditutup.",
  noquestions: "Kuis ini belum memiliki soal. Hubungi dosen pengampu.",
  attempts: "Kesempatan mengerjakan sudah habis.",
};

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const quizId = Number(id);
  const user = await requireUser();
  const locale = await getLocale();

  const { data } = await db()
    .from("quizzes")
    .select("*, course:courses(id, fullname, shortname, color)")
    .eq("id", quizId)
    .maybeSingle();
  if (!data) notFound();
  const quiz = data as Quiz & { course: { id: number; fullname: string; shortname: string; color: string } };

  const manage = await canManageCourse(user, quiz.course_id);

  const [{ data: attempts }, { count: questionCount }] = await Promise.all([
    db()
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .order("attempt_no"),
    db()
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId),
  ]);

  const myAttempts = (attempts ?? []) as Attempt[];
  const inProgress = myAttempts.find((a) => a.state === "inprogress");
  const finished = myAttempts.filter((a) => a.state === "finished");
  const best = bestScore(myAttempts);
  const status = quizStatus(quiz);
  const remaining = quiz.max_attempts - myAttempts.length;

  return (
    <div className="mx-auto max-w-[960px]">
      <Link
        href={`/course/${quiz.course_id}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {quiz.course.fullname}
      </Link>

      <div className="card mb-5 overflow-hidden">
        <div className="h-1.5" style={{ background: quiz.course.color }} />
        <div className="card-pad">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="badge-brand mb-2">Quiz</span>
              <h1 className="text-2xl font-bold text-ink">{quiz.name}</h1>
              <p className="mt-1 text-[13px] text-ink-3">
                {quiz.course.fullname} · {quiz.course.shortname}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={
                  status === "open"
                    ? "badge-success"
                    : status === "upcoming"
                      ? "badge-warn"
                      : "badge-danger"
                }
              >
                {status === "open" ? "Open" : status === "upcoming" ? "Upcoming" : "Closed"}
              </span>
              {manage && (
                <Link href={`/mod/quiz/${quizId}/build`} className="btn-neutral btn-sm">
                  <Icon name="list" size={14} />
                  Question bank
                </Link>
              )}
            </div>
          </div>

          {quiz.intro && (
            <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">
              {quiz.intro}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ["Opens", quiz.open_at ? formatDateTime(quiz.open_at, locale) : "—"],
              ["Closes", quiz.close_at ? formatDateTime(quiz.close_at, locale) : "—"],
              ["Time limit", quiz.time_limit ? `${quiz.time_limit} min` : "None"],
              ["Attempts", `${myAttempts.length} / ${quiz.max_attempts}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-soft px-3.5 py-2.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3">{k}</p>
                <p className="text-[12.5px] font-semibold text-ink">{v}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[12px] text-ink-3">
            {questionCount ?? 0} questions · max grade {Number(quiz.grade_max)} ·{" "}
            {statusHint(quiz, locale)}
          </p>

          {error && <div className="alert-error mt-4">{ERROR_TEXT[error] ?? "Tidak dapat memulai kuis."}</div>}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-soft)] pt-4">
            {inProgress ? (
              <Link href={`/mod/quiz/attempt/${inProgress.id}`} className="btn-brand">
                <Icon name="play" size={15} />
                Continue attempt
              </Link>
            ) : remaining > 0 && status === "open" && !manage ? (
              <form action={startQuiz}>
                <input type="hidden" name="quiz_id" value={quizId} />
                <SubmitButton className="btn-brand" pendingLabel="Menyiapkan…">
                  <Icon name="play" size={15} />
                  Start attempt
                </SubmitButton>
              </form>
            ) : null}

            {best !== null && (
              <span className="badge-success">
                Best score: {best} / {Number(quiz.grade_max)}
              </span>
            )}
            {manage && (
              <span className="text-[12px] text-ink-3">
                Lecturers preview the quiz through the question bank.
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="card-head">
          <h2 className="text-[15px] font-bold text-ink">Your attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Started</th>
                <th>Finished</th>
                <th className="text-center">Score</th>
                <th className="text-center">State</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {myAttempts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-ink-3">
                    No attempts yet.
                  </td>
                </tr>
              )}
              {myAttempts.map((a) => (
                <tr key={a.id}>
                  <td className="font-semibold">{a.attempt_no}</td>
                  <td className="text-[12.5px] text-ink-2">
                    {formatDateTime(a.started_at, locale)}
                  </td>
                  <td className="text-[12.5px] text-ink-2">
                    {a.finished_at ? formatDateTime(a.finished_at, locale) : "—"}
                  </td>
                  <td className="text-center font-semibold">
                    {a.score !== null ? Number(a.score) : "—"}
                  </td>
                  <td className="text-center">
                    <span
                      className={
                        a.needs_grading
                          ? "badge-warn"
                          : a.state === "finished"
                            ? "badge-success"
                            : "badge-info"
                      }
                    >
                      {a.needs_grading ? "needs grading" : a.state}
                    </span>
                  </td>
                  <td className="text-right">
                    {a.state === "finished" ? (
                      <Link href={`/mod/quiz/attempt/${a.id}/review`} className="btn-neutral btn-xs">
                        Review
                      </Link>
                    ) : (
                      <Link href={`/mod/quiz/attempt/${a.id}`} className="btn-brand btn-xs">
                        Continue
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {finished.length > 0 && (
          <p className="border-t border-[var(--color-line-soft)] px-5 py-3 text-[11.5px] text-ink-3">
            The best score of {finished.length} finished attempt(s) is mirrored into the gradebook.
          </p>
        )}
      </section>
    </div>
  );
}
