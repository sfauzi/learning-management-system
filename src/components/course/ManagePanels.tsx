"use client";

import { useState } from "react";
import { moduleStore, sectionStore } from "@/app/actions/courses";
import { uploadMaterial } from "@/app/actions/files";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/utils";

type SectionOption = { id: number; name: string | null; section: number };
type ActivityType = "assign" | "quiz" | "forum" | "resource";

const TABS = [
  { key: "section", label: "+ Section", icon: "grid" as const },
  { key: "activity", label: "+ Aktivitas", icon: "plus" as const },
  { key: "material", label: "+ Materi", icon: "upload" as const },
] as const;

const TYPES: { value: ActivityType; label: string; hint: string }[] = [
  { value: "assign", label: "Assignment (tugas)", hint: "Tugas dengan tenggat, nilai, dan pengumpulan berkas." },
  { value: "quiz", label: "Quiz (kuis)", hint: "Kuis dengan bank soal, timer, dan penilaian otomatis." },
  { value: "forum", label: "Forum diskusi", hint: "Ruang diskusi kelas atau pengumuman." },
  { value: "resource", label: "Materi / tautan", hint: "Tautan eksternal atau halaman materi." },
];

/**
 * Right-hand panel of the content manager — mirrors the reference layout:
 * the add forms live in a sticky sidebar, not under the activity list.
 */
