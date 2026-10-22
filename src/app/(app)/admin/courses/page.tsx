import Link from "next/link";
import { courseDestroy, courseStore } from "@/app/actions/admin";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import type { Category, Course, Profile } from "@/lib/types";

export const metadata = { title: "Courses" };

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  await requireStaff();

  const [{ data: courses }, { data: categories }, { data: teachers }, { data: enrolments }] =
    await Promise.all([
      db()
        .from("courses")
        .select("*, teacher:profiles!courses_teacher_id_fkey(full_name), category:course_categories(name)")
        .order("fullname"),
      db().from("course_categories").select("*").order("sortorder"),
      db().from("profiles").select("id, full_name, role").in("role", ["teacher", "admin", "manager"]).order("full_name"),
      db().from("enrollments").select("course_id,role"),
    ]);

  const list = (courses ?? []) as (Course & {
    teacher: { full_name: string } | null;
    category: { name: string } | null;
  })[];

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Site administration
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Courses</h1>
        <p className="text-sm text-ink-3">{list.length} courses across {((categories ?? []) as Category[]).length} faculties</p>
      </div>

      {saved && <div className="alert-success mb-4">Perubahan tersimpan.</div>}
      {error && (
        <div className="alert-error mb-4">
          {error === "required" ? "Nama lengkap dan short name wajib diisi." : decodeURIComponent(error)}
        </div>
      )}

      <details className="card mb-5 overflow-hidden">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[14px] font-bold text-ink">
          <Icon name="plus" size={15} className="text-brand" />
          Create course
        </summary>
        <form action={courseStore} className="grid gap-3 border-t border-[var(--color-line-soft)] p-4 sm:grid-cols-3">
          <div className="field sm:col-span-2">
            <label className="label">Full name</label>
            <input name="fullname" required className="input" placeholder="Pemrograman Web Lanjut" />
          </div>
          <div className="field">
            <label className="label">Short name</label>
            <input name="shortname" required className="input" placeholder="PW-LANJUT" />
          </div>
          <div className="field sm:col-span-3">
            <label className="label">Summary</label>
            <textarea name="summary" className="textarea min-h-[70px]" />
          </div>
          <div className="field">
            <label className="label">Faculty</label>
            <select name="category_id" className="select">
              <option value="">—</option>
              {((categories ?? []) as Category[]).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Lecturer</label>
            <select name="teacher_id" className="select">
              <option value="">—</option>
              {((teachers ?? []) as Pick<Profile, "id" | "full_name">[]).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Credits (SKS)</label>
            <input name="credits" type="number" defaultValue={3} min={1} max={8} className="input" />
          </div>
          <div className="field">
            <label className="label">Semester</label>
            <input name="semester" type="number" defaultValue={5} min={1} max={14} className="input" />
          </div>
          <div className="field">
            <label className="label">Academic year</label>
            <input name="academic_year" defaultValue="2026/2027" className="input" />
          </div>
          <div className="field">
            <label className="label">Enrolment key</label>
            <input name="enrol_key" className="input" placeholder="optional" />
          </div>
          <div className="field">
            <label className="label">Colour</label>
            <input type="color" name="color" defaultValue="#a12520" className="input h-10 p-1" />
          </div>
          <label className="flex items-end gap-2 pb-2 text-[13px] text-ink-2">
            <input type="checkbox" name="self_enrol" className="h-4 w-4 accent-[#a12520]" />
            Allow self-enrolment
          </label>
          <div className="flex items-end sm:col-span-3">
            <SubmitButton className="btn-brand" pendingLabel="Membuat…">
              Create course
            </SubmitButton>
          </div>
        </form>
      </details>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th className="hidden sm:table-cell">Faculty</th>
                <th className="hidden sm:table-cell">Lecturer</th>
                <th className="text-center">Students</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/course/${c.id}`} className="font-medium text-ink hover:text-brand">
                      {c.fullname}
                    </Link>
                    <p className="text-[11px] text-ink-3">
                      {c.shortname} · {c.credits} SKS
                    </p>
                  </td>
                  <td className="hidden text-[12.5px] text-ink-2 sm:table-cell">
                    {c.category?.name ?? "—"}
                  </td>
                  <td className="hidden text-[12.5px] text-ink-2 sm:table-cell">
                    {c.teacher?.full_name ?? "—"}
                  </td>
                  <td className="text-center text-[12.5px]">
                    {(enrolments ?? []).filter((e) => e.course_id === c.id && e.role === "student").length}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/course/${c.id}/manage`} className="btn-neutral btn-xs">
                        Manage
                      </Link>
                      <form action={courseDestroy}>
                        <input type="hidden" name="course_id" value={c.id} />
                        <SubmitButton
                          className="btn-danger btn-xs"
                          confirm={`Hapus mata kuliah ${c.fullname} beserta seluruh aktivitasnya?`}
                          pendingLabel="…"
                        >
                          <Icon name="trash" size={12} />
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
