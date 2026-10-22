import Link from "next/link";
import { enrolCourse } from "@/app/actions/courses";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { db } from "@/lib/supabase/admin";
import { getLocale } from "@/lib/i18n";
import { courseInitials } from "@/lib/utils";
import type { Category, Course } from "@/lib/types";

export const metadata = { title: "Course catalogue" };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; error?: string }>;
}) {
  const { q = "", category, error } = await searchParams;
  const user = await requireUser();
  const locale = await getLocale();
  const categories = await getCategories();

  let query = db()
    .from("courses")
    .select(
      "*, teacher:profiles!courses_teacher_id_fkey(id,full_name), category:course_categories(id,name)"
    )
    .eq("visible", true)
    .order("fullname");

  if (q) query = query.or(`fullname.ilike.%${q}%,shortname.ilike.%${q}%`);
  if (category) query = query.eq("category_id", Number(category));

  const [{ data: courses }, { data: enrolments }] = await Promise.all([
    query,
    db().from("enrollments").select("course_id").eq("user_id", user.id),
  ]);

  const enrolled = new Set((enrolments ?? []).map((e) => e.course_id as number));
  const list = (courses ?? []) as (Course & { category: Category | null })[];

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">
          {locale === "id" ? "Katalog mata kuliah" : "Course catalogue"}
        </h1>
        <p className="text-sm text-ink-3">
          {locale === "id"
            ? "Jelajahi dan ikuti mata kuliah yang tersedia."
            : "Browse the catalogue and enrol in the courses you need."}
        </p>
      </div>

      {error && (
        <div className="alert-error mb-4">
          {error === "enrol_key"
            ? locale === "id"
              ? "Enrolment key salah."
              : "Wrong enrolment key."
            : locale === "id"
              ? "Mata kuliah ini tidak membuka pendaftaran mandiri."
              : "This course does not allow self-enrolment."}
        </div>
      )}

      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="field min-w-[220px] flex-1">
          <label className="label" htmlFor="q">
            {locale === "id" ? "Cari mata kuliah" : "Search courses"}
          </label>
          <input id="q" name="q" defaultValue={q} className="input" placeholder="e.g. Pemrograman" />
        </div>
        <div className="field w-full sm:w-60">
          <label className="label" htmlFor="category">
            {locale === "id" ? "Fakultas" : "Faculty"}
          </label>
          <select id="category" name="category" defaultValue={category ?? ""} className="select">
            <option value="">{locale === "id" ? "Semua fakultas" : "All faculties"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-brand" type="submit">
          <Icon name="search" size={15} />
          {locale === "id" ? "Cari" : "Search"}
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href="/course"
          className={`badge ${!category ? "bg-brand text-white" : "bg-soft text-ink-2"}`}
        >
          {locale === "id" ? "Semua" : "All"} ({list.length})
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/course?category=${c.id}`}
            className={`badge ${
              String(category) === String(c.id) ? "bg-brand text-white" : "bg-soft text-ink-2"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card card-pad text-sm text-ink-2">
          {locale === "id" ? "Tidak ada mata kuliah ditemukan." : "No courses found."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((course) => (
            <article key={course.id} className="card flex flex-col overflow-hidden">
              <div className="h-1.5" style={{ background: course.color }} />
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start gap-3">
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                    style={{ background: course.color }}
                  >
                    {courseInitials(course.fullname)}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/course/${course.id}`}
                      className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink hover:text-brand"
                    >
                      {course.fullname}
                    </Link>
                    <p className="truncate text-[11.5px] text-ink-3">
                      {course.teacher?.full_name ?? "—"}
                    </p>
                  </div>
                </div>

                <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">
                  {course.summary}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="badge-neutral">{course.shortname}</span>
                  <span className="badge-neutral">{course.credits} SKS</span>
                  {course.category && <span className="badge-neutral">{course.category.name}</span>}
                </div>

                <div className="mt-auto pt-4">
                  {enrolled.has(course.id) ? (
                    <Link href={`/course/${course.id}`} className="btn-neutral w-full">
                      <Icon name="checkCircle" size={15} />
                      {locale === "id" ? "Buka mata kuliah" : "Open course"}
                    </Link>
                  ) : course.self_enrol ? (
                    <form action={enrolCourse} className="flex gap-1.5">
                      <input type="hidden" name="course_id" value={course.id} />
                      <input type="hidden" name="back" value="/course" />
                      {course.enrol_key && (
                        <input
                          name="enrol_key"
                          placeholder="Enrolment key"
                          required
                          className="input px-2.5 py-2 text-[12.5px]"
                        />
                      )}
                      <SubmitButton className="btn-brand btn-sm shrink-0" pendingLabel="…">
                        {locale === "id" ? "Ikuti" : "Enrol"}
                      </SubmitButton>
                    </form>
                  ) : (
                    <p className="rounded-lg bg-soft px-3 py-2 text-[11.5px] text-ink-3">
                      {locale === "id"
                        ? "Pendaftaran hanya melalui dosen/admin."
                        : "Enrolment is managed by the lecturer."}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
