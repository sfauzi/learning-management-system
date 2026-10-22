import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { enrolledCourseIds, getGradebook } from "@/lib/data";
import { computeCourseGrade, letterTone } from "@/lib/grades";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Grades" };

export default async function GradesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const ids = await enrolledCourseIds(user.id);
  const book = await getGradebook(ids);

  const rows = book
    .filter((row) => row.items.length > 0)
    .map((row) => {
      const own = row.grades.filter((g) => g.user_id === user.id);
      return { course: row.course, ...computeCourseGrade(row.items, own) };
    });

  const average =
    rows.length > 0
      ? Number((rows.reduce((s, r) => s + r.final, 0) / rows.length).toFixed(2))
      : 0;

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {locale === "id" ? "Buku nilai" : "Gradebook"}
          </h1>
          <p className="text-sm text-ink-3">
            {locale === "id"
              ? "Nilai berbobot per mata kuliah dan konversi huruf mutu."
              : "Weighted grades per course with letter-grade conversion."}
          </p>
        </div>
        {rows.length > 0 && (
          <div className="card flex items-center gap-3 px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
              {locale === "id" ? "Rata-rata" : "Average"}
            </span>
            <span className="text-lg font-bold text-ink">{average}</span>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card card-pad text-sm text-ink-2">
          {locale === "id"
            ? "Belum ada nilai. Pastikan Anda terdaftar pada mata kuliah."
            : "No grades yet — enrol in a course to see your gradebook."}
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => (
            <section key={row.course.id} className="card overflow-hidden">
              <div className="card-head">
                <div>
                  <Link
                    href={`/course/${row.course.id}`}
                    className="text-[15px] font-bold text-ink hover:text-brand"
                  >
                    {row.course.fullname}
                  </Link>
                  <p className="text-[11.5px] text-ink-3">
                    {row.course.shortname} · {row.course.credits} SKS ·{" "}
                    {row.course.teacher?.full_name ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                      {locale === "id" ? "Nilai akhir" : "Final"}
                    </p>
                    <p className="text-lg font-bold text-ink">{row.final}</p>
                  </div>
                  <span className={`badge-${letterTone(row.letter)} text-sm`}>
                    {row.letter}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{locale === "id" ? "Item penilaian" : "Grade item"}</th>
                      <th className="text-center">Bobot</th>
                      <th className="text-center">Nilai</th>
                      <th className="text-center">Maks</th>
                      <th>{locale === "id" ? "Umpan balik" : "Feedback"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.cells.map((cell) => (
                      <tr key={cell.item.id}>
                        <td>
                          <span className="font-medium text-ink">{cell.item.name}</span>
                          <span className="ml-2 badge-neutral capitalize">{cell.item.item_type}</span>
                        </td>
                        <td className="text-center text-ink-2">{Number(cell.weight)}%</td>
                        <td className="text-center font-semibold text-ink">
                          {cell.grade ?? "—"}
                        </td>
                        <td className="text-center text-ink-3">{cell.max}</td>
                        <td className="max-w-[260px] text-[12.5px] text-ink-2">
                          {cell.feedback ?? "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-soft/60">
                      <td className="font-bold text-ink">
                        {locale === "id" ? "Total" : "Total"}
                      </td>
                      <td className="text-center font-semibold text-ink-2">
                        {row.totalWeight}%
                      </td>
                      <td className="text-center font-bold text-ink">{row.final}</td>
                      <td className="text-center text-ink-3">100</td>
                      <td className="text-[12.5px] text-ink-3">
                        {locale === "id" ? "Huruf mutu" : "Letter grade"}:{" "}
                        <strong className="text-ink">{row.letter}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <div className="card card-pad text-[12.5px] leading-relaxed text-ink-2">
            <p className="mb-1 font-bold text-ink">Konversi huruf mutu</p>
            <p>
              A ≥ 85 · AB ≥ 75 · B ≥ 70 · BC ≥ 65 · C ≥ 60 · D ≥ 50 · E &lt; 50. Nilai akhir
              dihitung dari Σ(nilai ÷ maks × bobot) ÷ Σbobot × 100.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
