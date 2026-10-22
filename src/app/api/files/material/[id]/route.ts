import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, canManageCourse } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";

/** Signed, permission-checked download for course materials. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { data: resource } = await db()
    .from("resources")
    .select("id, course_id, file_path, file_name")
    .eq("id", Number(id))
    .maybeSingle();

  if (!resource?.file_path) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const manage = await canManageCourse(user, resource.course_id);
  const { data: enrolment } = await db()
    .from("enrollments")
    .select("id")
    .eq("course_id", resource.course_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!manage && !enrolment) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: signed, error } = await db()
    .storage.from("materials")
    .createSignedUrl(resource.file_path, 120, {
      download: resource.file_name ?? undefined,
    });

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "storage" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
