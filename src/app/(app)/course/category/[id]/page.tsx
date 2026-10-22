import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { CourseCard } from "@/components/course/CourseCard";
import { requireUser } from "@/lib/auth";
import { courseCards } from "@/lib/data";
import { db } from "@/lib/supabase/admin";
import type { Category } from "@/lib/types";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const { data: category } = await db()
    .from("course_categories")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();

  if (!category) notFound();
  const cat = category as Category;

  const cards = await courseCards(user);
  const list = cards.filter((c) => c.category_id === cat.id);

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/course"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Course catalogue
      </Link>

      <div className="card card-pad mb-5">
        <h1 className="text-xl font-bold text-ink">{cat.name}</h1>
        <p className="mt-1 text-sm text-ink-2">{cat.description ?? "Program studi."}</p>
        <p className="mt-2 text-[12px] text-ink-3">
          {list.length} courses in this category
        </p>
      </div>

      {list.length === 0 ? (
        <div className="card card-pad text-sm text-ink-2">
          You are not enrolled in any course in this category.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
