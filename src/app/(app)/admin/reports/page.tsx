import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { days, formatDate } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  await requireStaff();

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [
    { data: profiles },
    { data: courses },
    { data: enrolments },
    { data: submissions },
    { data: attempts },
    { data: logins },
  ] = await Promise.all([
    db().from("profiles").select("role, suspended"),
    db().from("courses").select("id, fullname, shortname, visible, teacher_id"),
    db().from("enrollments").select("course_id, role"),
    db().from("assignment_submissions").select("id, grade, submitted_at"),
    db().from("quiz_attempts").select("id, score, state, needs_grading"),
    db().from("login_logs").select("created_at, success").gte("created_at", since.toISOString()),
  ]);

  const roles = (profiles ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1;
    return acc;
  }, {});
  const suspended = (profiles ?? []).filter((p) => p.suspended).length;

  const graded = (submissions ?? []).filter((s) => s.grade !== null);
  const avgSubmission = graded.length
    ? Number((graded.reduce((sum, s) => sum + Number(s.grade), 0) / graded.length).toFixed(1))
    : 0;

  const quizScores = (attempts ?? []).filter((a) => a.score !== null);
  const avgQuiz = quizScores.length
    ? Number((quizScores.reduce((sum, a) => sum + Number(a.score), 0) / quizScores.length).toFixed(1))
    : 0;
  const pendingEssays = (attempts ?? []).filter((a) => a.needs_grading).length;

  const loginByDay = new Map<string, { ok: number; fail: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    loginByDay.set(d.toDateString(), { ok: 0, fail: 0 });
  }
  for (const l of logins ?? []) {
    const key = new Date(l.created_at).toDateString();
    const row = loginByDay.get(key);
    if (!row) continue;
    if (l.success) row.ok += 1;
    else row.fail += 1;
  }
  const maxLogins = Math.max(1, ...[...loginByDay.values()].map((v) => v.ok + v.fail));

  const courseStats = (courses ?? []).map((c) => ({
    ...c,
    students: (enrolments ?? []).filter((e) => e.course_id === c.id && e.role === "student").length,
  }));

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Site administration
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Reports</h1>
        <p className="text-sm text-ink-3">Platform statistics and activity over the last 7 days.</p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total users", value: (profiles ?? []).length, hint: `${suspended} suspended` },
          { label: "Enrolments", value: (enrolments ?? []).length, hint: `${courseStats.length} courses` },
          { label: "Avg assignment grade", value: avgSubmission, hint: `${graded.length} graded` },
          { label: "Avg quiz score", value: avgQuiz, hint: `${pendingEssays} awaiting grading` },
        ].map((k) => (
          <div key={k.label} className="kpi">
            <p className="kpi-value">{k.value}</p>
            <p className="kpi-label">{k.label}</p>
            <p className="mt-0.5 text-[11px] text-ink-4">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <div className="card-head">
            <h2 className="text-[14px] font-bold text-ink">Logins per day</h2>
          </div>
          <div className="p-5">
            <div className="flex h-40 items-end gap-2">
              {[...loginByDay.entries()].map(([day, counts]) => {
                const total = counts.ok + counts.fail;
                const height = Math.max(4, (total / maxLogins) * 100);
                return (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-ink-3">{total}</span>
                    <div className="flex w-full flex-col justify-end" style={{ height: "100%" }}>
                      <div
                        className="w-full rounded-t bg-brand"
                        style={{ height: `${height}%` }}
                        title={`${counts.ok} success · ${counts.fail} failed`}
                      />
                    </div>
                    <span className="text-[10px] text-ink-4">
                      {days("en")[new Date(day).getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11.5px] text-ink-3">
              Since {formatDate(since, { locale: "en" })} ·{" "}
              {(logins ?? []).filter((l) => !l.success).length} failed attempts
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="text-[14px] font-bold text-ink">Users by role</h2>
          </div>
          <div className="space-y-3 p-5">
            {Object.entries(roles).map(([role, count]) => {
              const total = Object.values(roles).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={role}>
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span className="font-medium capitalize text-ink-2">{role}</span>
                    <span className="text-ink-3">
                      {count} ({Math.round((count / total) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="card mt-5 overflow-hidden">
        <div className="card-head">
          <h2 className="text-[14px] font-bold text-ink">Course enrolment</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th className="text-center">Students</th>
                <th className="text-center">Visible</th>
              </tr>
            </thead>
            <tbody>
              {courseStats.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/course/${c.id}`} className="font-medium text-ink hover:text-brand">
                      {c.fullname}
                    </Link>
                    <p className="text-[11px] text-ink-3">{c.shortname}</p>
                  </td>
                  <td className="text-center">{c.students}</td>
                  <td className="text-center">
                    <span className={c.visible ? "badge-success" : "badge-warn"}>
                      {c.visible ? "yes" : "no"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
