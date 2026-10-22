import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Resource } from "@/lib/types";

export const metadata = { title: "Resource" };

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const { data } = await db()
    .from("resources")
    .select("*, course:courses(id, fullname, shortname, color)")
    .eq("id", Number(id))
    .maybeSingle();
  if (!data) notFound();

  const resource = data as Resource & {
    created_at: string;
    course: { id: number; fullname: string; shortname: string; color: string };
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <Link
        href={`/course/${resource.course_id}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        {resource.course.fullname}
      </Link>

      <div className="card overflow-hidden">
        <div className="h-1.5" style={{ background: resource.course.color }} />
        <div className="card-pad">
          <span className="badge-brand mb-2">Resource · {resource.kind}</span>
          <h1 className="text-2xl font-bold text-ink">{resource.name}</h1>
          {resource.intro && (
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">
              {resource.intro}
            </p>
          )}
          <p className="mt-2 text-[11.5px] text-ink-3">
            {resource.course.fullname} · added {formatDateTime(resource.created_at)}
          </p>

          <div className="mt-5 border-t border-[var(--color-line-soft)] pt-5">
            {resource.kind === "file" && resource.file_path ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-soft p-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand">
                  <Icon name="file" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">
                    {resource.file_name ?? resource.name}
                  </p>
                  <p className="text-[11.5px] text-ink-3">
                    Private storage — the download link is signed and expires in 2 minutes.
                  </p>
                </div>
                <a href={`/api/files/material/${resource.id}`} className="btn-brand btn-sm">
                  <Icon name="download" size={15} />
                  Download
                </a>
              </div>
            ) : resource.kind === "url" ? (
              <a
                href={resource.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="btn-brand"
              >
                <Icon name="external" size={16} />
                Open link
                <span className="max-w-[280px] truncate text-[11px] font-normal opacity-80">
                  {resource.url}
                </span>
              </a>
            ) : (
              <div className="prose-page">
                <div dangerouslySetInnerHTML={{ __html: resource.content ?? "" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
