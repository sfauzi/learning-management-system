import { PageHeader } from "@/components/site/PageHeader";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Tutorial" };

const studentSteps = [
  { title: "Sign in", body: "Use your SSO e-mail or username on the login page." },
  { title: "Find your courses", body: "My courses lists everything you are enrolled in. Use Course catalogue to join more." },
  { title: "Work through a section", body: "Open a course, expand a section, and click any activity. Mark items done to track progress." },
  { title: "Submit assignments", body: "Open the assignment, upload a file and/or write online text, then press Submit." },
  { title: "Take a quiz", body: "Press Start attempt. The timer counts down and submits automatically when it reaches zero." },
  { title: "Check your grades", body: "Grades shows every item, its weight, and the resulting letter grade." },
];

const teacherSteps = [
  { title: "Open My teaching", body: "Every course where you are the assigned lecturer is listed with its statistics." },
  { title: "Manage content", body: "Add sections, then add activities inside them: assignment, quiz, forum or resource." },
  { title: "Upload materials", body: "Resources accept a file (max 25 MB) or a URL. Files are stored privately and served via signed links." },
  { title: "Build the question bank", body: "Open a quiz → Question bank. Four question types, points, ordering and explanations." },
  { title: "Grade", body: "Grade assignment submissions from the assignment page and essay answers from the question bank." },
];

export default function TutorialPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Tutorial"
        subtitle="A guided tour of the LMS for students and lecturers."
        icon="play"
      />
      <main className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {[
            { heading: "For students", steps: studentSteps, icon: "user" as const },
            { heading: "For lecturers", steps: teacherSteps, icon: "book" as const },
          ].map((group) => (
            <section key={group.heading} className="card card-pad">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={group.icon} size={18} />
                </span>
                <h2 className="text-base font-bold text-ink">{group.heading}</h2>
              </div>
              <ol className="space-y-4">
                {group.steps.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                      <p className="text-[13px] leading-relaxed text-ink-2">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
