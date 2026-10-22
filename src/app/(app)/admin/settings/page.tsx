import Link from "next/link";
import { settingsUpdate } from "@/app/actions/admin";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Site settings" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  await requireStaff();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-[900px]">
      <Link
        href="/admin"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-brand"
      >
        <Icon name="arrowLeft" size={15} />
        Site administration
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Site settings</h1>
        <p className="text-sm text-ink-3">
          Branding, support contacts and platform toggles.
        </p>
      </div>

      {saved && <div className="alert-success mb-4">Pengaturan berhasil disimpan.</div>}

      <form action={settingsUpdate} className="space-y-5">
        <section className="card">
          <div className="card-head">
            <h2 className="text-[14px] font-bold text-ink">Identity</h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="field">
              <label className="label">Site name</label>
              <input name="site_name" defaultValue={settings.site_name} className="input" />
            </div>
            <div className="field">
              <label className="label">Tagline</label>
              <input name="site_tagline" defaultValue={settings.site_tagline} className="input" />
            </div>
            <div className="field">
              <label className="label">Long name</label>
              <input
                name="site_short_name"
                defaultValue={settings.site_short_name}
                className="input"
              />
            </div>
            <div className="field">
              <label className="label">Brand colour</label>
              <input
                type="color"
                name="brand_color"
                defaultValue={settings.brand_color}
                className="input h-10 p-1"
              />
            </div>
            <div className="field">
              <label className="label">Academic year</label>
              <input name="academic_year" defaultValue={settings.academic_year} className="input" />
            </div>
            <div className="field">
              <label className="label">Current semester</label>
              <input name="semester" defaultValue={settings.semester} className="input" />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="text-[14px] font-bold text-ink">Support</h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="field">
              <label className="label">Support e-mail</label>
              <input name="support_email" defaultValue={settings.support_email} className="input" />
            </div>
            <div className="field">
              <label className="label">WhatsApp — lecturers</label>
              <input
                name="support_wa_lecturer"
                defaultValue={settings.support_wa_lecturer}
                className="input"
              />
            </div>
            <div className="field">
              <label className="label">WhatsApp — students</label>
              <input
                name="support_wa_student"
                defaultValue={settings.support_wa_student}
                className="input"
              />
            </div>
            <div className="field sm:col-span-2">
              <label className="label">Footer address</label>
              <textarea
                name="footer_address"
                defaultValue={settings.footer_address}
                className="textarea min-h-[90px]"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="text-[14px] font-bold text-ink">Features</h2>
          </div>
          <div className="space-y-3 p-5">
            <label className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
              <input
                type="checkbox"
                name="sso_enabled"
                defaultChecked={settings.sso_enabled === "1"}
                className="h-4 w-4 accent-[#a12520]"
              />
              Office365 / SSO sign-in button enabled
            </label>
            <label className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
              <input
                type="checkbox"
                name="registration_enabled"
                defaultChecked={settings.registration_enabled === "1"}
                className="h-4 w-4 accent-[#a12520]"
              />
              Self-registration enabled (accounts are normally provisioned by SSO)
            </label>
          </div>
        </section>

        <SubmitButton className="btn-brand" pendingLabel="Menyimpan…">
          Save settings
        </SubmitButton>
      </form>
    </div>
  );
}
