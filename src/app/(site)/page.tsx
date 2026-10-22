import Link from "next/link";
import { AnnouncementCard } from "@/components/site/AnnouncementCard";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Icon } from "@/components/ui/Icon";
import { getCurrentUser, roleLabel } from "@/lib/auth";
import { getAnnouncements } from "@/lib/data";
import { getT } from "@/lib/i18n";

export default async function HomePage() {
  const [{ locale, t }, user, announcements] = await Promise.all([
    getT(),
    getCurrentUser(),
    getAnnouncements({ siteOnly: true, limit: 4 }),
  ]);

  return (
    <main className="bg-canvas py-6">
      <div className="container-page">
        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <HeroCarousel />

          <aside
            className="card flex h-[380px] flex-col gap-3 overflow-hidden p-4"
            aria-label="Announcements"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">{t("announcements")}</h2>
              <Link
                href="/announcements"
                className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand hover:underline"
              >
                {t("viewAll")}
                <Icon name="chevronRight" size={13} />
              </Link>
            </div>

            <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
              {announcements.length === 0 && (
                <p className="text-sm text-ink-3">{t("noData")}</p>
              )}
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} locale={locale} compact />
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-[var(--color-line-soft)] bg-white px-5 py-4 sm:flex-row sm:items-center">
          {user ? (
            <>
              <p className="text-sm text-ink-2">
                {locale === "id" ? "Anda masuk sebagai" : "Signed in as"}{" "}
                <strong className="text-ink">{user.full_name}</strong>{" "}
                <span className="text-ink-3">({roleLabel(user.role)})</span>
              </p>
              <Link href="/my" className="btn-brand">
                <Icon name="grid" size={16} />
                {t("goToDashboard")}
              </Link>
            </>
          ) : (
            <>
              <div className="text-sm text-ink-2">
                <p>
                  {locale === "id"
                    ? "Gunakan akun SSO Anda untuk masuk."
                    : "Use your SSO Account to Log in."}{" "}
                  {locale === "id" ? "Bermasalah dengan akun?" : "Trouble with your account?"}{" "}
                  <a
                    className="font-semibold text-brand hover:underline"
                    href="https://satu.telkomuniversity.ac.id/auth/login"
                    target="_blank"
                    rel="noreferrer"
                  >
                    SATU
                  </a>
                  .
                </p>
              </div>
              <Link href="/login" className="btn-brand">
                <Icon name="lock" size={16} />
                {t("loginToLms")}
              </Link>
            </>
          )}
        </div>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">
                {locale === "id" ? "Jelajahi LMS" : "Explore the LMS"}
              </h2>
              <p className="text-sm text-ink-3">
                {locale === "id"
                  ? "Semua yang Anda butuhkan untuk perkuliahan daring."
                  : "Everything you need for online course delivery."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "book" as const,
                title: locale === "id" ? "Mata kuliah" : "Courses",
                body:
                  locale === "id"
                    ? "Materi, aktivitas, dan peserta dalam satu tempat."
                    : "Materials, activities and participants in one place.",
                href: "/course",
              },
              {
                icon: "checkCircle" as const,
                title: locale === "id" ? "Tugas" : "Assignments",
                body:
                  locale === "id"
                    ? "Kumpulkan berkas atau teks daring, lihat nilai dan umpan balik."
                    : "Submit files or online text, see grades and feedback.",
                href: "/my",
              },
              {
                icon: "award" as const,
                title: locale === "id" ? "Kuis" : "Quizzes",
                body:
                  locale === "id"
                    ? "Kerjakan kuis dengan timer dan pembahasan otomatis."
                    : "Timed quizzes with automatic grading and review.",
                href: "/my",
              },
              {
                icon: "chart" as const,
                title: locale === "id" ? "Buku nilai" : "Gradebook",
                body:
                  locale === "id"
                    ? "Bobot penilaian dan konversi huruf mutu A–E."
                    : "Weighted gradebook with A–E letter conversion.",
                href: "/my/grades",
              },
            ].map((f) => (
              <Link key={f.title} href={f.href} className="card card-pad transition hover:shadow-md">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={f.icon} size={20} />
                </span>
                <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{f.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
