import { PageHeader } from "@/components/site/PageHeader";

export const metadata = { title: "FAQ" };

const faqs = [
  {
    q: "How do I log in?",
    a: "Use the Login button in the top navigation. You can sign in with your SSO e-mail (name@telkomuniversity.ac.id for lecturers and staff, name@student.telkomuniversity.ac.id for students) or with your username. Demo accounts on this replica use the password “password”.",
  },
  {
    q: "I forgot my password. What should I do?",
    a: "Open SATU (satu.telkomuniversity.ac.id) and reset your password there. LMS uses the same SSO credentials, so a reset in SATU applies here as well.",
  },
  {
    q: "How do I enrol in a course?",
    a: "Open Course catalogue, pick a course that allows self-enrolment, and press “Enrol me”. If the course requires an enrolment key, ask your lecturer for it. Courses you are enrolled in appear under My courses.",
  },
  {
    q: "Why can I not see the course content?",
    a: "Content is only visible to enrolled participants and the lecturer who owns the course. If you have just enrolled, refresh the page — the enrolment is applied immediately.",
  },
  {
    q: "How many times can I attempt a quiz?",
    a: "The number of attempts is set per quiz by the lecturer (commonly 1–3). When attempts run out, the quiz page shows the best score you achieved.",
  },
  {
    q: "My quiz submission had an essay answer and shows no score.",
    a: "Essay answers cannot be graded automatically, so the attempt is flagged as “needs grading”. Your lecturer grades it from the question bank screen and the score is then added to the gradebook.",
  },
  {
    q: "How is my final grade calculated?",
    a: "Each grade item carries a weight. The final score is Σ(grade ÷ max × weight) ÷ Σweight × 100, converted to a letter: A ≥ 85, AB ≥ 75, B ≥ 70, BC ≥ 65, C ≥ 60, D ≥ 50, otherwise E.",
  },
  {
    q: "What file types and sizes can I upload?",
    a: "Assignments accept PDF, DOC/DOCX, ZIP, images and plain text up to 20 MB. Course materials uploaded by lecturers are limited to 25 MB.",
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        subtitle="Short answers to the questions the helpdesk receives most often."
        icon="help"
      />
      <main className="container-page py-8">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              className="card group p-0 [&_summary]:cursor-pointer"
              open={i === 0}
            >
              <summary className="flex items-center justify-between gap-3 px-5 py-4 text-[15px] font-semibold text-ink">
                {f.q}
                <span className="text-ink-3 transition group-open:rotate-180">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <p className="border-t border-[var(--color-line-soft)] px-5 py-4 text-sm leading-relaxed text-ink-2">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </main>
    </>
  );
}
