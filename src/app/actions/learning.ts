"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageCourse, requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { gradeAttempt, quizStatus } from "@/lib/quiz";
import { notify } from "@/lib/data";
import { formNumber } from "@/lib/utils";
import type { Question } from "@/lib/types";

function str(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

/* ------------------------------------------------------------- assignments */

export async function gradeSubmission(formData: FormData) {
  const user = await requireUser();
  const submissionId = formNumber(formData.get("submission_id"));
  const grade = formNumber(formData.get("grade"));

  const { data: submission } = await db()
    .from("assignment_submissions")
    .select("*, assignment:assignments(*)")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) return;

  const assignment = submission.assignment as {
    id: number;
    course_id: number;
    name: string;
    grade_max: number;
  };

  if (!(await canManageCourse(user, assignment.course_id))) return;

  const clamped = Math.min(Math.max(grade, 0), Number(assignment.grade_max));

  await db()
    .from("assignment_submissions")
    .update({
      grade: clamped,
      feedback: str(formData.get("feedback")) || null,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
      status: "graded",
    })
    .eq("id", submissionId);

  const { data: existingItem } = await db()
    .from("grade_items")
    .select("id")
    .eq("course_id", assignment.course_id)
    .eq("item_type", "assign")
    .eq("item_id", assignment.id)
    .maybeSingle();

  let itemId = existingItem?.id;
  if (!itemId) {
    const { data: created } = await db()
      .from("grade_items")
      .insert({
        course_id: assignment.course_id,
        item_type: "assign",
        item_id: assignment.id,
        name: assignment.name,
        max_grade: assignment.grade_max,
        weight: 1,
        sortorder: 99,
      })
      .select("id")
      .single();
    itemId = created?.id;
  }

  if (itemId) {
    await db()
      .from("grade_grades")
      .upsert(
        {
          grade_item_id: itemId,
          user_id: submission.user_id,
          grade: clamped,
          feedback: str(formData.get("feedback")) || null,
          graded_by: user.id,
        },
        { onConflict: "grade_item_id,user_id" }
      );
  }

  await notify(
    submission.user_id,
    "Tugas dinilai",
    `${assignment.name}: nilai ${clamped}`,
    `/mod/assign/${assignment.id}`
  );

  revalidatePath(`/mod/assign/${assignment.id}`);
}

/* ------------------------------------------------------------------- quiz */

export async function startQuiz(formData: FormData) {
  const user = await requireUser();
  const quizId = formNumber(formData.get("quiz_id"));

  const { data: quiz } = await db().from("quizzes").select("*").eq("id", quizId).maybeSingle();
  if (!quiz) redirect("/my");

  const status = quizStatus(quiz);
  if (status === "upcoming") redirect(`/mod/quiz/${quizId}?error=upcoming`);
  if (status === "closed") redirect(`/mod/quiz/${quizId}?error=closed`);

  const { count: questionCount } = await db()
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId);
  if (!questionCount) redirect(`/mod/quiz/${quizId}?error=noquestions`);

  const { count: attemptCount } = await db()
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId)
    .eq("user_id", user.id);

  if ((attemptCount ?? 0) >= quiz.max_attempts) {
    redirect(`/mod/quiz/${quizId}?error=attempts`);
  }

  const { data: attempt } = await db()
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      attempt_no: (attemptCount ?? 0) + 1,
      started_at: new Date().toISOString(),
      state: "inprogress",
    })
    .select("id")
    .single();

  redirect(`/mod/quiz/attempt/${attempt?.id}`);
}

