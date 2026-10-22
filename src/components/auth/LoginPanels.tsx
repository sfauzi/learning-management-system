"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ssoSignIn } from "@/app/actions/auth";

const COPY = {
  en: {
    title: "Welcome Back!",
    points: [
      "Access restricted only for Lecturer and Student of Telkom University",
      "Login only using your Microsoft Office 365 Account: username + telkomuniversity.ac.id (Lecturer & Staff), username + student.telkomuniversity.ac.id (Student)",
      "If you are experiencing authentication failures, your password may not meet the requirements. Please update your password in SATU.",
    ],
  },
  id: {
    title: "Selamat Datang Kembali!",
    points: [
      "Akses hanya untuk Dosen dan Mahasiswa Telkom University",
      "Login hanya menggunakan Akun Microsoft Office 365: username + telkomuniversity.ac.id (Dosen & Staf), username + student.telkomuniversity.ac.id (Mahasiswa)",
      "Jika Anda mengalami kegagalan login, kata sandi Anda mungkin tidak memenuhi persyaratan. Harap perbarui kata sandi di SATU.",
    ],
  },
};

export function WelcomePanel({
  siteName,
  tagline,
}: {
  siteName: string;
  tagline: string;
}) {
  const [lang, setLang] = useState<"en" | "id">("en");
  const copy = COPY[lang];

  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-9 text-white lg:flex">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-black/10" />
      <div className="pointer-events-none absolute bottom-24 right-10 h-24 w-24 rounded-full bg-white/10" />

      <div className="relative flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/img/logo_bg_white.png" alt={siteName} className="h-10 w-auto" />
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold">{siteName}</span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-white/75">
            {tagline}
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="mb-6 inline-flex rounded-xl bg-white/10 p-1">
          {(["en", "id"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition ${
                lang === code ? "bg-white text-brand" : "text-white/80 hover:text-white"
              }`}
            >
              {code === "en" ? "English" : "Bahasa"}
            </button>
          ))}
        </div>

        <h1 className="text-[32px] font-bold leading-tight">{copy.title}</h1>
        <ul className="mt-5 space-y-3 text-[13px] leading-relaxed text-white/85">
          {copy.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-2 text-[12px] text-white/70">
        <Icon name="globe" size={14} />
        Telkom University · Bandung · Jakarta · Purwokerto · Surabaya
      </div>
    </aside>
  );
}

export function SsoPanel({ next }: { next: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-neutral w-full justify-center border-[var(--color-line)] py-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="2" width="9" height="9" fill="#f25022" />
          <rect x="13" y="2" width="9" height="9" fill="#7fba00" />
          <rect x="2" y="13" width="9" height="9" fill="#00a4ef" />
          <rect x="13" y="13" width="9" height="9" fill="#ffb900" />
        </svg>
        Connect with Office365
      </button>

      {open && (
        <form
          action={ssoSignIn}
          className="mt-3 space-y-3 rounded-xl border border-[var(--color-line-soft)] bg-soft p-4"
        >
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label className="label" htmlFor="sso-email">
              Microsoft 365 e-mail
            </label>
            <input
              id="sso-email"
              name="email"
              type="email"
              required
              placeholder="nama@student.telkomuniversity.ac.id"
              className="input"
            />
          </div>
          <button type="submit" className="btn-brand w-full">
            Continue with Office365
          </button>
          <p className="text-[11px] leading-relaxed text-ink-3">
            Demo SSO: the university IdP is not reachable from this replica, so a seeded
            institutional account is signed in directly.
          </p>
        </form>
      )}
    </div>
  );
}
