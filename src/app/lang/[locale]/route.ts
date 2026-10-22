import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE } from "@/lib/i18n";
import { safePath } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const next = safePath(request.nextUrl.searchParams.get("next"), "/");
  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(LANG_COOKIE, locale === "id" ? "id" : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
