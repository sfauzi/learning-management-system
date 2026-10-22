import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-[var(--color-line-soft)] bg-soft">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink">
            Center of e-Learning and Open Education
          </h3>
          <div className="space-y-1 text-[13px] leading-relaxed text-ink-2">
            <p className="font-semibold text-ink">Address</p>
            {(settings.footer_address ?? "").split("\n").map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink">
            Contact
          </h3>
          <ul className="space-y-1.5 text-[13px] text-ink-2">
            <li>
              <span className="font-semibold text-ink">Email:</span>{" "}
              <a className="hover:text-brand" href={`mailto:${settings.support_email}`}>
                {settings.support_email}
              </a>
            </li>
            <li>
              <span className="font-semibold text-ink">WA Dosen:</span>{" "}
              {settings.support_wa_lecturer}
            </li>
            <li>
              <span className="font-semibold text-ink">WA Mahasiswa:</span>{" "}
              {settings.support_wa_student}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink">
            LMS
          </h3>
          <ul className="space-y-1.5 text-[13px] text-ink-2">
            <li><Link className="hover:text-brand" href="/about">About</Link></li>
            <li><Link className="hover:text-brand" href="/faq">FAQ</Link></li>
            <li><Link className="hover:text-brand" href="/tutorial">Tutorial</Link></li>
            <li><Link className="hover:text-brand" href="/announcements">Announcements</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink">
            Legal
          </h3>
          <ul className="space-y-1.5 text-[13px] text-ink-2">
            <li><Link className="hover:text-brand" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-brand" href="/terms">Terms</Link></li>
            <li><Link className="hover:text-brand" href="/support">Contact site support</Link></li>
            <li>
              <a
                className="hover:text-brand"
                href="https://satu.telkomuniversity.ac.id/auth/login"
                target="_blank"
                rel="noreferrer"
              >
                SATU
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--color-line-soft)]">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-ink-3">
          <p>
            © {year} {settings.site_short_name}. Educational replica — not affiliated
            with Telkom University.
          </p>
          <p>{settings.site_tagline}</p>
        </div>
      </div>
    </footer>
  );
}
