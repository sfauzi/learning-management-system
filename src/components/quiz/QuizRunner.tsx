"use client";

import { useEffect, useRef, useState } from "react";
import { submitQuiz } from "@/app/actions/learning";
import { Icon } from "@/components/ui/Icon";
import type { Question } from "@/lib/types";

export function QuizRunner({
  attemptId,
  questions,
  endsAt,
  quizName,
  gradeMax,
}: {
  attemptId: number;
  questions: Question[];
  endsAt: string | null;
  quizName: string;
  gradeMax: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!endsAt) return null;
    return Math.max(0, Math.round((new Date(endsAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!submitted.current && formRef.current) {
        submitted.current = true;
        formRef.current.requestSubmit();
      }
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;
  const low = secondsLeft !== null && secondsLeft <= 60;

  return (
    <form ref={formRef} action={submitQuiz} className="space-y-4">
      <input type="hidden" name="attempt_id" value={attemptId} />

      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-white px-4 py-2.5 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink">{quizName}</p>
          <p className="text-[11.5px] text-ink-3">
            {questions.length} questions · max {Number(gradeMax)}
          </p>
        </div>
        {secondsLeft !== null && (
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold ${
              low ? "bg-red-50 text-red-700" : "bg-brand-soft text-brand"
            }`}
          >
            <Icon name="clock" size={15} />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        )}
        <button type="submit" className="btn-brand btn-sm" disabled={submitted.current}>
          Submit quiz
        </button>
      </div>

      {questions.map((q, index) => (
        <section key={q.id} className="card card-pad">
          <div className="mb-3 flex items-start gap-2.5">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-line text-[14px] font-medium leading-relaxed text-ink">
                {q.question}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-3">
                {q.type === "multichoice"
                  ? "Choose one answer"
                  : q.type === "truefalse"
                    ? "True or false"
                    : q.type === "shortanswer"
                      ? "Short answer"
                      : "Essay"}{" "}
                · {Number(q.points)} point(s)
              </p>
            </div>
          </div>

          {q.type === "essay" ? (
            <textarea
              name={`q_${q.id}`}
              className="textarea min-h-[130px]"
              placeholder="Tulis jawaban esai Anda…"
            />
          ) : q.type === "shortanswer" ? (
            <input
              name={`q_${q.id}`}
              className="input"
              placeholder="Jawaban singkat"
              autoComplete="off"
            />
          ) : (
            <div className="space-y-1.5">
              {(q.options ?? []).map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-[13.5px] text-ink-2 transition hover:border-brand/40 hover:bg-brand-soft/40"
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={o.id}
                    className="h-4 w-4 accent-[#a12520]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="flex justify-end">
        <button type="submit" className="btn-brand" disabled={submitted.current}>
          <Icon name="check" size={16} />
          Submit quiz
        </button>
      </div>
    </form>
  );
}
