import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { CourseCardData } from "@/lib/data";
import { courseInitials } from "@/lib/utils";

export function CourseCard({
  course,
  showProgress = true,
  href,
}: {
  course: CourseCardData;
  showProgress?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href ?? `/course/${course.id}`}
      className="card group flex flex-col overflow-hidden transition hover:shadow-md"
    >
      <div className="h-1.5 w-full" style={{ background: course.color }} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start gap-3">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
            style={{ background: course.color }}
          >
            {courseInitials(course.fullname)}
          </span>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-ink group-hover:text-brand">
              {course.fullname}
            </h3>
            <p className="mt-0.5 truncate text-[12px] text-ink-3">
              {course.teacher?.full_name ?? "—"}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">
          {course.summary ?? ""}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="badge-neutral">{course.shortname}</span>
          {course.category?.name && (
            <span className="badge-neutral">{course.category.name}</span>
          )}
          <span className="badge-neutral">{course.credits} SKS</span>
          {course.enrolled && <span className="badge-success">Enrolled</span>}
        </div>

        {showProgress && (
          <div className="mt-auto pt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-3">
              <span>
                {course.completedCount}/{course.moduleCount} activities
              </span>
              <span>{course.progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${course.progress}%`, background: course.color }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-3">
          <span className="inline-flex items-center gap-1">
            <Icon name="users" size={13} />
            {course.studentCount} students
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand">
            Open
            <Icon name="chevronRight" size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
