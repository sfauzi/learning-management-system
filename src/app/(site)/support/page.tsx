import { PageHeader } from "@/components/site/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Contact site support" };

export default async function SupportPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Contact site support"
        subtitle="The CeLOE helpdesk handles account, enrolment and access problems."
        icon="message"
      />
      <main className="container-page py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href={`mailto:${settings.support_email}`}
            className="card card-pad transition hover:shadow-md"
          >
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Icon name="message" size={20} />
            </span>
            <h2 className="text-[15px] font-semibold text-ink">E-mail</h2>
            <p className="mt-1 break-all text-sm text-ink-2">{settings.support_email}</p>
            <p className="mt-2 text-xs text-ink-3">Response within 1 business day.</p>
          </a>

          <a
            href={`https://wa.me/62${settings.support_wa_student.replace(/^0/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="card card-pad transition hover:shadow-md"
          >
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icon name="users" size={20} />
            </span>
            <h2 className="text-[15px] font-semibold text-ink">WhatsApp — Students</h2>
            <p className="mt-1 text-sm text-ink-2">{settings.support_wa_student}</p>
            <p className="mt-2 text-xs text-ink-3">Mon–Fri, 08.00–16.00 WIB.</p>
          </a>

          <a
            href={`https://wa.me/62${settings.support_wa_lecturer.replace(/^0/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="card card-pad transition hover:shadow-md"
          >
            <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Icon name="book" size={20} />
            </span>
            <h2 className="text-[15px] font-semibold text-ink">WhatsApp — Lecturers</h2>
            <p className="mt-1 text-sm text-ink-2">{settings.support_wa_lecturer}</p>
            <p className="mt-2 text-xs text-ink-3">Course content and grading support.</p>
          </a>
        </div>

        <div className="card card-pad mt-6">
          <h2 className="mb-2 text-[15px] font-semibold text-ink">Before you write</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-2">
            <li>Check the FAQ — login, enrolment, quiz attempts and grading are covered there.</li>
            <li>Password problems are handled in SATU, not in the LMS.</li>
            <li>Include your username, course shortname and a screenshot when reporting a bug.</li>
          </ul>
          <p className="mt-4 text-sm text-ink-2">
            Account portal:{" "}
            <a
              className="font-semibold text-brand hover:underline"
              href="https://satu.telkomuniversity.ac.id/auth/login"
              target="_blank"
              rel="noreferrer"
            >
              SATU
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
