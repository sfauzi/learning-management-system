# LMS Telkom University — Next.js + Supabase

Replika fungsional **LMS Telkom University** (`lms.telkomuniversity.ac.id`) yang dibangun ulang dengan **Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage)**.

Referensi perilaku dan desain diambil dari observasi langsung situs aslinya (Moodle 4.5 + tema *remui/edulearn*): hero carousel 4 kampus, panel pengumuman, halaman login SSO, palet warna brand `#a12520`, serta modul pembelajaran (course, assignment, quiz, forum, resource, gradebook).

> Proyek ini adalah **replika edukasional** — bukan afiliasi resmi Telkom University. Seluruh merek, logo, dan foto kampus adalah milik pemegang haknya.

---

## Stack

| Komponen | Versi |
|---|---|
| Next.js | 15.5.28 (App Router, Server Actions, RSC) |
| React | 19.1 |
| Supabase | Postgres 17, Auth (GoTrue), Storage |
| Styling | Tailwind CSS v4 (design token di `globals.css`) |
| Bahasa | TypeScript (strict) |
| Deploy | Vercel-ready |

> **Zona waktu:** semua tanggal/waktu yang diisi dosen dan ditampilkan ke pengguna adalah **WIB (Asia/Jakarta, UTC+7)**, apa pun timezone server-nya. Konversi terpusat di `src/lib/time.ts` (`wibInputToIso` / `isoToWibInput` / `wibParts`).

---

## Fitur

### Publik (tanpa login)
- **Halaman depan** — hero carousel 4 kampus (Bandung, Jakarta, Purwokerto, Surabaya) dengan foto, panel pengumuman, CTA login, footer 4 kolom.
- **Login SSO** — panel sambutan dwibahasa (EN/ID), tombol *Connect with Office365* (mode demo), login kredensial via username **atau** e-mail institusi, rate limit 6 percobaan/menit per identifier.
- Halaman **About, FAQ, Tutorial, Privacy, Terms, Contact support**, daftar & detail pengumuman.
- **Switch bahasa** EN/ID (cookie `lms_lang`, berlaku untuk seluruh chrome UI).

### Mahasiswa
- **Dashboard**: ringkasan course, progres keseluruhan, tugas mendatang, agenda, pengumuman, KPI.
- **Katalog course** dengan pencarian + filter fakultas, **self-enrolment** dengan enrolment key, unenrol.
- **Halaman course**: hero berwarna, tab Course / Participants / Grades, section + aktivitas, tombol *mark done* (completion tracking, persentase progres).
- **Assignment**: unggah berkas (maks 20 MB) dan/atau teks daring, status, nilai, feedback dosen, resubmit.
- **Quiz**: attempt dengan **timer** (auto-submit saat habis), penilaian otomatis, multi-attempt dengan **nilai terbaik**, halaman review dengan jawaban benar + pembahasan. Mendukung pilihan ganda, benar/salah, jawaban singkat (multi alternatif), dan esai.
- **Forum**: buat diskusi, balas, pinned/locked.
- **Resource**: unduh berkas (signed URL), buka tautan, atau baca halaman materi.
- **Gradebook**: bobot per item, nilai akhir terbobot, konversi huruf mutu A/AB/B/BC/C/D/E.
- **Calendar** bulanan + tambah/hapus agenda, **Timeline**, **Messages**, **Notifications**, **Profile** (edit data, avatar, ganti password).

### Dosen (`teacher`)
- **My teaching** — daftar course yang diampu beserta statistik.
- **Kelola konten** (`/course/{id}/manage`):
  - **Section**: tambah, ubah (nama/ringkasan/visibilitas), hapus (cascade), naik/turun urutan, **drag & drop reorder** (juga long-press di layar sentuh).
  - **Aktivitas**: CRUD lengkap untuk Assignment (tenggat, nilai maks, bobot, jenis pengumpulan, allow late), Quiz (buka/tutup, batas waktu, percobaan, **nilai maks**, **bobot**), Forum, Resource (URL/page) + reorder (drag & drop).
  - **Tombol “Bank soal”** langsung pada baris aktivitas kuis menuju editor soal.
  - **Upload materi** — berkas maks 20 MB ke bucket privat `materials`, atau tautan URL.
  - **Item penilaian** — tambah/hapus item manual + bobot.
  - **Peserta** — daftarkan mahasiswa, keluarkan peserta.
  - **Course settings** — nama, kategori, dosen pengampu, warna, SKS, semester, enrolment key, visibilitas.
