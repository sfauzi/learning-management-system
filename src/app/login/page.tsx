import Link from "next/link";
import { redirect } from "next/navigation";
import { SsoPanel, WelcomePanel } from "@/components/auth/LoginPanels";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signIn } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { safePath } from "@/lib/utils";

export const metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  missing: "Username/e-mail dan kata sandi wajib diisi.",
  credentials: "Akun tidak ditemukan atau kata sandi salah.",
  ratelimit: "Terlalu banyak percobaan. Coba lagi dalam satu menit.",
  suspended: "Akun Anda ditangguhkan. Hubungi dukungan situs.",
  sso_email: "Gunakan e-mail institusi @telkomuniversity.ac.id.",
  sso_disabled: "SSO tidak tersedia pada deployment ini. Gunakan login kredensial.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const [{ error, next }, user, settings] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getSettings(),
  ]);

  if (user) redirect("/my");
  const target = safePath(next, "/my");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <WelcomePanel siteName={settings.site_name} tagline={settings.site_tagline} />

      <div className="flex flex-col bg-canvas">
        <div className="flex items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
          >
            <Icon name="arrowLeft" size={15} />
            Back to home
          </Link>
          <Link href="/lang/id?next=/login" className="text-[12px] font-medium text-ink-3 hover:text-brand">
            Bahasa Indonesia
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/img/logo_bg_white.png" alt={settings.site_name} className="h-9 w-auto" />
              <span className="text-[17px] font-bold text-brand">{settings.site_name}</span>
            </div>

            <div className="card p-6 sm:p-7">
              <h2 className="text-xl font-bold text-ink">
                Login to {settings.site_name}
              </h2>
              <p className="mt-1 text-[13px] text-ink-3">Use your SSO (Microsoft) Account</p>

              {error && (
                <div className="alert-error mt-4">{ERRORS[error] ?? "Login gagal. Coba lagi."}</div>
              )}

              <form action={signIn} className="mt-5 space-y-4">
                <input type="hidden" name="next" value={target} />
                <div className="field">
                  <label className="label" htmlFor="identifier">
                    Username or e-mail
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="ade.kurniawan / nama@student.telkomuniversity.ac.id"
                    className="input"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="input"
                  />
                </div>
                <SubmitButton className="btn-brand w-full py-3" pendingLabel="Memproses…">
                  Sign in
                </SubmitButton>
              </form>

              <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-ink-4">
                <span className="h-px flex-1 bg-[var(--color-line-soft)]" />
                or
                <span className="h-px flex-1 bg-[var(--color-line-soft)]" />
              </div>

              <SsoPanel next={target} />

              <div className="mt-6 rounded-xl bg-soft p-4 text-[12px] leading-relaxed text-ink-2">
                <p className="mb-1.5 font-bold uppercase tracking-wider text-ink-3">
                  Demo accounts
                </p>
                <p>
                  <code className="rounded bg-white px-1 py-0.5">admin</code> ·{" "}
                  <code className="rounded bg-white px-1 py-0.5">ade.kurniawan</code> ·{" "}
                  <code className="rounded bg-white px-1 py-0.5">andi.saputra</code> — password{" "}
                  <code className="rounded bg-white px-1 py-0.5">password</code>
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-[12px] text-ink-3">
              Trouble with your account? Visit{" "}
              <a
                href="https://satu.telkomuniversity.ac.id/auth/login"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-brand hover:underline"
              >
                SATU
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
