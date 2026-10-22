import { passwordUpdate, profileUpdate } from "@/app/actions/profile";
import { uploadAvatar } from "@/app/actions/files";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser, roleLabel } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Profile" };

const ERRORS: Record<string, string> = {
  file: "Pilih berkas gambar terlebih dahulu.",
  type: "Avatar harus berupa berkas gambar.",
  short: "Kata sandi baru minimal 6 karakter.",
  mismatch: "Konfirmasi kata sandi tidak cocok.",
  current: "Kata sandi saat ini salah.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const user = await requireUser();

  const avatarUrl = user.avatar_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.avatar_path}`
    : null;

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Profile</h1>
        <p className="text-sm text-ink-3">Your account details and security settings.</p>
      </div>

      {saved && (
        <div className="alert-success mb-4">
          {saved === "password" ? "Kata sandi berhasil diperbarui." : "Profil berhasil disimpan."}
        </div>
      )}
      {error && (
        <div className="alert-error mb-4">
          {ERRORS[error] ?? decodeURIComponent(error)}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="card card-pad text-center">
            <div className="mb-3 flex justify-center">
              <Avatar name={user.full_name} src={avatarUrl} size={92} />
            </div>
            <p className="text-[15px] font-bold text-ink">{user.full_name}</p>
            <p className="text-[12px] text-ink-3">{roleLabel(user.role)}</p>
            <p className="mt-1 text-[11.5px] text-ink-3">{user.email}</p>

            <form action={uploadAvatar} className="mt-4 space-y-2 text-left">
              <label className="label">Change avatar</label>
              <input type="file" name="avatar" accept="image/*" required className="input py-1.5 text-[11.5px]" />
              <SubmitButton className="btn-outline btn-sm w-full" pendingLabel="Mengunggah…">
                <Icon name="upload" size={14} />
                Upload
              </SubmitButton>
            </form>
          </div>

          <div className="card card-pad">
            <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-ink-3">
              Account
            </h2>
            <dl className="space-y-2 text-[12.5px]">
              {[
                ["Username", user.username ?? "—"],
                ["ID number", user.idnumber ?? "—"],
                ["Role", roleLabel(user.role)],
                ["Institution", user.institution ?? "—"],
                ["Programme", user.study_program ?? "—"],
                ["Last login", user.last_login_at ? formatDateTime(user.last_login_at) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="card">
            <div className="card-head">
              <h2 className="text-[14px] font-bold text-ink">Personal details</h2>
            </div>
            <form action={profileUpdate} className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="field sm:col-span-2">
                <label className="label">Full name</label>
                <input name="full_name" defaultValue={user.full_name} className="input" required />
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <input name="phone" defaultValue={user.phone ?? ""} className="input" />
              </div>
              <div className="field">
                <label className="label">Institution</label>
                <input name="institution" defaultValue={user.institution ?? ""} className="input" />
              </div>
              <div className="field">
                <label className="label">Study programme</label>
                <input
                  name="study_program"
                  defaultValue={user.study_program ?? ""}
                  className="input"
                />
              </div>
              <div className="field">
                <label className="label">Interface language</label>
                <select name="lang" defaultValue={user.lang} className="select">
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton className="btn-brand">Save changes</SubmitButton>
              </div>
            </form>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="text-[14px] font-bold text-ink">Change password</h2>
            </div>
            <form action={passwordUpdate} className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="field sm:col-span-2">
                <label className="label">Current password</label>
                <input
                  type="password"
                  name="current_password"
                  required
                  autoComplete="current-password"
                  className="input"
                />
              </div>
              <div className="field">
                <label className="label">New password</label>
                <input
                  type="password"
                  name="new_password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input"
                />
              </div>
              <div className="field">
                <label className="label">Confirm new password</label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <SubmitButton className="btn-outline">Update password</SubmitButton>
              </div>
            </form>
          </section>

          <section className="card card-pad text-[12.5px] leading-relaxed text-ink-2">
            <h2 className="mb-1.5 text-[13px] font-bold text-ink">Security</h2>
            <p>
              MFA is enforced by the university SSO provider. Passwords are hashed by Supabase
              Auth and never stored in application tables.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