- **Bank soal kuis** (`/mod/quiz/{id}/build`) — 4 tipe soal, poin per soal, pembahasan, tambah/edit/hapus/duplikat/reorder, serta **penilaian esai manual** langsung dari panel.
- Penilaian pengumpulan tugas dari halaman assignment (otomatis tercermin ke gradebook).
- Otorisasi per-course: dosen hanya bisa mengelola course dengan `teacher_id` miliknya.

### Administrator (`admin` / `manager`)
- Overview statistik situs + log login terbaru.
- **Users**: buat (Supabase Auth admin API), edit, suspend, hapus, filter peran.
- **Courses**: buat (otomatis membuat 4 section awal), hapus, akses penuh ke kelola konten.
- **Announcements**: pengumuman situs & per-course, pin, publish/draft.
- **Site settings**: nama situs, tagline, warna brand, email & WA dukungan, alamat footer, toggle SSO/registrasi.
- **Reports**: statistik peran, login harian (7 hari), rata-rata nilai tugas/kuis, enrolmen per course.

---

## Akun demo

| Username | Password | Peran |
|---|---|---|
| `admin` | `password` | Administrator |
| `ade.kurniawan` | `password` | Dosen — Pemrograman Web Lanjut, Kecerdasan Buatan |
| `najla.adila` | `password` | Dosen — Basis Data Terdistribusi, Desain Pengalaman Pengguna |
| `rizky.pratama` | `password` | Dosen — Jaringan Komputer |
| `siti.rahmawati` | `password` | Dosen — Manajemen Proyek TI |
| `andi.saputra` … `lukman.hakim` | `password` | 12 mahasiswa |

Login bisa lewat **username**, **e-mail institusi**, atau tombol **SSO** (mode demo: masukkan e-mail `@telkomuniversity.ac.id` milik akun terdaftar).

Data demo: 4 fakultas, 6 mata kuliah, 4 section per course, forum + diskusi, resource, assignment, kuis 3 soal, grade item berbobot (40/20/40), dan pengumuman situs.

---

## Menjalankan

```bash
# 1. dependency
pnpm install

# 2. environment
cp .env.example .env.local   # lalu isi kredensial Supabase

# 3. skema database + RLS + storage bucket
pnpm db:push

# 4. akun + data demo
pnpm db:seed

# 5. jalankan
pnpm dev        # http://localhost:3000
```

Build produksi:

