import type { Profile, Role } from "@/lib/types";

/** Client-safe role helpers (no next/headers import). */

export const isStaff = (u: Pick<Profile, "role"> | null | undefined) =>
  !!u && (u.role === "admin" || u.role === "manager");

export const isTeacherLike = (u: Pick<Profile, "role"> | null | undefined) =>
  !!u && (u.role === "teacher" || u.role === "admin" || u.role === "manager");

export const isStudent = (u: Pick<Profile, "role"> | null | undefined) =>
  !!u && u.role === "student";

export function roleLabel(role: Role | string): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "manager":
      return "Manager";
    case "teacher":
      return "Lecturer";
    default:
      return "Student";
  }
}
