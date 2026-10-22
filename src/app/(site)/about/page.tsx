import { PageHeader } from "@/components/site/PageHeader";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Learning Management System"
        subtitle="A single place for course delivery across Telkom University campuses."
        icon="building"
      />
      <main className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <article className="prose-page">
            <p>
              The LMS is the learning platform used by Telkom University to deliver
              blended and fully online courses. Every course page combines learning
              materials, activities, participants and grades, so students and lecturers
              work from the same source of truth.
            </p>

            <h2>Campuses</h2>
            <ul>
              <li>Telkom University Bandung (TUB) — Jl. Telekomunikasi No. 1, Bandung</li>
              <li>Telkom University Jakarta (TUJ) — Jl. Raya Daan Mogot, Jakarta Barat</li>
              <li>Telkom University Purwokerto (TUP) — Jl. Pancurawis, Purwokerto</li>
              <li>Telkom University Surabaya (TUS) — Jl. Ketintang, Surabaya</li>
            </ul>

            <h2>What you can do</h2>
            <h3>Students</h3>
            <ul>
              <li>Browse the course catalogue, self-enrol with an enrolment key, and track progress per activity.</li>
              <li>Submit assignments as files or online text and read lecturer feedback.</li>
              <li>Take timed quizzes with multiple attempts; the best score counts.</li>
              <li>Discuss in course forums, follow the calendar, and check the weighted gradebook.</li>
            </ul>
            <h3>Lecturers</h3>
            <ul>
              <li>Build course sections and activities: assignments, quizzes, forums and resources.</li>
              <li>Author a question bank with multiple choice, true/false, short answer and essay questions.</li>
              <li>Grade submissions and essay answers, manage grade items and weights.</li>
              <li>Enrol participants and publish course announcements.</li>
            </ul>
            <h3>Administrators</h3>
            <ul>
              <li>Manage users, courses, categories, announcements and site settings.</li>
              <li>Review site statistics, course activity and daily login reports.</li>
            </ul>

            <h2>Technology</h2>
            <p>
              This implementation is built with Next.js (App Router, Server Actions) and
              Supabase (Postgres, Auth, Storage). It is an educational replica of the
              public LMS interface — not an official Telkom University service.
            </p>
          </article>

          <aside className="space-y-4">
            <div className="card card-pad">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-3">
                Quick facts
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Academic year</dt>
                  <dd className="font-semibold text-ink">2026/2027</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Semester</dt>
                  <dd className="font-semibold text-ink">Ganjil</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Grade scale</dt>
                  <dd className="font-semibold text-ink">A – E</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Language</dt>
                  <dd className="font-semibold text-ink">English / Indonesia</dd>
                </div>
              </dl>
            </div>
            <div className="card card-pad">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink-3">
                Support
              </h2>
              <p className="text-sm text-ink-2">
                Reach the CeLOE helpdesk at{" "}
                <a className="font-semibold text-brand" href="mailto:clove@telkomuniversity.ac.id">
                  clove@telkomuniversity.ac.id
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
