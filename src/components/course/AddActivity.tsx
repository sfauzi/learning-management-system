"use client";

import { useState } from "react";
import { moduleStore } from "@/app/actions/courses";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";

type ActivityType = "assign" | "quiz" | "forum" | "resource";

const TYPES: { type: ActivityType; label: string; icon: string; hint: string }[] = [
  { type: "assign", label: "Assignment", icon: "file", hint: "Tugas dengan tenggat, nilai, dan pengumpulan" },
  { type: "quiz", label: "Quiz", icon: "help", hint: "Kuis dengan bank soal, timer, dan penilaian otomatis" },
  { type: "forum", label: "Forum", icon: "message", hint: "Diskusi kelas atau pengumuman" },
  { type: "resource", label: "Resource", icon: "link", hint: "Tautan atau halaman materi" },
];

/**
 * Add-activity form.
 *
 * Rendered as a button row plus ONE full-width form instead of four `<details>`
 * side by side: as flex items each form was squeezed into a ~190px column, so
 * most of the card (the whole right-hand side) was dead space that could not be
 * clicked.
 */
export function AddActivity({
  courseId,
  sectionId,
}: {
  courseId: number;
  sectionId: number;
}) {
  const [type, setType] = useState<ActivityType | null>(null);

  return (
    <div className="border-t border-[var(--color-line-soft)] bg-soft/40 p-3">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => {
          const active = type === t.type;
          return (
            <button
              key={t.type}
              type="button"
              onClick={() => setType(active ? null : t.type)}
              aria-expanded={active}
              className={`btn-xs inline-flex items-center gap-1.5 border ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-[var(--color-line)] bg-white text-ink-2 hover:border-brand/50 hover:text-brand"
              }`}
            >
              <Icon name={active ? "x" : "plus"} size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {type && (
        <form
          action={moduleStore}
          className="mt-3 grid gap-3 rounded-xl border border-[var(--color-line)] bg-white p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="course_id" value={courseId} />
          <input type="hidden" name="section_id" value={sectionId} />
          <input type="hidden" name="type" value={type} />

          <p className="text-[12px] text-ink-3 sm:col-span-2">
            {TYPES.find((t) => t.type === type)?.hint}
          </p>

          <div className="field sm:col-span-2">
            <label className="label">Name</label>
            <input name="name" required className="input" placeholder="Nama aktivitas" />
          </div>

          <div className="field sm:col-span-2">
            <label className="label">Intro / description</label>
            <textarea name="intro" className="textarea min-h-[70px]" />
          </div>

          {type === "assign" && (
            <>
              <div className="field">
                <label className="label">Due date (WIB)</label>
                <input type="datetime-local" name="duedate" className="input" />
              </div>
              <div className="field">
                <label className="label">Max grade</label>
                <input type="number" name="grade_max" min={1} step="0.01" defaultValue={100} className="input" />
              </div>
              <div className="field">
                <label className="label">Weight (%)</label>
                <input type="number" name="weight" min={0} step="0.01" defaultValue={40} className="input" />
              </div>
              <div className="field">
                <label className="label">Submission</label>
                <select name="submission_type" className="select">
                  <option value="file">File</option>
                  <option value="online">Online text</option>
                  <option value="both">File + text</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-ink-2 sm:col-span-2">
                <input type="checkbox" name="allow_late" defaultChecked className="h-4 w-4 accent-[#a12520]" />
                Allow late submission
              </label>
            </>
          )}

          {type === "quiz" && (
            <>
              <div className="field">
                <label className="label">Opens (WIB)</label>
                <input type="datetime-local" name="open_at" className="input" />
              </div>
              <div className="field">
                <label className="label">Closes (WIB)</label>
                <input type="datetime-local" name="close_at" className="input" />
              </div>
              <div className="field">
                <label className="label">Time limit (minutes)</label>
                <input type="number" name="time_limit" min={0} defaultValue={15} className="input" />
              </div>
              <div className="field">
                <label className="label">Max attempts</label>
                <input type="number" name="max_attempts" min={1} defaultValue={1} className="input" />
              </div>
              <div className="field">
                <label className="label">Max grade</label>
                <input type="number" name="grade_max" min={1} step="0.01" defaultValue={100} className="input" />
              </div>
              <div className="field">
                <label className="label">Weight (%)</label>
                <input type="number" name="weight" min={0} step="0.01" defaultValue={20} className="input" />
              </div>
              <p className="rounded-lg bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand sm:col-span-2">
                Soal ditambahkan setelah kuis dibuat: tekan tombol <strong>Bank soal</strong> pada baris kuis.
              </p>
            </>
          )}

          {type === "forum" && (
            <div className="field">
              <label className="label">Forum type</label>
              <select name="forum_type" className="select">
                <option value="general">General forum</option>
                <option value="qanda">Q&amp;A forum</option>
                <option value="announcements">Announcements</option>
              </select>
            </div>
          )}

          {type === "resource" && (
            <>
              <div className="field">
                <label className="label">Kind</label>
                <select name="kind" className="select">
                  <option value="url">URL / link</option>
                  <option value="page">Page (inline text)</option>
                </select>
              </div>
              <div className="field">
                <label className="label">URL</label>
                <input name="url" className="input" placeholder="https://" />
              </div>
              <div className="field sm:col-span-2">
                <label className="label">Page content</label>
                <textarea name="content" className="textarea min-h-[70px]" placeholder="Untuk kind = Page" />
              </div>
            </>
          )}

          <div className="flex items-center gap-2 sm:col-span-2">
            <SubmitButton className="btn-brand btn-sm" pendingLabel="Menyimpan…">
              <Icon name="plus" size={13} />
              Tambah {TYPES.find((t) => t.type === type)?.label}
            </SubmitButton>
            <button type="button" onClick={() => setType(null)} className="btn-ghost btn-sm">
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
