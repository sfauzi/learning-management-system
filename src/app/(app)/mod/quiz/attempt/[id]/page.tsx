import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import type { Attempt, Question, Quiz } from "@/lib/types";

export const metadata = { title: "Quiz attempt" };

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attemptId = Number(id);
  const user = await requireUser();

  const { data: attempt } = await db()
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) notFound();
  if ((attempt as Attempt).user_id !== user.id) {
    return (
      <div className="card card-pad text-sm text-ink-2">Attempt ini milik pengguna lain.</div>
    );
  }
  if ((attempt as Attempt).state === "finished") {
    redirect(`/mod/quiz/attempt/${attemptId}/review`);
  }

  const { data: quiz } = await db()
    .from("quizzes")
    .select("*, course:courses(id, fullname, shortname)")
    .eq("id", attempt.quiz_id)
    .maybeSingle();
  if (!quiz) notFound();

  const { data: questions } = await db()
    .from("quiz_questions")
    .select("*, options:quiz_options(*)")
    .eq("quiz_id", attempt.quiz_id)
    .order("sortorder");

  // the answer key never reaches the browser during an attempt
  const safeQuestions = ((questions ?? []) as Question[]).map((q) => ({
    ...q,
    options: (q.options ?? [])
      .map((o) => ({
        id: o.id,
        question_id: o.question_id,
        label: o.label,
        is_correct: false,
        sortorder: o.sortorder,
      }))
      .sort((a, b) => a.sortorder - b.sortorder),
  }));

  const started = attempt.started_at ? new Date(attempt.started_at) : new Date();
  const endsAt = quiz.time_limit
    ? new Date(started.getTime() + quiz.time_limit * 60_000).toISOString()
    : null;

  return (
    <div className="mx-auto max-w-[820px]">
      <Link
        href={`/mod/quiz/${quiz.id}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {quiz.name}
      </Link>

      <QuizRunner
        attemptId={attemptId}
        questions={safeQuestions}
        endsAt={endsAt}
        quizName={(quiz as Quiz).name}
        gradeMax={Number((quiz as Quiz).grade_max)}
      />
    </div>
  );
}
