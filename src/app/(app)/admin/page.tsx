import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDate, timeAgo } from "@/lib/utils";
import type { Course, LoginLog } from "@/lib/types";

export const metadata = { title: "Site administration" };

export default async function AdminHome() {
  await requireStaff();

  const [
    { count: userCount },
    { count: courseCount },
    { count: enrolmentCount },
    { count: submissionCount },
    { count: quizCount },
    { data: logins },
    { data: courses },
    { data: roleRows },
  ] = await Promise.all([
    db().from("profiles").select("id", { count: "exact", head: true }),
    db().from("courses").select("id", { count: "exact", head: true }),
    db().from("enrollments").select("id", { count: "exact", head: true }),
    db().from("assignment_submissions").select("id", { count: "exact", head: true }),
    db().from("quiz_attempts").select("id", { count: "exact", head: true }),
    db()
      .from("login_logs")
      .select("*, profile:profiles!login_logs_user_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(8),
    db().from("courses").select("*, teacher:profiles!courses_teacher_id_fkey(full_name)").order("fullname"),
    db().from("profiles").select("role"),
  ]);

  const roles = (roleRows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.role] = (acc[r.role] ?? 0) + 1;
    return acc;
  }, {});

  const list = (courses ?? []) as (Course & { teacher: { full_name: string } | null })[];
  const { data: enrolCounts } = await db().from("enrollments").select("course_id,role");

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Administration</p>
          <h1 className="text-2xl font-bold text-ink">Site administration</h1>
          <p className="text-sm text-ink-3">Platform overview, users, courses and reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/admin/users", label: "Users", icon: "users" as const },
            { href: "/admin/courses", label: "Courses", icon: "book" as const },
            { href: "/admin/announcements", label: "Announcements", icon: "bell" as const },
            { href: "/admin/settings", label: "Settings", icon: "settings" as const },
            { href: "/admin/reports", label: "Reports", icon: "chart" as const },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="btn-neutral btn-sm">
              <Icon name={l.icon} size={14} />
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Users", value: userCount ?? 0 },
          { label: "Courses", value: courseCount ?? 0 },
          { label: "Enrolments", value: enrolmentCount ?? 0 },
          { label: "Submissions", value: submissionCount ?? 0 },
          { label: "Quiz attempts", value: quizCount ?? 0 },
        ].map((k) => (
          <div key={k.label} className="kpi">
            <p className="kpi-value">{k.value}</p>
            <p className="kpi-label">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="card overflow-hidden">
          <div className="card-head">
            <h2 className="text-[14px] font-bold text-ink">Course activity</h2>
            <Link href="/admin/courses" className="text-[12px] font-semibold text-brand hover:underline">
              Manage
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th className="hidden sm:table-cell">Lecturer</th>
                  <th className="text-center">Students</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/course/${c.id}`} className="font-medium text-ink hover:text-brand">
                        {c.fullname}
                      </Link>
                      <p className="text-[11px] text-ink-3">{c.shortname}</p>
                    </td>
                    <td className="hidden text-[12.5px] text-ink-2 sm:table-cell">
                      {c.teacher?.full_name ?? "—"}
                    </td>
                    <td className="text-center text-[12.5px]">
                      {(enrolCounts ?? []).filter(
                        (e) => e.course_id === c.id && e.role === "student"
                      ).length}
                    </td>
                    <td className="text-center">
                      <span className={c.visible ? "badge-success" : "badge-warn"}>
                        {c.visible ? "visible" : "hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-5">
          <section className="card">
            <div className="card-head">
              <h2 className="text-[14px] font-bold text-ink">Users by role</h2>
            </div>
            <div className="space-y-2.5 p-4">
              {Object.entries(roles).map(([role, count]) => {
                const total = Object.values(roles).reduce((a, b) => a + b, 0) || 1;
                return (
                  <div key={role}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="font-medium capitalize text-ink-2">{role}</span>
                      <span className="text-ink-3">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-soft">
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

          <section className="card">
            <div className="card-head">
              <h2 className="text-[14px] font-bold text-ink">Recent logins</h2>
            </div>
            <div className="divide-y divide-[var(--color-line-soft)]">
              {((logins ?? []) as (LoginLog & { profile: { full_name: string } | null })[]).map((l) => (
                <div key={l.id} className="flex items-center gap-2.5 px-4 py-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      l.success ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink">
                      {l.profile?.full_name ?? l.username}
                    </p>
                    <p className="text-[10.5px] text-ink-4">
                      {l.ip} · {timeAgo(l.created_at)}
                    </p>
                  </div>
                  <span className={l.success ? "badge-success" : "badge-danger"}>
                    {l.success ? "ok" : "fail"}
                  </span>
                </div>
              ))}
              {(logins ?? []).length === 0 && (
                <p className="px-4 py-3 text-[12.5px] text-ink-3">No login activity.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <p className="mt-4 text-[11.5px] text-ink-4">
        Data as of {formatDate(new Date(), { locale: "en" })}
      </p>
    </div>
  );
}