export function ManagePanels({
  courseId,
  sections,
}: {
  courseId: number;
  sections: SectionOption[];
}) {
  const [tab, setTab] = useState<"section" | "activity" | "material">("activity");
  const [type, setType] = useState<ActivityType>("assign");

  return (
    <div className="card overflow-hidden">
      <div className="flex border-b border-[var(--color-line-soft)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-selected={tab === t.key}
            className={cn(
              "-mb-px flex-1 border-b-2 px-2 py-2.5 text-[12px] font-semibold transition-colors",
              tab === t.key
                ? "border-brand text-brand"
                : "border-transparent text-ink-3 hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------ section */}
      {tab === "section" && (
        <form action={sectionStore} className="space-y-3 p-4">
          <input type="hidden" name="course_id" value={courseId} />
          <div className="field">
            <label className="label" htmlFor="new-section-name">
              Nama section
            </label>
            <input
              id="new-section-name"
              name="name"
              required
              className="input"
              placeholder="mis. Materi Pertemuan 9-12"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="new-section-summary">
              Ringkasan (opsional)
            </label>
            <textarea
              id="new-section-summary"
              name="summary"
              className="textarea min-h-[70px]"
            />
          </div>
          <SubmitButton className="btn-brand w-full" pendingLabel="Menyimpan…">
            <Icon name="plus" size={14} />
            Tambah section
          </SubmitButton>
        </form>
      )}

      {/* ----------------------------------------------------------- activity */}
      {tab === "activity" && (
        <form action={moduleStore} className="space-y-3 p-4">
          <input type="hidden" name="course_id" value={courseId} />
          <input type="hidden" name="type" value={type} />

          <div className="field">
            <label className="label" htmlFor="act-type">
              Jenis aktivitas
            </label>
            <select
              id="act-type"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              className="select"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="hint">{TYPES.find((t) => t.value === type)?.hint}</p>
          </div>

          <div className="field">
            <label className="label" htmlFor="act-section">
              Section
            </label>
            <select id="act-section" name="section_id" required className="select">
              {sections.length === 0 && <option value="">— buat section dulu —</option>}
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.section + 1}. {s.name ?? `Section ${s.section + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="act-name">
              Nama
            </label>
            <input id="act-name" name="name" required className="input" placeholder="Nama aktivitas" />
          </div>

          <div className="field">
            <label className="label" htmlFor="act-intro">
              Deskripsi / instruksi
            </label>
            <textarea id="act-intro" name="intro" className="textarea min-h-[70px]" />
          </div>

          {type === "assign" && (
            <>
              <div className="field">
                <label className="label">Tenggat (WIB)</label>
                <input type="datetime-local" name="duedate" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="field">
                  <label className="label">Nilai maks</label>
                  <input type="number" name="grade_max" min={1} step="0.01" defaultValue={100} className="input" />
                </div>
                <div className="field">
                  <label className="label">Bobot %</label>
                  <input type="number" name="weight" min={0} step="0.01" defaultValue={40} className="input" />
                </div>
              </div>
              <div className="field">
                <label className="label">Pengumpulan</label>
                <select name="submission_type" className="select">
                  <option value="file">Berkas</option>
                  <option value="online">Teks daring</option>
                  <option value="both">Berkas + teks</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
                <input type="checkbox" name="allow_late" defaultChecked className="h-4 w-4 accent-[#a12520]" />
                Terima pengumpulan terlambat
              </label>
            </>
          )}

          {type === "quiz" && (
            <>
              <div className="field">
                <label className="label">Dibuka (WIB)</label>
                <input type="datetime-local" name="open_at" className="input" />
              </div>
              <div className="field">
                <label className="label">Ditutup (WIB)</label>
                <input type="datetime-local" name="close_at" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="field">
                  <label className="label">Batas waktu</label>
                  <input type="number" name="time_limit" min={0} defaultValue={15} className="input" />
                </div>
                <div className="field">
                  <label className="label">Maks percobaan</label>
                  <input type="number" name="max_attempts" min={1} defaultValue={1} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="field">
                  <label className="label">Nilai maks</label>
                  <input type="number" name="grade_max" min={1} step="0.01" defaultValue={100} className="input" />
                </div>
                <div className="field">
                  <label className="label">Bobot %</label>
                  <input type="number" name="weight" min={0} step="0.01" defaultValue={20} className="input" />
                </div>
              </div>
              <p className="rounded-lg bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand">
                Soal ditambahkan setelah kuis dibuat: tekan <strong>Bank soal</strong> pada baris kuis.
              </p>
            </>
          )}

          {type === "forum" && (
            <div className="field">
              <label className="label">Jenis forum</label>
              <select name="forum_type" className="select">
                <option value="general">Forum umum</option>
                <option value="qanda">Forum Q&amp;A</option>
                <option value="announcements">Pengumuman</option>
              </select>
            </div>
          )}

          {type === "resource" && (
            <>
              <div className="field">
                <label className="label">Jenis</label>
                <select name="kind" className="select">
                  <option value="url">Tautan (URL)</option>
                  <option value="page">Halaman (teks)</option>
                </select>
              </div>
              <div className="field">
                <label className="label">URL</label>
                <input name="url" className="input" placeholder="https://…" />
              </div>
              <div className="field">
                <label className="label">Isi halaman</label>
                <textarea name="content" className="textarea min-h-[70px]" placeholder="Untuk jenis Halaman" />
              </div>
            </>
          )}

          <SubmitButton className="btn-brand w-full" pendingLabel="Menyimpan…">
            <Icon name="plus" size={14} />
            Tambah aktivitas
          </SubmitButton>
        </form>
      )}

      {/* ----------------------------------------------------------- material */}
      {tab === "material" && (
        <form action={uploadMaterial} className="space-y-3 p-4">
          <input type="hidden" name="course_id" value={courseId} />
          <div className="field">
            <label className="label" htmlFor="mat-section">
              Section
            </label>
            <select id="mat-section" name="section_id" required className="select">
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.section + 1}. {s.name ?? `Section ${s.section + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="mat-name">
              Judul materi
            </label>
            <input id="mat-name" name="name" className="input" placeholder="mis. Slide Pertemuan 5" />
          </div>
          <div className="field">
            <label className="label" htmlFor="mat-file">
              Berkas (maks 20 MB)
            </label>
            <input id="mat-file" type="file" name="file" required className="input py-1.5 text-[12px]" />
          </div>
          <div className="field">
            <label className="label" htmlFor="mat-intro">
              Deskripsi
            </label>
            <input id="mat-intro" name="intro" className="input" />
          </div>
          <SubmitButton className="btn-brand w-full" pendingLabel="Mengunggah…">
            <Icon name="upload" size={14} />
            Unggah materi
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
