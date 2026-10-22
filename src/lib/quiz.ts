import type { Option, Question, Quiz } from "@/lib/types";

export type QuizStatus = "upcoming" | "open" | "closed";

export function quizStatus(quiz: Pick<Quiz, "open_at" | "close_at">, now = new Date()): QuizStatus {
  if (quiz.open_at && new Date(quiz.open_at) > now) return "upcoming";
  if (quiz.close_at && new Date(quiz.close_at) < now) return "closed";
  return "open";
}

export function statusHint(quiz: Pick<Quiz, "open_at" | "close_at">, locale = "id") {
  const status = quizStatus(quiz);
  if (status === "upcoming") {
    const d = quiz.open_at ? new Date(quiz.open_at) : null;
    return locale === "id"
      ? `Dibuka ${d ? d.toLocaleString("id-ID") : "-"}`
      : `Opens ${d ? d.toLocaleString("en-GB") : "-"}`;
  }
  if (status === "closed") {
    const d = quiz.close_at ? new Date(quiz.close_at) : null;
    return locale === "id"
      ? `Ditutup ${d ? d.toLocaleString("id-ID") : "-"}`
      : `Closed ${d ? d.toLocaleString("en-GB") : "-"}`;
  }
  return locale === "id" ? "Sedang dibuka" : "Open now";
}

export type ReviewEntry = {
  given: string | null;
  correct: number | null;
  right: boolean | null;
  type: string;
};

export type GradedAttempt = {
  score: number | null;
  needsGrading: boolean;
  review: Record<string, ReviewEntry>;
};

/**
 * Auto-grades a quiz attempt.
 * multichoice / truefalse compare the chosen option id, shortanswer compares a
 * normalised label against the accepted answers, essay always needs a human.
 */
export function gradeAttempt(
  questions: Question[],
  answers: Record<string, string | undefined>,
  gradeMax: number
): GradedAttempt {
  let earned = 0;
  let total = 0;
  let needsGrading = false;
  const review: Record<string, ReviewEntry> = {};

  for (const q of questions) {
    const points = Number(q.points);
    total += points;
    const given = answers[String(q.id)] ?? null;

    if (q.type === "essay") {
      needsGrading = true;
      review[String(q.id)] = { given, correct: null, right: null, type: "essay" };
      continue;
    }

    if (q.type === "shortanswer") {
      const accepted = (q.options ?? []).map((o) => o.label.trim().toLowerCase());
      const normalised = (given ?? "").trim().toLowerCase();
      const right = normalised !== "" && accepted.includes(normalised);
      if (right) earned += points;
      review[String(q.id)] = { given, correct: null, right, type: "shortanswer" };
      continue;
    }

    const correct = (q.options ?? []).find((o) => o.is_correct) ?? null;
    const right = !!correct && String(given) === String(correct.id);
    if (right) earned += points;
    review[String(q.id)] = {
      given,
      correct: correct?.id ?? null,
      right,
      type: q.type,
    };
  }

  const score = total > 0 ? Number(((earned / total) * Number(gradeMax)).toFixed(2)) : 0;
  return { score: needsGrading ? null : score, needsGrading, review };
}

export function bestScore(attempts: { score: number | null; state: string }[]) {
  const finished = attempts.filter((a) => a.state === "finished" && a.score !== null);
  if (!finished.length) return null;
  return Math.max(...finished.map((a) => Number(a.score)));
}

export function isCorrectOption(options: Option[] | undefined, questionId: number) {
  return options?.find((o) => o.question_id === questionId && o.is_correct) ?? null;
}
