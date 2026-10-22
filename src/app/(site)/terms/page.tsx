import { PageHeader } from "@/components/site/PageHeader";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of use"
        subtitle="Rules for using the LMS."
        icon="file"
      />
      <main className="container-page py-8">
        <article className="prose-page card mx-auto max-w-3xl p-6 sm:p-8">
          <h2>1. Acceptance</h2>
          <p>
            By signing in you agree to use the LMS only for lawful academic purposes and
            in line with university regulations.
          </p>
          <h2>2. Account responsibility</h2>
          <p>
            Credentials are personal. Do not share your password or let another person use
            your session. You are responsible for activity performed with your account.
          </p>
          <h2>3. Acceptable use</h2>
          <ul>
            <li>Do not upload malware, unlawful content, or material that infringes copyright.</li>
            <li>Do not attempt to access courses, grades, or answer keys you are not entitled to.</li>
            <li>Do not interfere with the availability or integrity of the service.</li>
          </ul>
          <h2>4. Academic integrity</h2>
          <p>
            Assessments must reflect your own work. Quizzes may be timed and attempts
            recorded; sharing questions or answers during an active window is misconduct.
          </p>
          <h2>5. Content ownership</h2>
          <p>
            Course materials remain the intellectual property of their authors. You may
            use them for your own study, not for redistribution.
          </p>
          <h2>6. Availability</h2>
          <p>
            The service is provided on a best-effort basis. Scheduled maintenance is
            announced on the front page.
          </p>
          <h2>7. Disclaimer</h2>
          <p>
            This deployment is an educational replica and is not an official Telkom
            University service. All trademarks belong to their respective owners.
          </p>
        </article>
      </main>
    </>
  );
}