```bash
pnpm build && pnpm start
```

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx   # atau anon key legacy
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx                   # server-only
SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DEMO_SSO=1                                                # 1 = tombol Office365 aktif (demo)
DEMO_PASSWORD=password
```

### Scripts

| Script | Fungsi |
|---|---|
| `pnpm db:push` | Menjalankan `supabase/migrations/*.sql` (schema, RLS, bucket) via `psql` |
| `pnpm db:push -- --reset` | Drop schema `public` lalu buat ulang |
| `pnpm db:seed` | Membuat 17 akun + data demo (idempotent) |
| `pnpm db:seed -- --fresh` | Hapus konten (course, kategori, pengumuman) lalu seed ulang |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |

---

## Struktur proyek

```
src/
  app/
    (site)/          # chrome publik: home, about, faq, tutorial, privacy, terms, support, announcements
    login/           # halaman login SSO
    (app)/           # shell terautentikasi (topbar + drawer)
      my/            # dashboard, courses, teaching, timeline, grades
      course/        # katalog, kategori, course, participants, manage
      mod/           # assign, quiz (+attempt/review/build), forum, resource
      calendar/ message/ notifications/ user/profile/
      admin/         # overview, users, courses, announcements, settings, reports
    actions/         # server actions (auth, courses, learning, files, messaging, profile, admin)
    api/files/       # signed-URL download handler (material & submission)
  components/        # UI primitives + site/app/course/quiz components
  lib/               # supabase clients, auth, data, grades, quiz, i18n, settings, utils
supabase/migrations/ # 0001_schema.sql, 0002_rls.sql
scripts/             # apply-schema.mjs, seed.ts
```

### Model data

`profiles` (1:1 auth.users) · `course_categories` · `courses` · `enrollments` · `course_sections` · `course_modules` (polymorphic: assign/quiz/forum/resource) · `module_completions` · `announcements` · `forums` / `forum_discussions` / `forum_posts` · `assignments` / `assignment_submissions` · `quizzes` / `quiz_questions` / `quiz_options` / `quiz_attempts` · `resources` · `grade_items` / `grade_grades` · `calendar_events` · `conversations` / `conversation_participants` / `messages` · `app_notifications` · `settings` · `login_logs`.

### Aturan penilaian

```
final = Σ(nilai ÷ maks × bobot) ÷ Σbobot × 100
A ≥ 85 · AB ≥ 75 · B ≥ 70 · BC ≥ 65 · C ≥ 60 · D ≥ 50 · E < 50
```

Nilai kuis = skor terbaik dari seluruh attempt yang selesai; nilai tugas dan esai yang dinilai dosen otomatis tercermin ke gradebook.

#### Alur nilai kuis (yang sebelumnya kosong)

1. Dosen menambah aktivitas **Quiz** di *Kelola konten* dan mengisi **Max grade** + **Bobot** (default 100 dan 20%).
2. Saat itu juga dibuatkan baris `grade_items` (`item_type = 'quiz'`) sehingga kuis langsung tampil di gradebook — walau belum ada attempt.
3. Dosen menambah soal lewat tombol **Bank soal** (`/mod/quiz/{id}/build`), masing-masing dengan poin sendiri.
4. Mahasiswa mengerjakan; skor = `(poin benar ÷ total poin) × max grade kuis`.
5. Attempt selesai → nilai **terbaik** dari semua attempt di-*mirror* ke `grade_grades`, dan grade item di-*sync* ulang setiap kali dosen mengubah max grade/bobot.

> Penyebab nilai kuis dulu selalu 0: form kuis tidak punya field max grade, sehingga `Number(null)` menyimpan `grade_max = 0` dan setiap skor dikalikan 0. Migration `0003_repair_quiz_grading.sql` memperbaiki data lama, menghitung ulang skor, dan memasang `CHECK (grade_max > 0)` plus unique index `grade_items_activity_uniq` agar tidak terulang.

---

## Keamanan

- **Semua akses database terjadi di server** melalui service-role client, dan setiap query di-scope eksplisit setelah pengguna diautentikasi (`requireUser`, `requireCourseAccess`, `canManageCourse`, `isEnrolled`). Service key tidak pernah dikirim ke browser.
- **RLS aktif di semua tabel** sebagai lapisan kedua: policy per tabel untuk `authenticated`, helper `security definer` (`is_staff`, `is_enrolled`, `can_manage_course`), dan `quiz_options` (kunci jawaban) **dicabut aksesnya** dari `anon`/`authenticated` sehingga hanya service role yang dapat membacanya.
- **Answer key tidak pernah dikirim ke browser** selama attempt berjalan — opsi di-strip sebelum dirender (diverifikasi: tidak ada `is_correct: true` di HTML attempt).
- Berkas materi & submission disimpan di bucket **privat** dan diunduh melalui route yang memeriksa keanggotaan course lalu mengeluarkan **signed URL** berumur 120 detik.
- Password di-hash oleh Supabase Auth; ganti password memverifikasi password lama terlebih dahulu.
- Login dibatasi 6 percobaan gagal per menit per identifier, dan setiap percobaan dicatat di `login_logs`.

## Catatan

- Tema mengikuti palet edulearn: brand `#a12520`, kartu radius 16px, hero 380px, canvas `#f7f9fc`.
- SSO Office365 disimulasikan karena IdP kampus tidak dapat diakses dari deployment ini (`DEMO_SSO=1`).
- Semua data akademik pada seed adalah fiktif.