export async function submitQuiz(formData: FormData) {
  const user = await requireUser();
  const attemptId = formNumber(formData.get("attempt_id"));

  const { data: attempt } = await db()
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!attempt) redirect("/my");
  if (attempt.state === "finished") redirect(`/mod/quiz/attempt/${attemptId}/review`);

  const { data: quiz } = await db()
    .from("quizzes")
    .select("*")
    .eq("id", attempt.quiz_id)
    .maybeSingle();
  if (!quiz) redirect("/my");

  const { data: questions } = await db()
    .from("quiz_questions")
    .select("*, options:quiz_options(*)")
    .eq("quiz_id", quiz.id)
    .order("sortorder");

  const answers: Record<string, string> = {};
  for (const q of (questions ?? []) as Question[]) {
    const value = formData.get(`q_${q.id}`);
    if (value !== null) answers[String(q.id)] = String(value);
  }

  const graded = gradeAttempt((questions ?? []) as Question[], answers, Number(quiz.grade_max));

  await db()
    .from("quiz_attempts")
    .update({
      answers: { raw: answers, review: graded.review },
      score: graded.score,
      finished_at: new Date().toISOString(),
      state: "finished",
      needs_grading: graded.needsGrading,
    })
    .eq("id", attemptId);

  if (!graded.needsGrading) {
    await mirrorQuizGrade(quiz, user.id, graded.score ?? 0, user.id);
  }

  revalidatePath(`/mod/quiz/${quiz.id}`);
  redirect(`/mod/quiz/attempt/${attemptId}/review`);
}

async function mirrorQuizGrade(
  quiz: { id: number; course_id: number; name: string; grade_max: number },
  userId: string,
  score: number,
  gradedBy: string
) {
  const { data: existingItem } = await db()
    .from("grade_items")
    .select("id")
    .eq("course_id", quiz.course_id)
    .eq("item_type", "quiz")
    .eq("item_id", quiz.id)
    .maybeSingle();

  let itemId = existingItem?.id;
  if (!itemId) {
    const { data: created } = await db()
      .from("grade_items")
      .insert({
        course_id: quiz.course_id,
        item_type: "quiz",
        item_id: quiz.id,
        name: quiz.name,
        max_grade: quiz.grade_max,
        weight: 1,
        sortorder: 98,
      })
      .select("id")
      .single();
    itemId = created?.id;
  }
  if (!itemId) return;

  const { data: attempts } = await db()
    .from("quiz_attempts")
    .select("score")
    .eq("quiz_id", quiz.id)
    .eq("user_id", userId)
    .eq("state", "finished")
    .not("score", "is", null);

  const best = Math.max(score, ...(attempts ?? []).map((a) => Number(a.score)));

  await db()
    .from("grade_grades")
    .upsert(
      { grade_item_id: itemId, user_id: userId, grade: best, graded_by: gradedBy },
      { onConflict: "grade_item_id,user_id" }
    );
}

/** Lecturer grades an attempt that contains essay answers. */
export async function gradeQuizAttempt(formData: FormData) {
  const user = await requireUser();
  const attemptId = formNumber(formData.get("attempt_id"));

  const { data: attempt } = await db()
    .from("quiz_attempts")
    .select("*, quiz:quizzes(*)")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) return;

  const quiz = attempt.quiz as {
    id: number;
    course_id: number;
    name: string;
    grade_max: number;
  };
  if (!(await canManageCourse(user, quiz.course_id))) return;

  const score = Math.min(Math.max(formNumber(formData.get("score")), 0), Number(quiz.grade_max));

  await db()
    .from("quiz_attempts")
    .update({
      score,
      needs_grading: false,
      grading_note: str(formData.get("grading_note")) || null,
      state: "finished",
    })
    .eq("id", attemptId);

  await mirrorQuizGrade(quiz, attempt.user_id, score, user.id);

  await notify(
    attempt.user_id,
    "Kuis dinilai",
    `${quiz.name}: nilai ${score}`,
    `/mod/quiz/attempt/${attemptId}/review`
  );

  revalidatePath(`/mod/quiz/${quiz.id}/build`);
}

/* ----------------------------------------------------------- quiz builder */

async function guardQuiz(quizId: number) {
  const user = await requireUser();
  const { data: quiz } = await db()
    .from("quizzes")
    .select("id, course_id")
    .eq("id", quizId)
    .maybeSingle();
  if (!quiz) redirect("/my");
  const ok = await canManageCourse(user, quiz.course_id);
  if (!ok) redirect(`/course/${quiz.course_id}`);
  return { user, quiz };
}

