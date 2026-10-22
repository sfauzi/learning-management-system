import Link from "next/link";
import { notFound } from "next/navigation";
import { participantDestroy } from "@/app/actions/courses";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { getCourseContent, getParticipants } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Participants" };

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  const user = await requireUser();

  const content = await getCourseContent(courseId);
  if (!content) notFound();
  const manage =
    user.role === "admin" || user.role === "manager" || content.course.teacher_id === user.id;

  const participants = await getParticipants(courseId);
  const teachers = participants.filter((p) => p.role !== "student");
  const students = participants.filter((p) => p.role === "student");

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link
        href={`/course/${courseId}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {content.course.fullname}
      </Link>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Participants</h1>
          <p className="text-sm text-ink-3">
            {students.length} students · {teachers.length} teaching staff
          </p>
        </div>
        {manage && (
          <Link href={`/course/${courseId}/manage#participants`} className="btn-outline btn-sm">
            <Icon name="users" size={15} />
            Manage participants
          </Link>
        )}
      </div>

      <div className="space-y-5">
        {[
          { title: "Teaching staff", list: teachers, tone: "badge-info" },
          { title: "Students", list: students, tone: "badge-neutral" },
        ].map((group) => (
          <section key={group.title} className="card overflow-hidden">
            <div className="card-head">
              <h2 className="text-[14px] font-bold text-ink">{group.title}</h2>
              <span className="badge-neutral">{group.list.length}</span>
            </div>
            <div className="divide-y divide-[var(--color-line-soft)]">
              {group.list.length === 0 && (
                <p className="px-4 py-3 text-sm text-ink-3">Nobody in this group yet.</p>
              )}
              {group.list.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={p.profile?.full_name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">
                      {p.profile?.full_name}
                    </p>
                    <p className="truncate text-[11.5px] text-ink-3">
                      {p.profile?.email} · {p.profile?.study_program ?? "—"}
                    </p>
                  </div>
                  <span className={`${group.tone} hidden sm:inline-flex`}>
                    {p.role === "student" ? "Student" : "Lecturer"}
                  </span>
                  <span className="hidden w-24 text-right text-[11px] text-ink-4 sm:block">
                    {formatDate(p.timestart, { locale: "en", withYear: false })}
                  </span>
                  {manage && p.role === "student" && (
                    <form action={participantDestroy}>
                      <input type="hidden" name="course_id" value={courseId} />
                      <input type="hidden" name="user_id" value={p.profile.id} />
                      <SubmitButton
                        className="btn-danger btn-xs"
                        confirm={`Keluarkan ${p.profile.full_name} dari mata kuliah?`}
                        pendingLabel="…"
                      >
                        Remove
                      </SubmitButton>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
