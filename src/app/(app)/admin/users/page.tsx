import Link from "next/link";
import { userDestroy, userStore, userUpdate } from "@/app/actions/admin";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireStaff, roleLabel } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; role?: string }>;
}) {
  const { saved, error, role } = await searchParams;
  await requireStaff();

  let query = db().from("profiles").select("*").order("role").order("full_name");
  if (role) query = query.eq("role", role);
  const { data } = await query;
  const users = (data ?? []) as Profile[];

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Site administration
      </Link>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Users</h1>
          <p className="text-sm text-ink-3">{users.length} accounts</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["", "student", "teacher", "admin", "manager"].map((r) => (
            <Link
              key={r || "all"}
              href={r ? `/admin/users?role=${r}` : "/admin/users"}
              className={`badge ${role === r || (!role && !r) ? "bg-brand text-white" : "bg-soft text-ink-2"}`}
            >
              {r ? roleLabel(r) : "All"}
            </Link>
          ))}
        </div>
      </div>

      {saved && <div className="alert-success mb-4">Perubahan tersimpan.</div>}
      {error && (
        <div className="alert-error mb-4">
          {error === "email"
            ? "E-mail wajib diisi."
            : error === "self"
              ? "Anda tidak dapat menghapus akun sendiri."
              : decodeURIComponent(error)}
        </div>
      )}

      <details className="card mb-5 overflow-hidden">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[14px] font-bold text-ink">
          <Icon name="plus" size={15} className="text-brand" />
          Create user
        </summary>
        <form action={userStore} className="grid gap-3 border-t border-[var(--color-line-soft)] p-4 sm:grid-cols-3">
          <div className="field">
            <label className="label">Full name</label>
            <input name="full_name" required className="input" />
          </div>
          <div className="field">
            <label className="label">E-mail</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div className="field">
            <label className="label">Username</label>
            <input name="username" className="input" placeholder="auto from e-mail" />
          </div>
          <div className="field">
            <label className="label">Role</label>
            <select name="role" className="select">
              <option value="student">Student</option>
              <option value="teacher">Lecturer</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="field">
            <label className="label">ID number</label>
            <input name="idnumber" className="input" />
          </div>
          <div className="field">
            <label className="label">Study programme</label>
            <input name="study_program" className="input" />
          </div>
          <div className="field">
            <label className="label">Initial password</label>
            <input name="password" defaultValue="password" className="input" />
          </div>
          <div className="flex items-end">
            <SubmitButton className="btn-brand" pendingLabel="Membuat…">
              Create user
            </SubmitButton>
          </div>
        </form>
      </details>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th className="hidden sm:table-cell">ID number</th>
                <th className="hidden sm:table-cell">Programme</th>
                <th className="hidden md:table-cell">Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.suspended ? "opacity-60" : ""}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.full_name} size={32} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{u.full_name}</p>
                        <p className="truncate text-[11px] text-ink-3">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-neutral">{roleLabel(u.role)}</span>
                    {u.suspended && <span className="badge-danger ml-1">suspended</span>}
                  </td>
                  <td className="hidden text-[12.5px] text-ink-2 sm:table-cell">{u.idnumber ?? "—"}</td>
                  <td className="hidden text-[12.5px] text-ink-2 sm:table-cell">
                    {u.study_program ?? "—"}
                  </td>
                  <td className="hidden text-[12px] text-ink-3 md:table-cell">
                    {formatDate(u.created_at, { locale: "en" })}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <details className="relative">
                        <summary className="btn-neutral btn-xs cursor-pointer">Edit</summary>
                        <form
                          action={userUpdate}
                          className="absolute right-0 z-30 mt-1 grid w-64 gap-2 rounded-xl border border-[var(--color-line)] bg-white p-3 shadow-lg"
                        >
                          <input type="hidden" name="user_id" value={u.id} />
                          <div className="field">
                            <label className="label text-[11px]">Full name</label>
                            <input name="full_name" defaultValue={u.full_name} className="input px-2 py-1.5 text-[12px]" />
                          </div>
                          <div className="field">
                            <label className="label text-[11px]">Username</label>
                            <input name="username" defaultValue={u.username ?? ""} className="input px-2 py-1.5 text-[12px]" />
                          </div>
                          <div className="field">
                            <label className="label text-[11px]">Role</label>
                            <select name="role" defaultValue={u.role} className="select px-2 py-1.5 text-[12px]">
                              <option value="student">Student</option>
                              <option value="teacher">Lecturer</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </div>
                          <div className="field">
                            <label className="label text-[11px]">Programme</label>
                            <input name="study_program" defaultValue={u.study_program ?? ""} className="input px-2 py-1.5 text-[12px]" />
                          </div>
                          <label className="flex items-center gap-2 text-[12px] text-ink-2">
                            <input type="checkbox" name="suspended" defaultChecked={u.suspended} className="h-4 w-4 accent-[#a12520]" />
                            Suspended
                          </label>
                          <SubmitButton className="btn-brand btn-xs" pendingLabel="…">
                            Save
                          </SubmitButton>
                        </form>
                      </details>

                      <form action={userDestroy}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <SubmitButton
                          className="btn-danger btn-xs"
                          confirm={`Hapus akun ${u.full_name}? Tindakan ini permanen.`}
                          pendingLabel="…"
                        >
                          <Icon name="trash" size={12} />
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
