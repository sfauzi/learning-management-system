import { NextResponse, type NextRequest } from "next/server";
import { canManageCourse, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";

/** Signed, permission-checked download for an assignment submission. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { data: submission } = await db()
    .from("assignment_submissions")
    .select("id, user_id, file_path, file_name, assignment:assignments(course_id)")
    .eq("id", Number(id))
    .maybeSingle();

  if (!submission?.file_path) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const courseId = (submission.assignment as { course_id?: number } | null)?.course_id;
  const manage = courseId ? await canManageCourse(user, courseId) : false;

  if (submission.user_id !== user.id && !manage) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: signed, error } = await db()
    .storage.from("submissions")
    .createSignedUrl(submission.file_path, 120, {
      download: submission.file_name ?? undefined,
    });

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "storage" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