async function replaceOptions(
  questionId: number,
  type: string,
  formData: FormData
) {
  await db().from("quiz_options").delete().eq("question_id", questionId);

  if (type === "multichoice" || type === "truefalse") {
    const labels =
      type === "truefalse"
        ? ["Benar", "Salah"]
        : [0, 1, 2, 3, 4, 5, 6, 7].map((i) => str(formData.get(`option_${i}`)));
    const correct = formNumber(formData.get("correct"), -1);

    const rows = labels
      .map((label, i) => ({ label: label.trim(), i }))
      .filter((row) => row.label !== "")
      .map((row, index) => ({
        question_id: questionId,
        label: row.label,
        is_correct: row.i === correct,
        sortorder: index + 1,
      }));

    if (rows.length >= 2) await db().from("quiz_options").insert(rows);
    return;
  }

  if (type === "shortanswer") {
    const accepted = str(formData.get("accepted"))
      .split(/[\r\n|]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (accepted.length) {
      await db()
        .from("quiz_options")
        .insert(
          accepted.map((label, i) => ({
            question_id: questionId,
            label,
            is_correct: true,
            sortorder: i + 1,
          }))
        );
    }
  }
}

export async function questionStore(formData: FormData) {
  const quizId = formNumber(formData.get("quiz_id"));
  await guardQuiz(quizId);

  const type = str(formData.get("type")) || "multichoice";

  const { data: last } = await db()
    .from("quiz_questions")
    .select("sortorder")
    .eq("quiz_id", quizId)
    .order("sortorder", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: question } = await db()
    .from("quiz_questions")
    .insert({
      quiz_id: quizId,
      question: str(formData.get("question")) || "New question",
      explanation: str(formData.get("explanation")) || null,
      type,
      points: formNumber(formData.get("points"), 1),
      sortorder: (last?.sortorder ?? 0) + 1,
    })
    .select("id")
    .single();

  if (question) await replaceOptions(question.id, type, formData);

  revalidatePath(`/mod/quiz/${quizId}/build`);
}

export async function questionUpdate(formData: FormData) {
  const quizId = formNumber(formData.get("quiz_id"));
  await guardQuiz(quizId);
  const id = formNumber(formData.get("question_id"));
  const type = str(formData.get("type")) || "multichoice";

  await db()
    .from("quiz_questions")
    .update({
      question: str(formData.get("question")) || "Question",
      explanation: str(formData.get("explanation")) || null,
      type,
      points: formNumber(formData.get("points"), 1),
    })
    .eq("id", id)
    .eq("quiz_id", quizId);

  await replaceOptions(id, type, formData);

  revalidatePath(`/mod/quiz/${quizId}/build`);
}

export async function questionDestroy(formData: FormData) {
  const quizId = formNumber(formData.get("quiz_id"));
  await guardQuiz(quizId);
  await db()
    .from("quiz_questions")
    .delete()
    .eq("id", formNumber(formData.get("question_id")))
    .eq("quiz_id", quizId);
  revalidatePath(`/mod/quiz/${quizId}/build`);
}

export async function questionDuplicate(formData: FormData) {
  const quizId = formNumber(formData.get("quiz_id"));
  await guardQuiz(quizId);
  const id = formNumber(formData.get("question_id"));

  const { data: original } = await db()
    .from("quiz_questions")
    .select("*, options:quiz_options(*)")
    .eq("id", id)
    .maybeSingle();
  if (!original) return;

  const { data: copy } = await db()
    .from("quiz_questions")
    .insert({
      quiz_id: quizId,
      question: `${original.question} (copy)`,
      explanation: original.explanation,
      type: original.type,
      points: original.points,
      sortorder: (original.sortorder ?? 0) + 1,
    })
    .select("id")
    .single();

  if (copy && original.options?.length) {
    await db().from("quiz_options").insert(
      original.options.map((o: { label: string; is_correct: boolean; sortorder: number }) => ({
        question_id: copy.id,
        label: o.label,
        is_correct: o.is_correct,
        sortorder: o.sortorder,
      }))
    );
  }

  revalidatePath(`/mod/quiz/${quizId}/build`);
}

export async function questionMove(formData: FormData) {
  const quizId = formNumber(formData.get("quiz_id"));
  await guardQuiz(quizId);
  const id = formNumber(formData.get("question_id"));
  const dir = str(formData.get("direction")) === "up" ? -1 : 1;

  const { data: list } = await db()
    .from("quiz_questions")
    .select("id, sortorder")
    .eq("quiz_id", quizId)
    .order("sortorder", { ascending: true });

  const rows = list ?? [];
  const index = rows.findIndex((r) => r.id === id);
  const target = rows[index + dir];
  if (!target) return;

  await db().from("quiz_questions").update({ sortorder: target.sortorder }).eq("id", id);
  await db().from("quiz_questions").update({ sortorder: rows[index].sortorder }).eq("id", target.id);

  revalidatePath(`/mod/quiz/${quizId}/build`);
}

/* ------------------------------------------------------------------ forum */

export async function discussionStore(formData: FormData) {
  const user = await requireUser();
  const forumId = formNumber(formData.get("forum_id"));
  const name = str(formData.get("name"));
  const message = str(formData.get("message"));
  if (!name || !message) redirect(`/mod/forum/${forumId}?error=empty`);

  const { data: discussion } = await db()
    .from("forum_discussions")
    .insert({
      forum_id: forumId,
      user_id: user.id,
      name,
      message,
      post_count: 0,
      last_post_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  redirect(`/mod/forum/discuss/${discussion?.id}`);
}

export async function postStore(formData: FormData) {
  const user = await requireUser();
  const discussionId = formNumber(formData.get("discussion_id"));
  const message = str(formData.get("message"));
  if (!message) redirect(`/mod/forum/discuss/${discussionId}?error=empty`);

  await db().from("forum_posts").insert({
    discussion_id: discussionId,
    user_id: user.id,
    message,
  });

  const { data: discussion } = await db()
    .from("forum_discussions")
    .select("post_count, user_id, name")
    .eq("id", discussionId)
    .maybeSingle();

  await db()
    .from("forum_discussions")
    .update({
      post_count: (discussion?.post_count ?? 0) + 1,
      last_post_at: new Date().toISOString(),
    })
    .eq("id", discussionId);

  if (discussion && discussion.user_id !== user.id) {
    await notify(
      discussion.user_id,
      "Balasan baru di forum",
      `${user.full_name} membalas "${discussion.name}"`,
      `/mod/forum/discuss/${discussionId}`
    );
  }

  revalidatePath(`/mod/forum/discuss/${discussionId}`);
}

/* --------------------------------------------------------------- calendar */

export async function eventStore(formData: FormData) {
  const user = await requireUser();
  const name = str(formData.get("name"));
  const startAt = str(formData.get("start_at"));
  if (!name || !startAt) redirect("/calendar?error=empty");

  await db().from("calendar_events").insert({
    user_id: user.id,
    course_id: formNumber(formData.get("course_id")) || null,
    name,
    description: str(formData.get("description")) || null,
    start_at: new Date(startAt).toISOString(),
    end_at: str(formData.get("end_at")) ? new Date(str(formData.get("end_at"))).toISOString() : null,
    type: str(formData.get("type")) || "event",
    color: str(formData.get("color")) || "#a12520",
  });

  revalidatePath("/calendar");
  revalidatePath("/my");
}

export async function eventDestroy(formData: FormData) {
  const user = await requireUser();
  const id = formNumber(formData.get("event_id"));

  const { data: event } = await db()
    .from("calendar_events")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (event && event.user_id === user.id) {
    await db().from("calendar_events").delete().eq("id", id);
  }

  revalidatePath("/calendar");
  revalidatePath("/my");
}