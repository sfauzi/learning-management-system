import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { canManageCourse, requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Attempt, Question, Quiz } from "@/lib/types";

export const metadata = { title: "Quiz review" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attemptId = Number(id);
  const user = await requireUser();

  const { data: attemptData } = await db()
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attemptData) notFound();
  const attempt = attemptData as Attempt;

  const { data: quizData } = await db()
    .from("quizzes")
    .select("*")
    .eq("id", attempt.quiz_id)
    .maybeSingle();
  if (!quizData) notFound();
  const quiz = quizData as Quiz;

  const manage = await canManageCourse(user, quiz.course_id);
  if (attempt.user_id !== user.id && !manage) {
    return <div className="card card-pad text-sm text-ink-2">Anda tidak dapat melihat attempt ini.</div>;
  }

  const { data: questions } = await db()
    .from("quiz_questions")
    .select("*, options:quiz_options(*)")
    .eq("quiz_id", quiz.id)
    .order("sortorder");

  const review = attempt.answers?.review ?? {};
  const raw = attempt.answers?.raw ?? {};
  const list = (questions ?? []) as Question[];

  const correctCount = Object.values(review).filter((r) => r.right === true).length;
  const autoGraded = list.filter((q) => q.type !== "essay").length;

  return (
    <div className="mx-auto max-w-[900px]">
      <Link
        href={`/mod/quiz/${quiz.id}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {quiz.name}
      </Link>

      <div className="card card-pad mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="badge-brand mb-2">Attempt {attempt.attempt_no}</span>
            <h1 className="text-xl font-bold text-ink">{quiz.name}</h1>
            <p className="mt-1 text-[12.5px] text-ink-3">
              Submitted {formatDateTime(attempt.finished_at)} ·{" "}
              {correctCount}/{autoGraded} auto-graded questions correct
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3">Score</p>
            <p className="text-3xl font-bold text-ink">
              {attempt.score !== null ? Number(attempt.score) : "—"}
              <span className="text-base font-medium text-ink-3"> / {Number(quiz.grade_max)}</span>
            </p>
            {attempt.needs_grading && (
              <span className="badge-warn mt-1">Menunggu penilaian dosen</span>
            )}
          </div>
        </div>

        {attempt.grading_note && (
          <div className="mt-3 rounded-xl bg-soft p-3 text-[13px] text-ink-2">
            <span className="font-semibold text-ink">Catatan penilai: </span>
            {attempt.grading_note}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {list.map((q, index) => {
          const entry = review[String(q.id)];
          const given = entry?.given ?? raw[String(q.id)] ?? null;
          const correctOption = (q.options ?? []).find((o) => o.is_correct) ?? null;
          const givenOption = (q.options ?? []).find((o) => String(o.id) === String(given)) ?? null;
          const right = entry?.right;

          return (
            <section key={q.id} className="card card-pad">
              <div className="flex items-start gap-2.5">
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                    q.type === "essay"
                      ? "bg-ink-3"
                      : right
                        ? "bg-emerald-600"
                        : "bg-red-600"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line text-[14px] font-medium leading-relaxed text-ink">
                    {q.question}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-3">
                    {q.type} · {Number(q.points)} point(s)
                  </p>
                </div>
                {q.type === "essay" ? (
                  <span className="badge-neutral">Essay</span>
                ) : (
                  <span className={right ? "badge-success" : "badge-danger"}>
                    {right ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5 pl-9">
                {q.type === "essay" ? (
                  <div className="rounded-lg bg-soft p-3 text-[13px] leading-relaxed text-ink-2">
                    <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
                      Your answer
                    </p>
                    {given || "—"}
                  </div>
                ) : q.type === "shortanswer" ? (
                  <>
                    <p className="text-[13px] text-ink-2">
                      <span className="font-semibold text-ink">Your answer: </span>
                      {given || "—"}
                    </p>
                    <p className="text-[13px] text-ink-2">
                      <span className="font-semibold text-ink">Accepted: </span>
                      {(q.options ?? []).map((o) => o.label).join(", ") || "—"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] text-ink-2">
                      <span className="font-semibold text-ink">Your answer: </span>
                      {givenOption?.label ?? "—"}
                    </p>
                    <p className="text-[13px] text-emerald-700">
                      <span className="font-semibold">Correct answer: </span>
                      {correctOption?.label ?? "—"}
                    </p>
                  </>
                )}

                {q.explanation && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-[12.5px] leading-relaxed text-sky-900">
                    <span className="font-semibold">Pembahasan: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-5 flex gap-2">
        <Link href={`/mod/quiz/${quiz.id}`} className="btn-neutral btn-sm">
          Back to quiz
        </Link>
        {manage && (
          <Link href={`/mod/quiz/${quiz.id}/build`} className="btn-outline btn-sm">
            Question bank
          </Link>
        )}
      </div>
    </div>
  );
}
