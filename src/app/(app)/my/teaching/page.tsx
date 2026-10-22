import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { isStaff, requireUser } from "@/lib/auth";
import { getTeachingCourses } from "@/lib/data";
import { courseInitials } from "@/lib/utils";

export const metadata = { title: "My teaching" };

export default async function TeachingPage() {
  const user = await requireUser();
  if (user.role !== "teacher" && !isStaff(user)) {
    return (
      <div className="card card-pad text-sm text-ink-2">
        Halaman ini hanya untuk dosen.
      </div>
    );
  }

  const rows = await getTeachingCourses(user.id);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">My teaching</h1>
          <p className="text-sm text-ink-3">
            Courses where you are the assigned lecturer — open one to manage its content.
          </p>
        </div>
        <Link href="/admin/courses" className="btn-outline btn-sm">
          <Icon name="plus" size={15} />
          {isStaff(user) ? "Create course" : "Request a course"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card card-pad text-sm text-ink-2">
          You are not assigned to any course yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th className="hidden sm:table-cell">Category</th>
                <th>Students</th>
                <th className="hidden sm:table-cell">Activities</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ course, studentCount, moduleCount }) => (
                <tr key={course.id} className="hover:bg-soft/60">
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                        style={{ background: course.color }}
                      >
                        {courseInitials(course.fullname)}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{course.fullname}</p>
                        <p className="text-[11.5px] text-ink-3">{course.shortname}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden text-[13px] text-ink-2 sm:table-cell">
                    {course.category?.name ?? "—"}
                  </td>
                  <td className="text-[13px] text-ink-2">{studentCount}</td>
                  <td className="hidden text-[13px] text-ink-2 sm:table-cell">{moduleCount}</td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/course/${course.id}`} className="btn-neutral btn-xs">
                        View
                      </Link>
                      <Link href={`/course/${course.id}/manage`} className="btn-brand btn-xs">
                        Manage content
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
