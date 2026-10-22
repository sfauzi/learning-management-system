import Link from "next/link";
import { CourseCard } from "@/components/course/CourseCard";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth";
import { courseCards, getCategories } from "@/lib/data";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "My courses" };

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category } = await searchParams;
  const user = await requireUser();
  const locale = await getLocale();
  const [cards, categories] = await Promise.all([courseCards(user), getCategories()]);

  const filtered = cards.filter((c) => {
    const matchQ =
      !q ||
      c.fullname.toLowerCase().includes(q.toLowerCase()) ||
      c.shortname.toLowerCase().includes(q.toLowerCase());
    const matchCat = !category || String(c.category_id) === category;
    return matchQ && matchCat;
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {locale === "id" ? "Mata kuliah saya" : "My courses"}
          </h1>
          <p className="text-sm text-ink-3">
            {locale === "id"
              ? `${cards.length} mata kuliah terdaftar.`
              : `${cards.length} enrolled courses.`}
          </p>
        </div>
        <Link href="/course" className="btn-outline btn-sm">
          <Icon name="grid" size={15} />
          {locale === "id" ? "Katalog mata kuliah" : "Course catalogue"}
        </Link>
      </div>

      <form className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="field min-w-[220px] flex-1">
          <label className="label" htmlFor="q">
            {locale === "id" ? "Cari" : "Search"}
          </label>
          <input id="q" name="q" defaultValue={q} className="input" placeholder="Nama atau kode mata kuliah" />
        </div>
        <div className="field w-full sm:w-56">
          <label className="label" htmlFor="category">
            {locale === "id" ? "Fakultas" : "Faculty"}
          </label>
          <select id="category" name="category" defaultValue={category ?? ""} className="select">
            <option value="">{locale === "id" ? "Semua" : "All"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-brand">
          <Icon name="search" size={15} />
          {locale === "id" ? "Terapkan" : "Apply"}
        </button>
        {(q || category) && (
          <Link href="/my/courses" className="btn-ghost btn-sm">
            Reset
          </Link>
        )}
      </form>

      {filtered.length === 0 ? (
        <div className="card card-pad text-sm text-ink-2">
          {locale === "id" ? "Tidak ada mata kuliah yang cocok." : "No courses match your filter."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
