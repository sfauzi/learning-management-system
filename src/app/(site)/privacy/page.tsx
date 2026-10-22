import { PageHeader } from "@/components/site/PageHeader";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        subtitle="How this LMS handles account and learning data."
        icon="shield"
      />
      <main className="container-page py-8">
        <article className="prose-page card mx-auto max-w-3xl p-6 sm:p-8">
          <h2>1. Data we process</h2>
          <p>
            Account data (name, institutional e-mail, username, student/staff number,
            study programme), enrolment records, learning activity (submissions, quiz
            attempts, forum posts, completion marks) and technical logs (login time, IP
            address, user agent).
          </p>
          <h2>2. Why we process it</h2>
          <p>
            To deliver courses, record academic progress, grade assessments, and provide
            support. Learning records are part of the academic record and are retained for
            the period required by university policy.
          </p>
          <h2>3. Storage and security</h2>
          <p>
            Data is stored in a Postgres database with row-level security. Uploaded files
            live in private object storage and are served through short-lived signed URLs.
            Passwords are hashed by the authentication provider and are never readable by
            application code.
          </p>
          <h2>4. Sharing</h2>
          <p>
            Course participants can see your name and institutional e-mail in the
            participant list. Lecturers see your submissions and grades for their own
            courses. Data is not sold or shared with third parties for marketing.
          </p>
          <h2>5. Your rights</h2>
          <p>
            You may review and correct your profile from the Profile page, and request
            correction of academic records through your faculty administration.
          </p>
          <h2>6. Contact</h2>
          <p>
            Privacy questions: <a href="mailto:clove@telkomuniversity.ac.id">clove@telkomuniversity.ac.id</a>.
          </p>
        </article>
      </main>
    </>
  );
}
